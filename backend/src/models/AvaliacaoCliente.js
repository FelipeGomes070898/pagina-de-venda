const pool = require('../config/database');

// Espelha Avaliacao.js, só que na direção prestador → cliente. Tabela
// separada de propósito (avaliacoes_clientes): nunca pode se misturar
// com a nota que o cliente dá pro prestador.
module.exports = {
  async criar({ clienteId, prestadorId, pedidoId, nota, comentario, tags }) {
    const { rows } = await pool.query(
      `INSERT INTO avaliacoes_clientes (cliente_id, prestador_id, pedido_id, nota, comentario, tags)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [clienteId, prestadorId, pedidoId, nota, comentario || null, tags || []],
    );

    await pool.query(
      `UPDATE clientes SET
         total_avaliacoes = total_avaliacoes + 1,
         avaliacao = (
           SELECT ROUND(AVG(nota)::numeric, 1) FROM avaliacoes_clientes WHERE cliente_id = $1
         )
       WHERE id = $1`,
      [clienteId],
    );

    return rows[0];
  },

  async listarPorCliente(clienteId) {
    const { rows } = await pool.query(
      `SELECT ac.*, p.nome AS prestador_nome
       FROM avaliacoes_clientes ac
       JOIN prestadores p ON p.id = ac.prestador_id
       WHERE ac.cliente_id = $1
       ORDER BY ac.criado_em DESC`,
      [clienteId],
    );
    return rows;
  },

  async prestadorPodeAvaliar(prestadorId, pedidoId) {
    const { rows } = await pool.query(
      `SELECT 1 FROM pedidos
       WHERE id = $1 AND prestador_id = $2 AND status = 'concluido'
       AND NOT EXISTS (SELECT 1 FROM avaliacoes_clientes WHERE pedido_id = $1)`,
      [pedidoId, prestadorId],
    );
    return rows.length > 0;
  },
};
