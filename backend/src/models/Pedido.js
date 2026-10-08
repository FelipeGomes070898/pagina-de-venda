const pool = require('../config/database');
const { colunaExiste } = require('../utils/schema');

const CAMPOS_BASE = `
  id, cliente_id, prestador_id, descricao, endereco, lat, lng, valor,
  status, agendado_para, criado_em, pagamento_confirmado_em, pagamento_quando,
  pagamento_forma
`;

// urgente/taxa_urgencia/cupom_codigo/desconto_valor vieram numa migração
// mais recente (cupons/banners/taxa de urgência) — em bancos que ainda
// não rodaram essa migração, essas colunas não existem. Sem essa
// checagem, qualquer leitura/escrita de pedido derruba a tela inteira
// (marketplace, chat, meus pedidos) por causa de 4 colunas opcionais.
// Cacheado (ver utils/schema.js), então só consulta o catálogo do
// Postgres uma vez por processo.
async function temColunasUrgencia() {
  return colunaExiste('pedidos', 'urgente');
}

async function temPagoViaCarteira() {
  return colunaExiste('pedidos', 'pago_via_carteira');
}

async function campos() {
  const partes = [CAMPOS_BASE];
  if (await temColunasUrgencia()) partes.push('urgente, taxa_urgencia, cupom_codigo, desconto_valor');
  if (await temPagoViaCarteira()) partes.push('pago_via_carteira');
  return partes.join(', ');
}

module.exports = {
  // Cliente entra em contato com um prestador específico (fecha o valor
  // anunciado por padrão; pode ser renegociado depois no chat).
  async criarComPrestador({
    clienteId,
    prestadorId,
    descricao,
    valor,
    urgente,
    taxaUrgencia,
    cupomCodigo,
    descontoValor,
  }) {
    const camposSelect = await campos();

    if (await temColunasUrgencia()) {
      const { rows } = await pool.query(
        `INSERT INTO pedidos
           (cliente_id, prestador_id, descricao, valor, status, urgente, taxa_urgencia, cupom_codigo, desconto_valor)
         VALUES ($1, $2, $3, $4, 'pendente', $5, $6, $7, $8)
         RETURNING ${camposSelect}`,
        [
          clienteId,
          prestadorId,
          descricao || null,
          valor || null,
          Boolean(urgente),
          taxaUrgencia || null,
          cupomCodigo || null,
          descontoValor || null,
        ],
      );
      return rows[0];
    }

    const { rows } = await pool.query(
      `INSERT INTO pedidos (cliente_id, prestador_id, descricao, valor, status)
       VALUES ($1, $2, $3, $4, 'pendente')
       RETURNING ${camposSelect}`,
      [clienteId, prestadorId, descricao || null, valor || null],
    );
    return rows[0];
  },

  // Cliente publica uma necessidade em aberto, sem prestador definido,
  // sugerindo um valor (oferta reversa no marketplace).
  async criarAberto({
    clienteId,
    descricao,
    valorSugerido,
    segmento,
    urgente,
    taxaUrgencia,
    cupomCodigo,
    descontoValor,
  }) {
    const camposSelect = await campos();
    const descricaoFinal = segmento ? `[${segmento}] ${descricao || ''}`.trim() : descricao;

    if (await temColunasUrgencia()) {
      const { rows } = await pool.query(
        `INSERT INTO pedidos
           (cliente_id, descricao, valor, status, urgente, taxa_urgencia, cupom_codigo, desconto_valor)
         VALUES ($1, $2, $3, 'pendente', $4, $5, $6, $7)
         RETURNING ${camposSelect}`,
        [
          clienteId,
          descricaoFinal,
          valorSugerido || null,
          Boolean(urgente),
          taxaUrgencia || null,
          cupomCodigo || null,
          descontoValor || null,
        ],
      );
      return rows[0];
    }

    const { rows } = await pool.query(
      `INSERT INTO pedidos (cliente_id, descricao, valor, status)
       VALUES ($1, $2, $3, 'pendente')
       RETURNING ${camposSelect}`,
      [clienteId, descricaoFinal, valorSugerido || null],
    );
    return rows[0];
  },

  // `cidade` compara contra a cidade do CLIENTE que publicou o pedido
  // (clientes.cidade) — mesmo princípio de "mesma cidade" usado no resto
  // do marketplace, senão um prestador em Porto Velho veria pedidos de
  // São Paulo.
  async listarAbertos({ cidade, segmento } = {}) {
    const condicoes = [`p.prestador_id IS NULL`, `p.status = 'pendente'`];
    const valores = [];

    if (cidade) {
      valores.push(cidade);
      condicoes.push(`c.cidade ILIKE $${valores.length}`);
    }
    if (segmento) {
      valores.push(`%[${segmento}]%`);
      condicoes.push(`p.descricao ILIKE $${valores.length}`);
    }

    const comUrgencia = await temColunasUrgencia();
    const colunasUrgencia = comUrgencia ? ', p.urgente, p.taxa_urgencia' : '';
    const ordenacao = comUrgencia ? 'ORDER BY p.urgente DESC, p.criado_em DESC' : 'ORDER BY p.criado_em DESC';

    const { rows } = await pool.query(
      `SELECT p.id, p.cliente_id, p.prestador_id, p.descricao, p.endereco, p.lat, p.lng,
              p.valor, p.status, p.agendado_para, p.criado_em${colunasUrgencia}
       FROM pedidos p
       JOIN clientes c ON c.id = p.cliente_id
       WHERE ${condicoes.join(' AND ')}
       ${ordenacao}`,
      valores,
    );
    return rows;
  },

  // Prestador "assume" um pedido em aberto (sem dono prévio) — mesmo
  // efeito de criarComPrestador, só que iniciado pelo prestador em vez
  // do cliente. O WHERE prestador_id IS NULL torna isso atômico: se dois
  // prestadores responderem ao mesmo tempo, só o primeiro UPDATE pega a
  // linha, o segundo recebe 0 rows (tratado como "já respondido" no
  // controller), nunca os dois.
  async responderAberto(id, prestadorId) {
    const { rows } = await pool.query(
      `UPDATE pedidos SET prestador_id = $2
       WHERE id = $1 AND prestador_id IS NULL AND status = 'pendente'
       RETURNING ${await campos()}`,
      [id, prestadorId],
    );
    return rows[0] || null;
  },

  async listarDoCliente(clienteId) {
    const comUrgencia = await temColunasUrgencia();
    const colunasUrgencia = comUrgencia ? ', p.urgente, p.taxa_urgencia' : '';

    const { rows } = await pool.query(
      `SELECT p.id, p.cliente_id, p.prestador_id, p.descricao, p.endereco, p.lat, p.lng,
              p.valor, p.status, p.agendado_para, p.criado_em${colunasUrgencia},
              pr.nome AS contraparte_nome
       FROM pedidos p
       LEFT JOIN prestadores pr ON pr.id = p.prestador_id
       WHERE p.cliente_id = $1
       ORDER BY p.criado_em DESC`,
      [clienteId],
    );
    return rows;
  },

  async listarDoPrestador(prestadorId) {
    const comUrgencia = await temColunasUrgencia();
    const colunasUrgencia = comUrgencia ? ', p.urgente, p.taxa_urgencia' : '';

    const { rows } = await pool.query(
      `SELECT p.id, p.cliente_id, p.prestador_id, p.descricao, p.endereco, p.lat, p.lng,
              p.valor, p.status, p.agendado_para, p.criado_em${colunasUrgencia},
              c.nome AS contraparte_nome
       FROM pedidos p
       LEFT JOIN clientes c ON c.id = p.cliente_id
       WHERE p.prestador_id = $1
       ORDER BY p.criado_em DESC`,
      [prestadorId],
    );
    return rows;
  },

  async buscarPorId(id) {
    const { rows } = await pool.query(`SELECT ${await campos()} FROM pedidos WHERE id = $1`, [id]);
    return rows[0] || null;
  },

  async atualizarStatus(id, status) {
    const { rows } = await pool.query(
      `UPDATE pedidos SET status = $2 WHERE id = $1 RETURNING ${await campos()}`,
      [id, status],
    );
    return rows[0] || null;
  },

  // Fecha o pedido com o valor combinado na negociação (proposta aceita).
  async fecharComValor(id, valor) {
    const { rows } = await pool.query(
      `UPDATE pedidos SET status = 'andamento', valor = $2 WHERE id = $1 RETURNING ${await campos()}`,
      [id, valor],
    );
    return rows[0] || null;
  },

  // Atestação do cliente — não processa pagamento nenhum, só registra
  // que ele diz ter pago (quando e como), pro prestador ver no chat.
  async confirmarPagamento(id, { quando, forma }) {
    const { rows } = await pool.query(
      `UPDATE pedidos SET pagamento_confirmado_em = NOW(), pagamento_quando = $2, pagamento_forma = $3
       WHERE id = $1 RETURNING ${await campos()}`,
      [id, quando, forma || null],
    );
    return rows[0] || null;
  },

  // Endereço só é gravado quando o pedido é fechado (aceito) no chat.
  async definirEndereco(id, { endereco, lat, lng }) {
    const { rows } = await pool.query(
      `UPDATE pedidos SET endereco = $2, lat = $3, lng = $4 WHERE id = $1 RETURNING ${await campos()}`,
      [id, endereco, lat || null, lng || null],
    );
    return rows[0] || null;
  },

  // "Reivindica" o direito de pagar este pedido pela carteira, antes
  // de mexer em qualquer saldo — o UPDATE condicional (só se ainda não
  // tiver sido reivindicado nem pago) é atômico no Postgres, então
  // dois cliques/duas requisições simultâneas pagando o mesmo pedido
  // nunca passam os dois: só a primeira encontra uma linha pra
  // atualizar, a segunda recebe null de volta. Retorna null também se
  // a coluna ainda não existir (migração não rodada) — carteira fica
  // indisponível até lá, não um comportamento incerto.
  async reivindicarPagamentoComSaldo(id) {
    if (!(await temPagoViaCarteira())) return null;
    const { rows } = await pool.query(
      `UPDATE pedidos SET pago_via_carteira = TRUE
       WHERE id = $1 AND pago_via_carteira IS NOT TRUE AND pagamento_confirmado_em IS NULL
       RETURNING ${await campos()}`,
      [id],
    );
    return rows[0] || null;
  },

  // Desfaz a reivindicação acima quando o pagamento em si falha (ex.:
  // saldo insuficiente, erro de banco) — sem isso o pedido ficaria
  // marcado como "pago pela carteira" pra sempre, sem nunca ter sido
  // cobrado, bloqueando qualquer tentativa futura de pagamento.
  async desfazerReivindicacaoPagamento(id) {
    await pool.query(`UPDATE pedidos SET pago_via_carteira = FALSE WHERE id = $1`, [id]);
  },

  // Contagem simples (sem valores) pro Dashboard geral — visível a toda
  // a equipe, diferente de metricasNegocio() que carrega GMV/ticket
  // médio e fica reservada à tela Financeiro (só dono).
  async contarPorStatus() {
    const { rows } = await pool.query(`SELECT status, COUNT(*) AS quantidade FROM pedidos GROUP BY status`);
    return rows;
  },

  // Métricas de negócio pro painel admin (Financeiro / Dashboard): GMV e
  // ticket médio só contam pedidos concluídos (dinheiro que de fato
  // circulou), separado da receita de taxa de urgência e do desconto
  // total concedido em cupons.
  async metricasNegocio() {
    const comUrgencia = await temColunasUrgencia();
    const colunasExtras = comUrgencia
      ? `,
         COALESCE(SUM(taxa_urgencia) FILTER (WHERE status = 'concluido' AND urgente), 0) AS receita_urgencia,
         COALESCE(SUM(desconto_valor) FILTER (WHERE status = 'concluido'), 0) AS desconto_cupons`
      : `, 0 AS receita_urgencia, 0 AS desconto_cupons`;

    const { rows } = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'concluido') AS total_concluidos,
         COALESCE(SUM(valor) FILTER (WHERE status = 'concluido'), 0) AS gmv,
         COALESCE(AVG(valor) FILTER (WHERE status = 'concluido'), 0) AS ticket_medio${colunasExtras}
       FROM pedidos`,
    );
    return rows[0];
  },

  // Confere se o usuário autenticado do app (cliente ou prestador) é uma
  // das duas partes do pedido — usado no chat e nas ações sobre o pedido.
  ehParte(pedido, usuarioApp) {
    const { id, tipo } = usuarioApp;
    return (
      (tipo === 'cliente' && pedido.cliente_id === id) ||
      (tipo === 'prestador' && pedido.prestador_id === id)
    );
  },
};
