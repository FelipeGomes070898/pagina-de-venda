const bcrypt = require('bcrypt');
const pool = require('../config/database');

const CAMPOS_PUBLICOS = `id, nome, email, telefone, cpf, foto_url, cidade, estado, idioma, criado_em`;

const COLUNA_POR_TIPO = {
  email: 'email',
  telefone: 'telefone',
  cpf: 'cpf',
};

module.exports = {
  async criar({ nome, email, telefone, cpf, senha, cidade, estado, lat, lng, googleId }) {
    const senhaHash = await bcrypt.hash(senha, 10);
    const { rows } = await pool.query(
      `INSERT INTO clientes (nome, email, telefone, cpf, senha_hash, cidade, estado, lat, lng, google_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING ${CAMPOS_PUBLICOS}`,
      [
        nome,
        email,
        telefone,
        cpf,
        senhaHash,
        cidade || null,
        estado || null,
        lat || null,
        lng || null,
        googleId || null,
      ],
    );
    return rows[0];
  },

  async buscarPorIdentificadorComSenha(tipo, valor) {
    const coluna = COLUNA_POR_TIPO[tipo];
    if (!coluna) return null;
    const { rows } = await pool.query(`SELECT * FROM clientes WHERE ${coluna} = $1`, [valor]);
    return rows[0] || null;
  },

  async buscarPorGoogleIdOuEmail(googleId, email) {
    const { rows } = await pool.query(
      `SELECT * FROM clientes WHERE google_id = $1 OR email = $2 LIMIT 1`,
      [googleId, email],
    );
    return rows[0] || null;
  },

  async vincularGoogleId(id, googleId) {
    await pool.query(`UPDATE clientes SET google_id = $2 WHERE id = $1`, [id, googleId]);
  },

  async buscarPorId(id) {
    const { rows } = await pool.query(
      `SELECT ${CAMPOS_PUBLICOS} FROM clientes WHERE id = $1`,
      [id],
    );
    return rows[0] || null;
  },

  async verificarSenha(senha, hash) {
    return bcrypt.compare(senha, hash);
  },
};
