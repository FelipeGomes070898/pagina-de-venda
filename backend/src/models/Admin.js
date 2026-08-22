const bcrypt = require('bcrypt');
const pool = require('../config/database');

const CAMPOS_PUBLICOS = `
  id, nome, email, cargo, divisao_id, criado_por, ativo, ultimo_login, criado_em
`;

module.exports = {
  CARGOS: ['dono', 'rh', 'gerente', 'atendimento'],

  // Quem pode criar quem (regra de hierarquia da empresa).
  CARGOS_QUE_PODEM_CRIAR: {
    dono: ['rh', 'gerente', 'atendimento'],
    rh: ['gerente', 'atendimento'],
    gerente: [],
    atendimento: [],
  },

  async criar({ nome, email, senha, cargo, divisaoId, criadoPor }) {
    const senhaHash = await bcrypt.hash(senha, 10);
    const { rows } = await pool.query(
      `INSERT INTO admins (nome, email, senha_hash, cargo, divisao_id, criado_por)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${CAMPOS_PUBLICOS}`,
      [nome, email, senhaHash, cargo, divisaoId || null, criadoPor || null],
    );
    return rows[0];
  },

  async buscarPorEmailComSenha(email) {
    const { rows } = await pool.query(`SELECT * FROM admins WHERE email = $1`, [email]);
    return rows[0] || null;
  },

  async buscarPorId(id) {
    const { rows } = await pool.query(
      `SELECT ${CAMPOS_PUBLICOS} FROM admins WHERE id = $1`,
      [id],
    );
    return rows[0] || null;
  },

  async listar({ divisaoId } = {}) {
    if (divisaoId) {
      const { rows } = await pool.query(
        `SELECT ${CAMPOS_PUBLICOS} FROM admins WHERE divisao_id = $1 ORDER BY criado_em DESC`,
        [divisaoId],
      );
      return rows;
    }
    const { rows } = await pool.query(
      `SELECT ${CAMPOS_PUBLICOS} FROM admins ORDER BY criado_em DESC`,
    );
    return rows;
  },

  async verificarSenha(senha, hash) {
    return bcrypt.compare(senha, hash);
  },

  async atualizarStatus(id, ativo) {
    const { rows } = await pool.query(
      `UPDATE admins SET ativo = $2 WHERE id = $1 RETURNING ${CAMPOS_PUBLICOS}`,
      [id, ativo],
    );
    return rows[0] || null;
  },

  async registrarLogin(id) {
    await pool.query(`UPDATE admins SET ultimo_login = NOW() WHERE id = $1`, [id]);
  },
};
