const pool = require('../config/database');

module.exports = {
  async criar({ nome, descricao }) {
    const { rows } = await pool.query(
      `INSERT INTO divisoes (nome, descricao) VALUES ($1, $2) RETURNING *`,
      [nome, descricao || null],
    );
    return rows[0];
  },

  async listarAtivas() {
    const { rows } = await pool.query(
      `SELECT * FROM divisoes WHERE ativa = TRUE ORDER BY nome`,
    );
    return rows;
  },

  async buscarPorId(id) {
    const { rows } = await pool.query(`SELECT * FROM divisoes WHERE id = $1`, [id]);
    return rows[0] || null;
  },
};
