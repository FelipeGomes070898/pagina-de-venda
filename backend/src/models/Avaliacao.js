const pool = require('../config/database');

module.exports = {
  async criar({ prestadorId, clienteId, pedidoId, nota, comentario, tags }) {
    const { rows } = await pool.query(
      `INSERT INTO avaliacoes (prestador_id, cliente_id, pedido_id, nota, comentario, tags)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [prestadorId, clienteId, pedidoId, nota, comentario || null, tags || []],
    );

    await pool.query(
      `UPDATE prestadores SET
         total_avaliacoes = total_avaliacoes + 1,
         avaliacao = (
           SELECT ROUND(AVG(nota)::numeric, 1) FROM avaliacoes WHERE prestador_id = $1
         )
       WHERE id = $1`,
      [prestadorId],
    );

    return rows[0];
  },

  async listarPorPrestador(prestadorId) {
    const { rows } = await pool.query(
      `SELECT a.*, c.nome AS cliente_nome
       FROM avaliacoes a
       JOIN clientes c ON c.id = a.cliente_id
       WHERE a.prestador_id = $1
       ORDER BY a.criado_em DESC`,
      [prestadorId],
    );
    return rows;
  },

  async clientePodeAvaliar(clienteId, pedidoId) {
    const { rows } = await pool.query(
      `SELECT 1 FROM pedidos
       WHERE id = $1 AND cliente_id = $2 AND status = 'concluido'
       AND NOT EXISTS (SELECT 1 FROM avaliacoes WHERE pedido_id = $1)`,
      [pedidoId, clienteId],
    );
    return rows.length > 0;
  },
};
