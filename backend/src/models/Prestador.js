const bcrypt = require('bcrypt');
const crypto = require('crypto');
const pool = require('../config/database');
const { tabelaExiste, colunaExiste } = require('../utils/schema');

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
    lat,
    lng,
    modeloCobranca,
    googleId,
    whatsapp,
    dataNascimento,
  }) {
    const senhaHash = await bcrypt.hash(senha, 10);
    // a maioria dos prestadores usa o próprio celular no WhatsApp — só
    // grava um número diferente se ele informar um explicitamente.
    const whatsappFinal = whatsapp || telefone;
    const modeloCobrancaFinal = modeloCobranca === 'fixo_mensal' ? 'fixo_mensal' : 'percentual';

    // data_nascimento só existe em bancos que já rodaram a migração mais
    // recente (split de pagamento/subconta Asaas) — sem essa checagem, o
    // cadastro inteiro quebraria em produção até lá (ver utils/schema.js).
    if (dataNascimento && (await colunaExiste('prestadores', 'data_nascimento'))) {
      const { rows } = await pool.query(
        `INSERT INTO prestadores
           (nome, email, telefone, cpf, senha_hash, segmento, valor_servico,
            cidade, estado, lat, lng, modelo_cobranca, google_id, whatsapp, data_nascimento)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
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
          lat || null,
          lng || null,
          modeloCobrancaFinal,
          googleId || null,
          whatsappFinal,
          dataNascimento,
        ],
      );
      return rows[0];
    }

    const { rows } = await pool.query(
      `INSERT INTO prestadores
         (nome, email, telefone, cpf, senha_hash, segmento, valor_servico,
          cidade, estado, lat, lng, modelo_cobranca, google_id, whatsapp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
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
        lat || null,
        lng || null,
        modeloCobrancaFinal,
        googleId || null,
        whatsappFinal,
      ],
    );
    return rows[0];
  },

  // Split de pagamento (Asaas): registra a subconta criada pro prestador
  // (walletId) e o status de aprovação dela. Colunas novas — se ainda
  // não existirem (migração não rodada), a chamada é best-effort e quem
  // chama (asaasService) já engole o erro, então não precisa de guarda
  // extra aqui.
  async definirAsaasSubconta(id, { walletId, status }) {
    await pool.query(
      `UPDATE prestadores SET asaas_wallet_id = $2, asaas_account_status = $3 WHERE id = $1`,
      [id, walletId, status],
    );
  },

  async buscarPorGoogleIdOuEmail(googleId, email) {
    const { rows } = await pool.query(
      `SELECT * FROM prestadores WHERE google_id = $1 OR email = $2 LIMIT 1`,
      [googleId, email],
    );
    return rows[0] || null;
  },

  async vincularGoogleId(id, googleId) {
    await pool.query(`UPDATE prestadores SET google_id = $2 WHERE id = $1`, [id, googleId]);
  },

  async buscarPorIdentificadorComSenha(tipo, valor) {
    const coluna = COLUNA_POR_TIPO[tipo];
    if (!coluna) return null;
    const { rows } = await pool.query(`SELECT * FROM prestadores WHERE ${coluna} = $1`, [valor]);
    return rows[0] || null;
  },

  // lat/lng opcionais (localização atual de quem está vendo o perfil) —
  // sem eles, distancia_km volta null, igual listarAtivos sem localização.
  async buscarPorId(id, { lat, lng } = {}) {
    const usarDistancia = lat != null && lng != null;
    let colunaDistancia = 'NULL AS distancia_km';
    const valores = [id];

    if (usarDistancia) {
      valores.push(lat, lng);
      colunaDistancia = `
        CASE WHEN lat IS NULL OR lng IS NULL THEN NULL ELSE
          ROUND((6371 * acos(
            LEAST(1, GREATEST(-1,
              cos(radians($2)) * cos(radians(lat)) *
              cos(radians(lng) - radians($3)) +
              sin(radians($2)) * sin(radians(lat))
            ))
          ))::numeric, 1)
        END AS distancia_km
      `;
    }

    const { rows } = await pool.query(
      `SELECT ${CAMPOS_PUBLICOS}, ${colunaDistancia} FROM prestadores WHERE id = $1`,
      valores,
    );
    return rows[0] || null;
  },

  // Marketplace: lista prestadores ativos, mais próximos primeiro quando
  // lat/lng são informados (distância por Haversine, em km). Sem
  // localização, cai para os mais recentes.
  async listarAtivos({ cidade, segmento, busca, lat, lng, excluirId, pagina = 1, porPagina = 20 } = {}) {
    // servicos_prestador só existe em bancos que já rodaram a migração
    // mais recente — sem essa checagem, o marketplace inteiro quebra
    // (não só a busca por serviço extra) num ambiente que ainda não
    // rodou migrations.sql. Degrada pra "sem serviços extras" até lá.
    const comServicosExtras = await tabelaExiste('servicos_prestador');

    const condicoes = [`status = 'ativo'`];
    const valores = [];

    if (excluirId) {
      valores.push(excluirId);
      condicoes.push(`id <> $${valores.length}`);
    }
    if (cidade) {
      // ILIKE (sem %) em vez de = : cidade vem de texto livre quando não
      // tem Google Maps configurado (sem Places API, sem autocomplete
      // padronizado) — "Porto Velho" e "porto velho" têm que contar como
      // a mesma cidade.
      valores.push(cidade);
      condicoes.push(`cidade ILIKE $${valores.length}`);
    }
    if (segmento) {
      valores.push(segmento);
      condicoes.push(
        comServicosExtras
          ? `(segmento = $${valores.length} OR EXISTS (
               SELECT 1 FROM servicos_prestador sp
               WHERE sp.prestador_id = prestadores.id AND sp.categoria = $${valores.length}
             ))`
          : `segmento = $${valores.length}`,
      );
    }
    if (busca) {
      valores.push(`%${busca}%`);
      condicoes.push(
        comServicosExtras
          ? `(nome ILIKE $${valores.length} OR segmento ILIKE $${valores.length} OR EXISTS (
               SELECT 1 FROM servicos_prestador sp
               WHERE sp.prestador_id = prestadores.id AND sp.categoria ILIKE $${valores.length}
             ))`
          : `(nome ILIKE $${valores.length} OR segmento ILIKE $${valores.length})`,
      );
    }

    const usarDistancia = lat != null && lng != null;
    let colunaDistancia = 'NULL AS distancia_km';
    let ordenacao = 'ORDER BY criado_em DESC';

    if (usarDistancia) {
      valores.push(lat, lng);
      const idxLat = valores.length - 1;
      const idxLng = valores.length;
      // CASE explícito porque GREATEST/LEAST do Postgres ignoram NULL em
      // vez de propagar — sem isso, prestador sem lat/lng não cai pra
      // NULL, cai em acos(-1) = meia volta ao mundo (~20015 km), um
      // valor real só que sem sentido nenhum (e o frontend mostraria
      // "20015.1 km" em vez de simplesmente omitir a distância).
      colunaDistancia = `
        CASE WHEN lat IS NULL OR lng IS NULL THEN NULL ELSE
          ROUND((6371 * acos(
            LEAST(1, GREATEST(-1,
              cos(radians($${idxLat})) * cos(radians(lat)) *
              cos(radians(lng) - radians($${idxLng})) +
              sin(radians($${idxLat})) * sin(radians(lat))
            ))
          ))::numeric, 1)
        END AS distancia_km
      `;
      ordenacao = 'ORDER BY (lat IS NULL OR lng IS NULL), distancia_km ASC';
    }

    valores.push(porPagina, (pagina - 1) * porPagina);
    const idxLimit = valores.length - 1;
    const idxOffset = valores.length;

    const colunaServicos = comServicosExtras
      ? `COALESCE((
           SELECT json_agg(json_build_object('id', sp.id, 'categoria', sp.categoria, 'valor', sp.valor) ORDER BY sp.criado_em)
           FROM servicos_prestador sp WHERE sp.prestador_id = prestadores.id
         ), '[]') AS servicos`
      : `'[]'::json AS servicos`;

    const { rows } = await pool.query(
      `SELECT ${CAMPOS_PUBLICOS}, ${colunaDistancia}, ${colunaServicos}
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

  // "Esqueci minha senha" sem e-mail/SMS: confirma a identidade batendo
  // os 3 dados do cadastro ao mesmo tempo (mais difícil de adivinhar do
  // que um só) antes de deixar redefinir a senha.
  async buscarParaRecuperacao(email, cpf, telefone) {
    const { rows } = await pool.query(
      `SELECT id FROM prestadores WHERE email = $1 AND cpf = $2 AND telefone = $3`,
      [email, cpf, telefone],
    );
    return rows[0] || null;
  },

  async atualizarSenha(id, senha) {
    const senhaHash = await bcrypt.hash(senha, 10);
    await pool.query(`UPDATE prestadores SET senha_hash = $2 WHERE id = $1`, [id, senhaHash]);
  },

  // LGPD: registra quando o titular aceitou os Termos de Uso/Política de
  // Privacidade no cadastro. Coluna só existe em bancos que já rodaram a
  // migração mais recente — sem a checagem, cadastro quebraria em
  // produção até lá (ver utils/schema.js).
  async marcarTermosAceitos(id) {
    if (!(await colunaExiste('prestadores', 'termos_aceitos_em'))) return;
    await pool.query(`UPDATE prestadores SET termos_aceitos_em = NOW() WHERE id = $1`, [id]);
  },

  // LGPD "direito ao esquecimento". Não apaga a linha (pedidos/chat/
  // avaliações da outra parte continuariam referenciando um prestador
  // inexistente) — anonimiza os dados pessoais, troca a senha por um
  // hash aleatório (bloqueia o login sozinho) e marca status='inativo'
  // pra sair do marketplace, reaproveitando o filtro que listarAtivos
  // já usa.
  async excluirConta(id) {
    const senhaInvalida = await bcrypt.hash(crypto.randomUUID(), 10);
    const temExcluidoEm = await colunaExiste('prestadores', 'excluido_em');

    await pool.query(
      `UPDATE prestadores SET
         nome = 'Usuário removido',
         email = 'removido-' || replace(id::text, '-', '') || '@konectaja.invalid',
         telefone = 'x' || left(replace(id::text, '-', ''), 18),
         cpf = left(replace(id::text, '-', ''), 14),
         whatsapp = NULL,
         senha_hash = $2,
         foto_url = NULL,
         google_id = NULL,
         status = 'inativo'
         ${temExcluidoEm ? ', excluido_em = NOW()' : ''}
       WHERE id = $1`,
      [id, senhaInvalida],
    );
  },

  // LGPD "portabilidade": mesmo recorte de dados que a tela "Meu perfil"
  // já exibe, só que empacotado pra download.
  async exportarDados(id) {
    const { rows } = await pool.query(
      `SELECT ${CAMPOS_PUBLICOS} FROM prestadores WHERE id = $1`,
      [id],
    );
    return rows[0] || null;
  },

  async atualizarStatus(id, status) {
    const { rows } = await pool.query(
      `UPDATE prestadores SET status = $2 WHERE id = $1 RETURNING ${CAMPOS_PUBLICOS}`,
      [id, status],
    );
    return rows[0] || null;
  },

  async atualizarFoto(id, fotoUrl) {
    const { rows } = await pool.query(
      `UPDATE prestadores SET foto_url = $2 WHERE id = $1 RETURNING ${CAMPOS_PUBLICOS}`,
      [id, fotoUrl],
    );
    return rows[0] || null;
  },

  // Painel admin: lista todos os prestadores (qualquer status), com PII
  // visível — diferente de listarAtivos (marketplace público, só ativos).
  // `cidade` só vem preenchido quando quem pede é um gerente (restrito à
  // própria divisão) — dono/rh/atendimento veem tudo, sem esse filtro.
  async listarTodos({ busca, status, cidade, pagina = 1, porPagina = 20 } = {}) {
    const condicoes = [];
    const valores = [];

    if (status) {
      valores.push(status);
      condicoes.push(`status = $${valores.length}`);
    }
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
      `SELECT ${CAMPOS_PUBLICOS} FROM prestadores ${onde}
       ORDER BY criado_em DESC LIMIT $${idxLimit} OFFSET $${idxOffset}`,
      valores,
    );
    return rows;
  },

  async contar({ busca, status, cidade } = {}) {
    const condicoes = [];
    const valores = [];
    if (status) {
      valores.push(status);
      condicoes.push(`status = $${valores.length}`);
    }
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
    const { rows } = await pool.query(`SELECT COUNT(*) FROM prestadores ${onde}`, valores);
    return Number(rows[0].count);
  },

  async contarPorStatus() {
    const { rows } = await pool.query(
      `SELECT status, COUNT(*) AS quantidade FROM prestadores GROUP BY status`,
    );
    return rows;
  },

  async incrementarServicos(id) {
    await pool.query(`UPDATE prestadores SET total_servicos = total_servicos + 1 WHERE id = $1`, [
      id,
    ]);
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

  // Papel duplo (ver authController.tornarPrestador/trocarPapel) —
  // guardado atrás de colunaExiste porque cliente_vinculado_id só
  // existe em bancos que já rodaram a migração mais recente.
  async buscarClienteVinculadoId(id) {
    if (!(await colunaExiste('prestadores', 'cliente_vinculado_id'))) return null;
    const { rows } = await pool.query(
      `SELECT cliente_vinculado_id FROM prestadores WHERE id = $1`,
      [id],
    );
    return rows[0]?.cliente_vinculado_id || null;
  },

  async definirClienteVinculado(id, clienteId) {
    await pool.query(`UPDATE prestadores SET cliente_vinculado_id = $2 WHERE id = $1`, [
      id,
      clienteId,
    ]);
  },

  // "Tornar-se prestador": cria o perfil de prestador reaproveitando a
  // MESMA senha (já com hash — nunca pede senha de novo) de quem já é
  // cliente, e vincula os dois registros. Não gera uma segunda conta:
  // o login continua sendo um só, a troca de "modo" acontece dentro do
  // app (ver authController.trocarPapel).
  async criarVinculado({
    clienteId,
    nome,
    email,
    telefone,
    cpf,
    senhaHash,
    segmento,
    valorServico,
    cidade,
    estado,
    lat,
    lng,
    modeloCobranca,
  }) {
    const modeloCobrancaFinal = modeloCobranca === 'fixo_mensal' ? 'fixo_mensal' : 'percentual';
    const { rows } = await pool.query(
      `INSERT INTO prestadores
         (nome, email, telefone, cpf, senha_hash, segmento, valor_servico,
          cidade, estado, lat, lng, modelo_cobranca, whatsapp, cliente_vinculado_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $3, $13)
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
        lat || null,
        lng || null,
        modeloCobrancaFinal,
        clienteId,
      ],
    );
    return rows[0];
  },

  async buscarAvatarGenero(id) {
    if (!(await colunaExiste('prestadores', 'avatar_genero'))) return 'neutro';
    const { rows } = await pool.query(`SELECT avatar_genero FROM prestadores WHERE id = $1`, [id]);
    return rows[0]?.avatar_genero || 'neutro';
  },

  async definirAvatarGenero(id, avatarGenero) {
    const { rows } = await pool.query(
      `UPDATE prestadores SET avatar_genero = $2 WHERE id = $1 RETURNING ${CAMPOS_PUBLICOS}, avatar_genero`,
      [id, avatarGenero],
    );
    return rows[0];
  },

  // Mapa de trabalhadores disponíveis (tela inicial): NUNCA devolve
  // nenhuma coordenada — nem exata, nem aproximada. Só a distância até
  // quem está olhando (Haversine, mesma fórmula de listarAtivos), pra
  // dar uma ideia de "tem gente a X km" sem revelar onde o prestador
  // está ou mora. Mesmo cuidado que ocultarPii já tinha com
  // /prestadores e /prestadores/:id (ver prestadorController.js).
  async listarParaMapa({ cidade, lat, lng } = {}) {
    const temAvatar = await colunaExiste('prestadores', 'avatar_genero');
    const camposExtra = temAvatar ? ', avatar_genero' : '';

    const usarDistancia = lat != null && lng != null;
    let colunaDistancia = 'NULL AS distancia_km';
    const valores = [];
    if (usarDistancia) {
      valores.push(lat, lng);
      colunaDistancia = `
        ROUND((6371 * acos(
          LEAST(1, GREATEST(-1,
            cos(radians($1)) * cos(radians(lat)) *
            cos(radians(lng) - radians($2)) +
            sin(radians($1)) * sin(radians(lat))
          ))
        ))::numeric, 1) AS distancia_km
      `;
    }

    const condicoes = [`status = 'ativo'`, 'lat IS NOT NULL', 'lng IS NOT NULL'];
    if (cidade) {
      valores.push(cidade);
      condicoes.push(`cidade = $${valores.length}`);
    }

    const { rows } = await pool.query(
      `SELECT id, nome, segmento, foto_url, ${colunaDistancia}${camposExtra}
       FROM prestadores WHERE ${condicoes.join(' AND ')}
       ORDER BY ${usarDistancia ? 'distancia_km ASC' : 'criado_em DESC'}`,
      valores,
    );

    return rows.map((p) => ({
      id: p.id,
      nome: p.nome,
      segmento: p.segmento,
      fotoUrl: p.foto_url,
      avatarGenero: temAvatar ? p.avatar_genero || 'neutro' : 'neutro',
      distanciaKm: p.distancia_km != null ? Number(p.distancia_km) : null,
    }));
  },
};
