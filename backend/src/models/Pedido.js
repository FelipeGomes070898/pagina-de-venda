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

  async listarAbertos() {
    const { rows } = await pool.query(
      `SELECT ${CAMPOS} FROM pedidos
       WHERE prestador_id IS NULL AND status = 'pendente'
       ORDER BY criado_em DESC`,
    );
    return rows;
  },

  async listarDoCliente(clienteId) {
    const { rows } = await pool.query(
      `SELECT ${CAMPOS} FROM pedidos WHERE cliente_id = $1 ORDER BY criado_em DESC`,
      [clienteId],
    );
    return rows;
  },

  async listarDoPrestador(prestadorId) {
    const { rows } = await pool.query(
      `SELECT ${CAMPOS} FROM pedidos WHERE prestador_id = $1 ORDER BY criado_em DESC`,
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
