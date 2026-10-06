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

  // Só remove se a foto realmente for desse prestador — devolve a URL
  // removida (null se não encontrou) pra quem chamou apagar do Blob
  // também.
  async remover(prestadorId, fotoId) {
    const { rows } = await pool.query(
      `DELETE FROM fotos_trabalhos WHERE id = $1 AND prestador_id = $2 RETURNING url`,
      [fotoId, prestadorId],
    );
    if (!rows[0]) return null;

    await pool.query(
      `UPDATE prestadores SET total_fotos_trabalho = GREATEST(total_fotos_trabalho - 1, 0) WHERE id = $1`,
      [prestadorId],
    );
    return rows[0].url;
  },
};
