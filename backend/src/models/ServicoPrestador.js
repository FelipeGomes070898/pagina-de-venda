const pool = require('../config/database');

// Serviços extras que o prestador oferece além do segmento principal do
// cadastro — ver comentário da tabela em migrations.sql.
module.exports = {
  async listarPorPrestador(prestadorId) {
    const { rows } = await pool.query(
      `SELECT id, categoria, valor, descricao, criado_em FROM servicos_prestador
       WHERE prestador_id = $1 ORDER BY criado_em ASC`,
      [prestadorId],
    );
    return rows;
  },

  async adicionar(prestadorId, { categoria, valor, descricao }) {
    const { rows } = await pool.query(
      `INSERT INTO servicos_prestador (prestador_id, categoria, valor, descricao)
       VALUES ($1, $2, $3, $4) RETURNING id, categoria, valor, descricao, criado_em`,
      [prestadorId, categoria, valor || null, descricao || null],
    );
    return rows[0];
  },

  // Só remove se o serviço realmente for desse prestador.
  async remover(prestadorId, servicoId) {
    const { rowCount } = await pool.query(
      `DELETE FROM servicos_prestador WHERE id = $1 AND prestador_id = $2`,
      [servicoId, prestadorId],
    );
    return rowCount > 0;
  },
};
