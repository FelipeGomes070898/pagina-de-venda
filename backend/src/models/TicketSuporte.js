const pool = require('../config/database');
const { tabelaExiste } = require('../utils/schema');

const CAMPOS = `
  id, usuario_id, usuario_tipo, usuario_nome, assunto, mensagem,
  status, resposta, atendido_por, criado_em, atualizado_em
`;

const MENSAGEM_INDISPONIVEL =
  'O suporte por aqui ainda não está disponível neste servidor — tente novamente mais tarde.';

module.exports = {
  // tickets_suporte só existe em bancos que já rodaram a migração mais
  // recente — sem essa checagem, a barra de Ajuda derruba com "relation
  // ... does not exist" em vez de um erro claro (ver utils/schema.js).
  async criar({ usuarioId, usuarioTipo, usuarioNome, assunto, mensagem }) {
    if (!(await tabelaExiste('tickets_suporte'))) {
      const erro = new Error(MENSAGEM_INDISPONIVEL);
      erro.status = 503;
      throw erro;
    }

    const { rows } = await pool.query(
      `INSERT INTO tickets_suporte (usuario_id, usuario_tipo, usuario_nome, assunto, mensagem)
       VALUES ($1, $2, $3, $4, $5) RETURNING ${CAMPOS}`,
      [usuarioId, usuarioTipo, usuarioNome, assunto, mensagem],
    );
    return rows[0];
  },

  async listarDoUsuario(usuarioId) {
    if (!(await tabelaExiste('tickets_suporte'))) return [];

    const { rows } = await pool.query(
      `SELECT ${CAMPOS} FROM tickets_suporte WHERE usuario_id = $1 ORDER BY criado_em DESC`,
      [usuarioId],
    );
    return rows;
  },

  async buscarPorId(id) {
    const { rows } = await pool.query(`SELECT ${CAMPOS} FROM tickets_suporte WHERE id = $1`, [id]);
    return rows[0] || null;
  },

  // Painel admin: todos os tickets, com o nome de quem atendeu já
  // junto (evita N+1 na listagem).
  async listarTodos({ status } = {}) {
    if (!(await tabelaExiste('tickets_suporte'))) return [];

    const condicoes = [];
    const valores = [];
    if (status) {
      valores.push(status);
      condicoes.push(`t.status = $${valores.length}`);
    }
    const onde = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
    const { rows } = await pool.query(
      `SELECT t.id, t.usuario_id, t.usuario_tipo, t.usuario_nome, t.assunto, t.mensagem,
              t.status, t.resposta, t.criado_em, t.atualizado_em,
              a.nome AS atendido_por_nome
       FROM tickets_suporte t
       LEFT JOIN admins a ON a.id = t.atendido_por
       ${onde}
       ORDER BY (t.status = 'aberto') DESC, t.criado_em DESC`,
      valores,
    );
    return rows;
  },

  async responder(id, { resposta, status, atendidoPor }) {
    const { rows } = await pool.query(
      `UPDATE tickets_suporte
       SET resposta = $2, status = $3, atendido_por = $4, atualizado_em = NOW()
       WHERE id = $1 RETURNING ${CAMPOS}`,
      [id, resposta || null, status, atendidoPor],
    );
    return rows[0] || null;
  },

  async contarAbertos() {
    if (!(await tabelaExiste('tickets_suporte'))) return 0;

    const { rows } = await pool.query(
      `SELECT COUNT(*) FROM tickets_suporte WHERE status = 'aberto'`,
    );
    return Number(rows[0].count);
  },
};
