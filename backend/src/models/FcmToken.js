const pool = require('../config/database');

module.exports = {
  // Upsert por token: o mesmo dispositivo pode logar como outro usuário
  // (trocar de conta, reinstalar o app) — o token sempre aponta pro
  // usuário logado mais recente, nunca duplica linha.
  async salvar({ usuarioId, usuarioTipo, token, plataforma }) {
    await pool.query(
      `INSERT INTO fcm_tokens (usuario_id, usuario_tipo, token, plataforma)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (token) DO UPDATE SET usuario_id = $1, usuario_tipo = $2, plataforma = $4`,
      [usuarioId, usuarioTipo, token, plataforma || null],
    );
  },

  async removerToken(token) {
    await pool.query(`DELETE FROM fcm_tokens WHERE token = $1`, [token]);
  },

  async removerTokens(tokens) {
    if (!tokens.length) return;
    await pool.query(`DELETE FROM fcm_tokens WHERE token = ANY($1)`, [tokens]);
  },

  async listarPorUsuario(usuarioId, usuarioTipo) {
    const { rows } = await pool.query(
      `SELECT token FROM fcm_tokens WHERE usuario_id = $1 AND usuario_tipo = $2`,
      [usuarioId, usuarioTipo],
    );
    return rows.map((r) => r.token);
  },
};
