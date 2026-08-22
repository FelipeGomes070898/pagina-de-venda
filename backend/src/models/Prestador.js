const bcrypt = require('bcrypt');
const pool = require('../config/database');

const CAMPOS_PUBLICOS = `
  id, nome, email, telefone, cpf, whatsapp, segmento, valor_servico,
  cidade, estado, pais, lat, lng, raio_km, bio, foto_url, status,
  modelo_cobranca, avaliacao, total_servicos, total_avaliacoes,
  total_fotos_trabalho, idioma, trial_inicio, criado_em
`;

const COLUNA_POR_TIPO = {
  email: 'email',
  telefone: 'telefone',
  cpf: 'cpf',
};

module.exports = {
  async criar({
    nome,
    email,
    telefone,
    cpf,
    senha,
    segmento,
    valorServico,
    cidade,
    estado,
    modeloCobranca,
  }) {
    const senhaHash = await bcrypt.hash(senha, 10);
    const { rows } = await pool.query(
      `INSERT INTO prestadores
         (nome, email, telefone, cpf, senha_hash, segmento, valor_servico,
          cidade, estado, modelo_cobranca)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING ${CAMPOS_PUBLICOS}`,
      [
        nome,
        email,
        telefone,
        cpf,
        senhaHash,
        segmento || null,
        valorServico || null,
        cidade || null,
        estado || null,
        modeloCobranca === 'fixo_mensal' ? 'fixo_mensal' : 'percentual',
      ],
    );
    return rows[0];
  },

  async buscarPorIdentificadorComSenha(tipo, valor) {
    const coluna = COLUNA_POR_TIPO[tipo];
    if (!coluna) return null;
    const { rows } = await pool.query(`SELECT * FROM prestadores WHERE ${coluna} = $1`, [valor]);
    return rows[0] || null;
  },

  async buscarPorId(id) {
    const { rows } = await pool.query(
      `SELECT ${CAMPOS_PUBLICOS} FROM prestadores WHERE id = $1`,
      [id],
    );
    return rows[0] || null;
  },

  async listarAtivos({ cidade, segmento } = {}) {
    const condicoes = [`status = 'ativo'`];
    const valores = [];

    if (cidade) {
      valores.push(cidade);
      condicoes.push(`cidade = $${valores.length}`);
    }
    if (segmento) {
      valores.push(segmento);
      condicoes.push(`segmento = $${valores.length}`);
    }

    const { rows } = await pool.query(
      `SELECT ${CAMPOS_PUBLICOS} FROM prestadores WHERE ${condicoes.join(' AND ')} ORDER BY criado_em DESC`,
      valores,
    );
    return rows;
  },

  async verificarSenha(senha, hash) {
    return bcrypt.compare(senha, hash);
  },

  async atualizarStatus(id, status) {
    const { rows } = await pool.query(
      `UPDATE prestadores SET status = $2 WHERE id = $1 RETURNING ${CAMPOS_PUBLICOS}`,
      [id, status],
    );
    return rows[0] || null;
  },
};
