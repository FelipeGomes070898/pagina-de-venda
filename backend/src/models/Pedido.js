const pool = require('../config/database');

const CAMPOS = `
  id, cliente_id, prestador_id, descricao, endereco, lat, lng, valor,
  status, agendado_para, criado_em
`;

module.exports = {
  // Cliente entra em contato com um prestador específico (fecha o valor
  // anunciado por padrão; pode ser renegociado depois no chat).
  async criarComPrestador({ clienteId, prestadorId, descricao, valor }) {
    const { rows } = await pool.query(
      `INSERT INTO pedidos (cliente_id, prestador_id, descricao, valor, status)
       VALUES ($1, $2, $3, $4, 'pendente')
       RETURNING ${CAMPOS}`,
      [clienteId, prestadorId, descricao || null, valor || null],
    );
    return rows[0];
  },

  // Cliente publica uma necessidade em aberto, sem prestador definido,
  // sugerindo um valor (oferta reversa no marketplace).
  async criarAberto({ clienteId, descricao, valorSugerido, segmento }) {
    const { rows } = await pool.query(
      `INSERT INTO pedidos (cliente_id, descricao, valor, status)
       VALUES ($1, $2, $3, 'pendente')
       RETURNING ${CAMPOS}`,
      [clienteId, segmento ? `[${segmento}] ${descricao || ''}`.trim() : descricao, valorSugerido || null],
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

    const { rows } = await pool.query(
      `SELECT p.id, p.cliente_id, p.prestador_id, p.descricao, p.endereco, p.lat, p.lng,
              p.valor, p.status, p.agendado_para, p.criado_em
       FROM pedidos p
       JOIN clientes c ON c.id = p.cliente_id
       WHERE ${condicoes.join(' AND ')}
       ORDER BY p.criado_em DESC`,
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
       RETURNING ${CAMPOS}`,
      [id, prestadorId],
    );
    return rows[0] || null;
  },

  async listarDoCliente(clienteId) {
    const { rows } = await pool.query(
      `SELECT p.id, p.cliente_id, p.prestador_id, p.descricao, p.endereco, p.lat, p.lng,
              p.valor, p.status, p.agendado_para, p.criado_em, pr.nome AS contraparte_nome
       FROM pedidos p
       LEFT JOIN prestadores pr ON pr.id = p.prestador_id
       WHERE p.cliente_id = $1
       ORDER BY p.criado_em DESC`,
      [clienteId],
    );
    return rows;
  },

  async listarDoPrestador(prestadorId) {
    const { rows } = await pool.query(
      `SELECT p.id, p.cliente_id, p.prestador_id, p.descricao, p.endereco, p.lat, p.lng,
              p.valor, p.status, p.agendado_para, p.criado_em, c.nome AS contraparte_nome
       FROM pedidos p
       LEFT JOIN clientes c ON c.id = p.cliente_id
       WHERE p.prestador_id = $1
       ORDER BY p.criado_em DESC`,
      [prestadorId],
    );
    return rows;
  },

  async buscarPorId(id) {
    const { rows } = await pool.query(`SELECT ${CAMPOS} FROM pedidos WHERE id = $1`, [id]);
    return rows[0] || null;
  },

  async atualizarStatus(id, status) {
    const { rows } = await pool.query(
      `UPDATE pedidos SET status = $2 WHERE id = $1 RETURNING ${CAMPOS}`,
      [id, status],
    );
    return rows[0] || null;
  },

  // Fecha o pedido com o valor combinado na negociação (proposta aceita).
  async fecharComValor(id, valor) {
    const { rows } = await pool.query(
      `UPDATE pedidos SET status = 'andamento', valor = $2 WHERE id = $1 RETURNING ${CAMPOS}`,
      [id, valor],
    );
    return rows[0] || null;
  },

  // Endereço só é gravado quando o pedido é fechado (aceito) no chat.
  async definirEndereco(id, { endereco, lat, lng }) {
    const { rows } = await pool.query(
      `UPDATE pedidos SET endereco = $2, lat = $3, lng = $4 WHERE id = $1 RETURNING ${CAMPOS}`,
      [id, endereco, lat || null, lng || null],
    );
    return rows[0] || null;
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
