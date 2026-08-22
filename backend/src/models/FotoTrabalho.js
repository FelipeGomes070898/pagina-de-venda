const pool = require('../config/database');

module.exports = {
  async listarPorPrestador(prestadorId) {
    const { rows } = await pool.query(
      `SELECT id, url, legenda, criado_em FROM fotos_trabalhos
       WHERE prestador_id = $1 ORDER BY criado_em DESC`,
      [prestadorId],
    );
    return rows;
  },

  async adicionar(prestadorId, { url, legenda }) {
    const { rows } = await pool.query(
      `INSERT INTO fotos_trabalhos (prestador_id, url, legenda)
       VALUES ($1, $2, $3) RETURNING id, url, legenda, criado_em`,
      [prestadorId, url, legenda || null],
    );
    await pool.query(
      `UPDATE prestadores SET total_fotos_trabalho = total_fotos_trabalho + 1 WHERE id = $1`,
      [prestadorId],
    );
    return rows[0];
  },
};
