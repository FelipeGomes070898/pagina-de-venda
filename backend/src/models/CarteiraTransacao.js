const pool = require('../config/database');

const CAMPOS = `
  id, usuario_id, usuario_tipo, tipo, valor, status, pedido_id,
  asaas_payment_id, asaas_transfer_id, descricao, criado_em
`;

module.exports = {
  // Saldo disponível = soma de tudo que já está 'concluido'. Depósito
  // só vira 'concluido' quando o webhook do Asaas confirma o
  // pagamento — todo o resto (pagamento entre saldos, saque, estorno)
  // já é gravado como 'concluido' na hora (ver comentário da tabela em
  // migrations.sql).
  async saldo(usuarioId, usuarioTipo) {
    const { rows } = await pool.query(
      `SELECT COALESCE(SUM(valor), 0) AS saldo FROM carteira_transacoes
       WHERE usuario_id = $1 AND usuario_tipo = $2 AND status = 'concluido'`,
      [usuarioId, usuarioTipo],
    );
    return Number(rows[0].saldo);
  },

  // Dashboard financeiro (prestador): entrada e saída por mês, últimos
  // 6 meses. Entrada = qualquer crédito (pagamento_recebido, estorno);
  // saída = qualquer débito (saque) — não precisa listar tipo por
  // tipo, só olhar o sinal do valor (ver convenção no topo do
  // migrations.sql).
  async dashboardMensal(usuarioId, usuarioTipo) {
    const { rows } = await pool.query(
      `SELECT TO_CHAR(criado_em, 'YYYY-MM') AS periodo,
              COALESCE(SUM(valor) FILTER (WHERE valor > 0), 0) AS entrada,
              COALESCE(SUM(ABS(valor)) FILTER (WHERE valor < 0), 0) AS saida
       FROM carteira_transacoes
       WHERE usuario_id = $1 AND usuario_tipo = $2 AND status = 'concluido'
         AND criado_em >= NOW() - INTERVAL '6 months'
       GROUP BY periodo
       ORDER BY periodo`,
      [usuarioId, usuarioTipo],
    );
    return rows;
  },

  async extrato(usuarioId, usuarioTipo, { pagina = 1, porPagina = 30 } = {}) {
    const { rows } = await pool.query(
      `SELECT ${CAMPOS} FROM carteira_transacoes
       WHERE usuario_id = $1 AND usuario_tipo = $2
       ORDER BY criado_em DESC
       LIMIT $3 OFFSET $4`,
      [usuarioId, usuarioTipo, porPagina, (pagina - 1) * porPagina],
    );
    return rows;
  },

  // Depósito: cliente pagando uma cobrança Pix/cartão pra colocar
  // dinheiro na carteira. Começa 'pendente' — só conta pro saldo
  // depois que concluirDeposito() rodar (webhook do Asaas).
  async registrarDeposito({ usuarioId, usuarioTipo, valor, asaasPaymentId, descricao }) {
    const { rows } = await pool.query(
      `INSERT INTO carteira_transacoes
         (usuario_id, usuario_tipo, tipo, valor, status, asaas_payment_id, descricao)
       VALUES ($1, $2, 'deposito', $3, 'pendente', $4, $5)
       RETURNING ${CAMPOS}`,
      [usuarioId, usuarioTipo, valor, asaasPaymentId, descricao || 'Depósito na carteira'],
    );
    return rows[0];
  },

  async buscarPorAsaasPaymentId(asaasPaymentId) {
    const { rows } = await pool.query(
      `SELECT ${CAMPOS} FROM carteira_transacoes WHERE asaas_payment_id = $1`,
      [asaasPaymentId],
    );
    return rows[0] || null;
  },

  // Idempotente de propósito (WHERE status = 'pendente'): se o webhook
  // do Asaas disparar o mesmo evento duas vezes, a segunda chamada não
  // credita o valor de novo.
  async concluirDeposito(asaasPaymentId) {
    const { rows } = await pool.query(
      `UPDATE carteira_transacoes SET status = 'concluido', atualizado_em = NOW()
       WHERE asaas_payment_id = $1 AND status = 'pendente'
       RETURNING ${CAMPOS}`,
      [asaasPaymentId],
    );
    return rows[0] || null;
  },

  // Pagamento de um pedido usando o saldo da carteira: debita o
  // cliente (valor cheio) e credita o prestador (já líquido, sem a
  // comissão) — as duas linhas são gravadas numa transação só, pra
  // nunca existir um estado onde uma aconteceu e a outra não. A
  // conferência de saldo suficiente acontece aqui dentro, protegida
  // pelo mesmo client/transação (evita corrida entre duas requisições
  // simultâneas gastando o mesmo saldo).
  async pagarComSaldo({ pedidoId, clienteId, prestadorId, valorTotal, comissao }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Trava por usuário (não por linha — a soma de um ledger não
      // aceita FOR UPDATE direto): serializa duas requisições
      // simultâneas do MESMO cliente gastando o MESMO saldo, sem
      // travar clientes diferentes entre si. Liberada sozinha no
      // COMMIT/ROLLBACK (variante _xact_).
      await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [`cliente:${clienteId}`]);

      const { rows: saldoRows } = await client.query(
        `SELECT COALESCE(SUM(valor), 0) AS saldo FROM carteira_transacoes
         WHERE usuario_id = $1 AND usuario_tipo = 'cliente' AND status = 'concluido'`,
        [clienteId],
      );
      const saldoAtual = Number(saldoRows[0].saldo);
      if (saldoAtual < valorTotal) {
        const erro = new Error('Saldo insuficiente na carteira');
        erro.status = 409;
        throw erro;
      }

      const valorLiquido = Number((valorTotal - comissao).toFixed(2));

      const { rows: debitoRows } = await client.query(
        `INSERT INTO carteira_transacoes
           (usuario_id, usuario_tipo, tipo, valor, status, pedido_id, descricao)
         VALUES ($1, 'cliente', 'pagamento_enviado', $2, 'concluido', $3, 'Pagamento de serviço')
         RETURNING ${CAMPOS}`,
        [clienteId, -valorTotal, pedidoId],
      );
      const { rows: creditoRows } = await client.query(
        `INSERT INTO carteira_transacoes
           (usuario_id, usuario_tipo, tipo, valor, status, pedido_id, descricao)
         VALUES ($1, 'prestador', 'pagamento_recebido', $2, 'concluido', $3, 'Recebimento de serviço')
         RETURNING ${CAMPOS}`,
        [prestadorId, valorLiquido, pedidoId],
      );

      await client.query('COMMIT');
      return { debito: debitoRows[0], credito: creditoRows[0] };
    } catch (erro) {
      await client.query('ROLLBACK').catch(() => {});
      throw erro;
    } finally {
      client.release();
    }
  },

  // Saque: reserva o valor na hora (grava 'concluido' já debitando o
  // saldo — checagem de saldo suficiente protegida por FOR UPDATE, pro
  // mesmo saldo não poder ser gasto duas vezes por duas requisições
  // simultâneas), e dispara a transferência de verdade no Asaas em
  // seguida (ver asaasService.criarTransferenciaPix). Se a
  // transferência falhar, quem chama grava um 'estorno' devolvendo o
  // valor — nunca apaga ou edita esta linha.
  async registrarSaque({ usuarioId, usuarioTipo, valor, asaasTransferId, descricao }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [
        `${usuarioTipo}:${usuarioId}`,
      ]);

      const { rows: saldoRows } = await client.query(
        `SELECT COALESCE(SUM(valor), 0) AS saldo FROM carteira_transacoes
         WHERE usuario_id = $1 AND usuario_tipo = $2 AND status = 'concluido'`,
        [usuarioId, usuarioTipo],
      );
      if (Number(saldoRows[0].saldo) < valor) {
        const erro = new Error('Saldo insuficiente na carteira');
        erro.status = 409;
        throw erro;
      }

      const { rows } = await client.query(
        `INSERT INTO carteira_transacoes
           (usuario_id, usuario_tipo, tipo, valor, status, asaas_transfer_id, descricao)
         VALUES ($1, $2, 'saque', $3, 'concluido', $4, $5)
         RETURNING ${CAMPOS}`,
        [usuarioId, usuarioTipo, -Math.abs(valor), asaasTransferId || null, descricao || 'Saque da carteira'],
      );

      await client.query('COMMIT');
      return rows[0];
    } catch (erro) {
      await client.query('ROLLBACK').catch(() => {});
      throw erro;
    } finally {
      client.release();
    }
  },

  async buscarPorAsaasTransferId(asaasTransferId) {
    const { rows } = await pool.query(
      `SELECT ${CAMPOS} FROM carteira_transacoes WHERE asaas_transfer_id = $1`,
      [asaasTransferId],
    );
    return rows[0] || null;
  },

  // Só liga o id da transferência Asaas à linha do saque já gravada —
  // metadado, não mexe em valor/status (ver comentário no topo do
  // arquivo sobre o ledger nunca mudar o sentido financeiro de uma
  // linha já criada).
  async vincularTransferencia(transacaoId, asaasTransferId) {
    await pool.query(
      `UPDATE carteira_transacoes SET asaas_transfer_id = $2, atualizado_em = NOW() WHERE id = $1`,
      [transacaoId, asaasTransferId],
    );
  },

  // `asaasTransferId` aqui é só pra permitir achar o estorno depois
  // (buscarEstornoPorAsaasTransferId) e evitar duplicar — o Asaas pode
  // reentregar o mesmo webhook TRANSFER_FAILED mais de uma vez.
  async registrarEstorno({ usuarioId, usuarioTipo, valor, asaasTransferId, descricao }) {
    const { rows } = await pool.query(
      `INSERT INTO carteira_transacoes
         (usuario_id, usuario_tipo, tipo, valor, status, asaas_transfer_id, descricao)
       VALUES ($1, $2, 'estorno', $3, 'concluido', $4, $5)
       RETURNING ${CAMPOS}`,
      [usuarioId, usuarioTipo, Math.abs(valor), asaasTransferId || null, descricao || 'Estorno de saque que falhou'],
    );
    return rows[0];
  },

  async buscarEstornoPorAsaasTransferId(asaasTransferId) {
    const { rows } = await pool.query(
      `SELECT ${CAMPOS} FROM carteira_transacoes WHERE tipo = 'estorno' AND asaas_transfer_id = $1`,
      [asaasTransferId],
    );
    return rows[0] || null;
  },
};
