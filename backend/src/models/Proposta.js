const pool = require('../config/database');

module.exports = {
  async listarPorPedido(pedidoId) {
    const { rows } = await pool.query(
      `SELECT * FROM propostas WHERE pedido_id = $1 ORDER BY criado_em ASC`,
      [pedidoId],
    );
    return rows;
  },

  async buscarPorId(id) {
    const { rows } = await pool.query(`SELECT * FROM propostas WHERE id = $1`, [id]);
    return rows[0] || null;
  },

  async criar({ pedidoId, remetenteId, remetenteTipo, valor, descricao }) {
    const { rows } = await pool.query(
      `INSERT INTO propostas (pedido_id, remetente_id, remetente_tipo, valor, descricao)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [pedidoId, remetenteId, remetenteTipo, valor, descricao || null],
    );
    return rows[0];
  },

  async atualizarStatus(id, status) {
    const { rows } = await pool.query(
      `UPDATE propostas SET status = $2 WHERE id = $1 RETURNING *`,
      [id, status],
    );
    return rows[0] || null;
  },
};
