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

  // "Esqueci minha senha" sem e-mail/SMS: confirma a identidade batendo
  // os 3 dados do cadastro ao mesmo tempo (mais difícil de adivinhar do
  // que um só) antes de deixar redefinir a senha.
  async buscarParaRecuperacao(email, cpf, telefone) {
    const { rows } = await pool.query(
      `SELECT id FROM clientes WHERE email = $1 AND cpf = $2 AND telefone = $3`,
      [email, cpf, telefone],
    );
    return rows[0] || null;
  },

  async atualizarSenha(id, senha) {
    const senhaHash = await bcrypt.hash(senha, 10);
    await pool.query(`UPDATE clientes SET senha_hash = $2 WHERE id = $1`, [id, senhaHash]);
  },

  // Painel admin: lista todos os clientes (não existe listagem pública,
  // clientes não navegam outros clientes).
  async listarTodos({ busca, pagina = 1, porPagina = 20 } = {}) {
    const condicoes = [];
    const valores = [];
    if (busca) {
      valores.push(`%${busca}%`);
      condicoes.push(
        `(nome ILIKE $${valores.length} OR email ILIKE $${valores.length} OR cpf ILIKE $${valores.length})`,
      );
    }
    const onde = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
    valores.push(porPagina, (pagina - 1) * porPagina);
    const idxLimit = valores.length - 1;
    const idxOffset = valores.length;

    const { rows } = await pool.query(
      `SELECT ${CAMPOS_PUBLICOS} FROM clientes ${onde}
       ORDER BY criado_em DESC LIMIT $${idxLimit} OFFSET $${idxOffset}`,
      valores,
    );
    return rows;
  },

  async contar({ busca } = {}) {
    const condicoes = [];
    const valores = [];
    if (busca) {
      valores.push(`%${busca}%`);
      condicoes.push(
        `(nome ILIKE $${valores.length} OR email ILIKE $${valores.length} OR cpf ILIKE $${valores.length})`,
      );
    }
    const onde = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
    const { rows } = await pool.query(`SELECT COUNT(*) FROM clientes ${onde}`, valores);
    return Number(rows[0].count);
  },
};
