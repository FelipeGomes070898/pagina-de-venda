const bcrypt = require('bcrypt');
const pool = require('../config/database');

const CAMPOS_PUBLICOS = `
  id, nome, email, telefone, cpf, whatsapp, segmento, valor_servico,
  cidade, estado, pais, lat, lng, raio_km, bio, foto_url, status,
  modelo_cobranca, avaliacao, total_servicos, total_avaliacoes,
  total_fotos_trabalho, idioma, criado_em
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

  // Marketplace: lista prestadores ativos, mais próximos primeiro quando
  // lat/lng são informados (distância por Haversine, em km). Sem
  // localização, cai para os mais recentes.
  async listarAtivos({ cidade, segmento, lat, lng, pagina = 1, porPagina = 20 } = {}) {
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

    const usarDistancia = lat != null && lng != null;
    let colunaDistancia = 'NULL AS distancia_km';
    let ordenacao = 'ORDER BY criado_em DESC';

    if (usarDistancia) {
      valores.push(lat, lng);
      const idxLat = valores.length - 1;
      const idxLng = valores.length;
      colunaDistancia = `
        ROUND((6371 * acos(
          LEAST(1, GREATEST(-1,
            cos(radians($${idxLat})) * cos(radians(lat)) *
            cos(radians(lng) - radians($${idxLng})) +
            sin(radians($${idxLat})) * sin(radians(lat))
          ))
        ))::numeric, 1) AS distancia_km
      `;
      ordenacao = 'ORDER BY (lat IS NULL OR lng IS NULL), distancia_km ASC';
    }

    valores.push(porPagina, (pagina - 1) * porPagina);
    const idxLimit = valores.length - 1;
    const idxOffset = valores.length;

    const { rows } = await pool.query(
      `SELECT ${CAMPOS_PUBLICOS}, ${colunaDistancia}
       FROM prestadores
       WHERE ${condicoes.join(' AND ')}
       ${ordenacao}
       LIMIT $${idxLimit} OFFSET $${idxOffset}`,
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

  async definirAsaasCustomerId(id, asaasCustomerId) {
    await pool.query(`UPDATE prestadores SET asaas_customer_id = $2 WHERE id = $1`, [
      id,
      asaasCustomerId,
    ]);
  },

  // Interno: retorna o registro completo (com senha_hash e
  // asaas_customer_id), usado pelo asaasService — nunca expor via API.
  async buscarCompletoPorId(id) {
    const { rows } = await pool.query(`SELECT * FROM prestadores WHERE id = $1`, [id]);
    return rows[0] || null;
  },
};
