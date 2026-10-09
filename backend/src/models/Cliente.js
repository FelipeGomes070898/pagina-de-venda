const bcrypt = require('bcrypt');
const crypto = require('crypto');
const pool = require('../config/database');
const { colunaExiste } = require('../utils/schema');

const CAMPOS_PUBLICOS = `id, nome, email, telefone, cpf, foto_url, cidade, estado, idioma, total_servicos, avaliacao, total_avaliacoes, criado_em`;

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

  async definirAsaasCustomerId(id, asaasCustomerId) {
    await pool.query(`UPDATE clientes SET asaas_customer_id = $2 WHERE id = $1`, [
      id,
      asaasCustomerId,
    ]);
  },

  async buscarPorId(id) {
    const { rows } = await pool.query(
      `SELECT ${CAMPOS_PUBLICOS} FROM clientes WHERE id = $1`,
      [id],
    );
    return rows[0] || null;
  },

  // Interno: inclui senha_hash — usado só pra reautenticação (ex.:
  // confirmar a senha antes de excluir a conta). Nunca expor via API.
  async buscarCompletoPorId(id) {
    const { rows } = await pool.query(`SELECT * FROM clientes WHERE id = $1`, [id]);
    return rows[0] || null;
  },

  async verificarSenha(senha, hash) {
    return bcrypt.compare(senha, hash);
  },

  async incrementarServicos(id) {
    await pool.query(`UPDATE clientes SET total_servicos = total_servicos + 1 WHERE id = $1`, [id]);
  },

  async atualizarFoto(id, fotoUrl) {
    const { rows } = await pool.query(
      `UPDATE clientes SET foto_url = $2 WHERE id = $1 RETURNING ${CAMPOS_PUBLICOS}`,
      [id, fotoUrl],
    );
    return rows[0] || null;
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

  // LGPD: registra quando o titular aceitou os Termos de Uso/Política de
  // Privacidade no cadastro. Coluna só existe em bancos que já rodaram a
  // migração mais recente — sem a checagem, cadastro quebraria em
  // produção até lá (ver utils/schema.js).
  async marcarTermosAceitos(id) {
    if (!(await colunaExiste('clientes', 'termos_aceitos_em'))) return;
    await pool.query(`UPDATE clientes SET termos_aceitos_em = NOW() WHERE id = $1`, [id]);
  },

  // LGPD "direito ao esquecimento". Não apaga a linha (pedidos/chat da
  // outra parte continuariam referenciando um cliente inexistente) —
  // anonimiza os dados pessoais e troca a senha por um hash aleatório,
  // então o login para de funcionar sozinho (bcrypt.compare nunca bate
  // com a senha real) sem precisar de uma coluna de status à parte.
  async excluirConta(id) {
    const senhaInvalida = await bcrypt.hash(crypto.randomUUID(), 10);
    const temExcluidoEm = await colunaExiste('clientes', 'excluido_em');

    await pool.query(
      `UPDATE clientes SET
         nome = 'Usuário removido',
         email = 'removido-' || replace(id::text, '-', '') || '@konectaja.invalid',
         telefone = 'x' || left(replace(id::text, '-', ''), 18),
         cpf = left(replace(id::text, '-', ''), 14),
         senha_hash = $2,
         foto_url = NULL,
         google_id = NULL
         ${temExcluidoEm ? ', excluido_em = NOW()' : ''}
       WHERE id = $1`,
      [id, senhaInvalida],
    );
  },

  // LGPD "portabilidade": mesmo recorte de dados que a tela "Meu perfil"
  // já exibe, só que empacotado pra download.
  async exportarDados(id) {
    const { rows } = await pool.query(`SELECT ${CAMPOS_PUBLICOS} FROM clientes WHERE id = $1`, [
      id,
    ]);
    return rows[0] || null;
  },

  // Painel admin: lista todos os clientes (não existe listagem pública,
  // clientes não navegam outros clientes). `cidade` só vem preenchido
  // quando quem pede é um gerente (restrito à própria divisão) —
  // dono/rh/atendimento veem tudo, sem esse filtro.
  async listarTodos({ busca, cidade, pagina = 1, porPagina = 20 } = {}) {
    const condicoes = [];
    const valores = [];
    if (cidade) {
      valores.push(cidade);
      condicoes.push(`cidade ILIKE $${valores.length}`);
    }
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

  async contar({ busca, cidade } = {}) {
    const condicoes = [];
    const valores = [];
    if (cidade) {
      valores.push(cidade);
      condicoes.push(`cidade ILIKE $${valores.length}`);
    }
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

  // Papel duplo (ver authController.tornarPrestador/trocarPapel) —
  // guardado atrás de colunaExiste porque prestador_vinculado_id só
  // existe em bancos que já rodaram a migração mais recente.
  async buscarPrestadorVinculadoId(id) {
    if (!(await colunaExiste('clientes', 'prestador_vinculado_id'))) return null;
    const { rows } = await pool.query(
      `SELECT prestador_vinculado_id FROM clientes WHERE id = $1`,
      [id],
    );
    return rows[0]?.prestador_vinculado_id || null;
  },

  async definirPrestadorVinculado(id, prestadorId) {
    await pool.query(`UPDATE clientes SET prestador_vinculado_id = $2 WHERE id = $1`, [
      id,
      prestadorId,
    ]);
  },
};
