const pool = require('../config/database');

module.exports = {
  async criar({ prestadorId, pedidoId, tipo, valor, metodo, asaasId, vencimento }) {
    const { rows } = await pool.query(
      `INSERT INTO pagamentos (prestador_id, pedido_id, tipo, valor, metodo, asaas_id, vencimento)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [prestadorId, pedidoId || null, tipo, valor, metodo || 'pix', asaasId || null, vencimento || null],
    );
    return rows[0];
  },

  async buscarPorAsaasId(asaasId) {
    const { rows } = await pool.query(`SELECT * FROM pagamentos WHERE asaas_id = $1`, [asaasId]);
    return rows[0] || null;
  },

  async marcarPago(id) {
    const { rows } = await pool.query(
      `UPDATE pagamentos SET status = 'pago', pago_em = NOW() WHERE id = $1 RETURNING *`,
      [id],
    );
    return rows[0] || null;
  },

  async marcarVencido(id) {
    const { rows } = await pool.query(
      `UPDATE pagamentos SET status = 'vencido' WHERE id = $1 RETURNING *`,
      [id],
    );
    return rows[0] || null;
  },

  async listarPorPrestador(prestadorId) {
    const { rows } = await pool.query(
      `SELECT * FROM pagamentos WHERE prestador_id = $1 ORDER BY criado_em DESC`,
      [prestadorId],
    );
    return rows;
  },
};
