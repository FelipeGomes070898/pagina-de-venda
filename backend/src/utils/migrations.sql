CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- EQUIPE INTERNA (admins) — separada dos clientes/prestadores.
-- Hierarquia: dono > rh > gerente > atendimento
--   dono       : acesso total, inclusive RH e financeiro. Não é
--                criado pelo painel (é o registro inicial da empresa).
--   rh         : cria/gerencia gerente e atendimento. Não vê financeiro.
--   gerente    : vinculado a uma divisao_id, gerencia só o que é
--                daquela divisão (equipe/atendimento e métricas locais).
--   atendimento: suporte/denúncias, sem acesso a financeiro nem equipe.
-- ============================================================

-- Divisões/times (ex.: por região, por área de atuação)
CREATE TABLE IF NOT EXISTS divisoes (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome      VARCHAR(100) NOT NULL,
  descricao TEXT,
  ativa     BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admins (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome         VARCHAR(100) NOT NULL,
  email        VARCHAR(150) UNIQUE NOT NULL,
  senha_hash   TEXT NOT NULL,
  cargo        VARCHAR(20) NOT NULL,
  -- cargo: dono | rh | gerente | atendimento
  divisao_id   UUID REFERENCES divisoes(id),
  -- obrigatório para 'gerente'; opcional para 'atendimento'; nulo para dono/rh
  criado_por   UUID REFERENCES admins(id),
  -- quem cadastrou este admin (auditoria da hierarquia)
  ativo        BOOLEAN DEFAULT TRUE,
  ultimo_login TIMESTAMPTZ,
  criado_em    TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT chk_admins_cargo
    CHECK (cargo IN ('dono', 'rh', 'gerente', 'atendimento')),
  CONSTRAINT chk_admins_gerente_tem_divisao
    CHECK (cargo <> 'gerente' OR divisao_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_admins_cargo      ON admins(cargo);
CREATE INDEX IF NOT EXISTS idx_admins_divisao_id ON admins(divisao_id);

-- Registro inicial do dono da empresa (ajustar e-mail/senha no ambiente
-- real; a senha abaixo é só um placeholder de setup — trocar no primeiro
-- acesso). Senha placeholder: "TrocarNoPrimeiroAcesso!" (hash bcrypt fake,
-- gerar de verdade com o script de setup antes de rodar em produção).
-- INSERT INTO admins (nome, email, senha_hash, cargo)
-- VALUES ('Dono', 'dono@vexo.app', '<hash_bcrypt_real_aqui>', 'dono');

-- ============================================================
-- USUÁRIOS DO APP (clientes e prestadores) — nacional (BR).
-- Login flexível: celular, e-mail ou CPF, todos únicos e obrigatórios
-- no cadastro (o app pergunta os três de uma vez e permite entrar
-- com qualquer um deles depois).
-- ============================================================

CREATE TABLE IF NOT EXISTS clientes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) UNIQUE NOT NULL,
  telefone   VARCHAR(20)  UNIQUE NOT NULL,
  cpf        VARCHAR(14)  UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  foto_url   TEXT,
  cidade     VARCHAR(80),
  estado     VARCHAR(50),
  lat        DECIMAL(10,7),
  lng        DECIMAL(10,7),
  idioma     VARCHAR(5) DEFAULT 'pt',
  criado_em  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prestadores (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome                VARCHAR(100) NOT NULL,
  email               VARCHAR(150) UNIQUE NOT NULL,
  telefone            VARCHAR(20)  UNIQUE NOT NULL,
  cpf                 VARCHAR(14)  UNIQUE NOT NULL,
  senha_hash          TEXT NOT NULL,
  whatsapp            VARCHAR(25),
  segmento            VARCHAR(80),
  -- ex.: pedreiro, diarista, encanador, baba, roçador de quintal...
  valor_servico        DECIMAL(10,2),
  -- preço definido pelo próprio prestador; negociável no chat
  cidade              VARCHAR(80),
  estado              VARCHAR(50),
  pais                VARCHAR(50) DEFAULT 'Brasil',
  lat                 DECIMAL(10,7),
  lng                 DECIMAL(10,7),
  -- lat/lng usados para ordenar o marketplace por proximidade
  raio_km             INT DEFAULT 5,
  bio                 TEXT,
  foto_url            TEXT,
  status              VARCHAR(30) DEFAULT 'trial',
  -- status: trial | ativo | trial_expirado | inadimplente | bloqueado
  modelo_cobranca     VARCHAR(20) DEFAULT 'percentual',
  -- percentual (5% por servico concluido) | fixo_mensal (R$25/mes)
  avaliacao           DECIMAL(2,1) DEFAULT 5.0,
  total_servicos      INT DEFAULT 0,
  total_avaliacoes    INT DEFAULT 0,
  total_fotos_trabalho INT DEFAULT 0,
  asaas_customer_id   TEXT,
  fcm_token           TEXT,
  idioma              VARCHAR(5) DEFAULT 'pt',
  trial_inicio        TIMESTAMPTZ DEFAULT NOW(),
  criado_em           TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT chk_prestadores_modelo_cobranca
    CHECK (modelo_cobranca IN ('percentual', 'fixo_mensal'))
);

-- Fotos dos trabalhos do prestador (alimentam a avaliação por estrelas)
CREATE TABLE IF NOT EXISTS fotos_trabalhos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prestador_id  UUID REFERENCES prestadores(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  legenda       TEXT,
  criado_em     TIMESTAMPTZ DEFAULT NOW()
);

-- Categorias de serviço (fixas + personalizadas pelo usuário)
CREATE TABLE IF NOT EXISTS categorias (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome      VARCHAR(100) NOT NULL,
  icone     VARCHAR(50),
  cor       VARCHAR(20),
  tipo      VARCHAR(10) DEFAULT 'custom', -- fixa | custom
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Pedidos de serviço (cliente contrata ou publica uma necessidade)
CREATE TABLE IF NOT EXISTS pedidos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id    UUID REFERENCES clientes(id),
  prestador_id  UUID REFERENCES prestadores(id),
  descricao     TEXT,
  endereco      TEXT,
  -- endereço só é liberado/enviado depois que o pedido é fechado no chat
  lat           DECIMAL(10,7),
  lng           DECIMAL(10,7),
  valor         DECIMAL(10,2),
  status        VARCHAR(30) DEFAULT 'pendente',
  -- status: pendente | andamento | concluido | cancelado | agendado
  agendado_para TIMESTAMPTZ,
  criado_em     TIMESTAMPTZ DEFAULT NOW()
);

-- Mensagens do chat (negociação entre cliente e prestador, nos dois
-- sentidos). remetente_tipo evita ambiguidade na hora de renderizar o
-- balão (esquerda/direita) sem precisar cruzar com duas tabelas.
CREATE TABLE IF NOT EXISTS mensagens (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id      UUID REFERENCES pedidos(id) ON DELETE CASCADE,
  remetente_id   UUID, -- id do cliente, do prestador, ou nulo (mensagem de sistema)
  remetente_tipo VARCHAR(12), -- cliente | prestador | sistema
  conteudo       TEXT NOT NULL,
  tipo           VARCHAR(20) DEFAULT 'texto', -- texto | proposta | sistema
  lida           BOOLEAN DEFAULT FALSE,
  criado_em      TIMESTAMPTZ DEFAULT NOW()
);

-- Propostas de valor dentro do chat — qualquer uma das partes pode propor
-- (cliente contra-oferta, prestador confirma ou ajusta o preço).
CREATE TABLE IF NOT EXISTS propostas (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id      UUID REFERENCES pedidos(id) ON DELETE CASCADE,
  remetente_id   UUID NOT NULL,
  remetente_tipo VARCHAR(12) NOT NULL, -- cliente | prestador
  valor          DECIMAL(10,2) NOT NULL,
  descricao      TEXT,
  status         VARCHAR(20) DEFAULT 'pendente', -- pendente | aceita | recusada
  criado_em      TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT chk_propostas_remetente_tipo
    CHECK (remetente_tipo IN ('cliente', 'prestador'))
);

-- Avaliações do prestador (só liberada após pedido concluído)
CREATE TABLE IF NOT EXISTS avaliacoes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prestador_id UUID REFERENCES prestadores(id),
  cliente_id   UUID REFERENCES clientes(id),
  pedido_id    UUID REFERENCES pedidos(id),
  nota         INT CHECK (nota BETWEEN 1 AND 5),
  comentario   TEXT,
  tags         TEXT[], -- ['Pontual', 'Qualidade excelente', etc]
  criado_em    TIMESTAMPTZ DEFAULT NOW()
);

-- Pagamentos / assinaturas do prestador (taxa da plataforma)
CREATE TABLE IF NOT EXISTS pagamentos (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prestador_id UUID REFERENCES prestadores(id),
  pedido_id    UUID REFERENCES pedidos(id),
  -- preenchido quando o pagamento é a taxa de 5% de um serviço específico
  tipo         VARCHAR(20) NOT NULL,
  -- tipo: taxa_servico (5%) | assinatura_mensal (R$25 fixo)
  valor        DECIMAL(10,2) NOT NULL,
  metodo       VARCHAR(20), -- pix | cartao | boleto
  asaas_id     TEXT UNIQUE,
  status       VARCHAR(20) DEFAULT 'pendente', -- pendente | pago | vencido
  vencimento   DATE,
  pago_em      TIMESTAMPTZ,
  criado_em    TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT chk_pagamentos_tipo
    CHECK (tipo IN ('taxa_servico', 'assinatura_mensal'))
);

-- Tokens FCM para push notifications
CREATE TABLE IF NOT EXISTS fcm_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id  UUID NOT NULL,
  usuario_tipo VARCHAR(12) NOT NULL, -- cliente | prestador
  token       TEXT NOT NULL,
  plataforma  VARCHAR(10), -- ios | android | web
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_prestadores_cidade    ON prestadores(cidade);
CREATE INDEX IF NOT EXISTS idx_prestadores_status    ON prestadores(status);
CREATE INDEX IF NOT EXISTS idx_prestadores_segmento  ON prestadores(segmento);
CREATE INDEX IF NOT EXISTS idx_prestadores_lat_lng   ON prestadores(lat, lng);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente       ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_prestador     ON pedidos(prestador_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_pedido      ON mensagens(pedido_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_prestador  ON avaliacoes(prestador_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_prestador  ON pagamentos(prestador_id);
