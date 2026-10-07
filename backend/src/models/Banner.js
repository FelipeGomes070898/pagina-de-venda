const pool = require('../config/database');

const CAMPOS = `id, titulo, imagem_url, link_url, ordem, ativo, criado_em`;

module.exports = {
  async criar({ titulo, imagemUrl, linkUrl, ordem }) {
    const { rows } = await pool.query(
      `INSERT INTO banners (titulo, imagem_url, link_url, ordem)
       VALUES ($1, $2, $3, $4) RETURNING ${CAMPOS}`,
      [titulo || null, imagemUrl, linkUrl || null, ordem || 0],
    );
    return rows[0];
  },

  async contarAtivos() {
    const { rows } = await pool.query(`SELECT COUNT(*) FROM banners WHERE ativo = TRUE`);
    return Number(rows[0].count);
  },

  async listarAtivos() {
    const { rows } = await pool.query(
      `SELECT ${CAMPOS} FROM banners WHERE ativo = TRUE ORDER BY ordem ASC, criado_em DESC`,
    );
    return rows;
  },

  async listarTodos() {
    const { rows } = await pool.query(
      `SELECT ${CAMPOS} FROM banners ORDER BY ordem ASC, criado_em DESC`,
    );
    return rows;
  },

  async atualizar(id, { titulo, imagemUrl, linkUrl, ordem }) {
    const { rows } = await pool.query(
      `UPDATE banners SET titulo = $2, imagem_url = $3, link_url = $4, ordem = $5
       WHERE id = $1 RETURNING ${CAMPOS}`,
      [id, titulo || null, imagemUrl, linkUrl || null, ordem || 0],
    );
    return rows[0] || null;
  },

  async atualizarStatus(id, ativo) {
    const { rows } = await pool.query(
      `UPDATE banners SET ativo = $2 WHERE id = $1 RETURNING ${CAMPOS}`,
      [id, ativo],
    );
    return rows[0] || null;
  },

  async remover(id) {
    await pool.query(`DELETE FROM banners WHERE id = $1`, [id]);
  },
};
