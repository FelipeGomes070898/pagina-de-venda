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

-- Registro inicial do dono da empresa: NÃO é feito aqui no SQL. Depois
-- de rodar `npm run migrate`, rode `npm run criar-dono`
-- (src/config/criarDono.js) — ele pede nome/e-mail/senha, gera o hash
-- bcrypt de verdade e recusa criar um segundo dono se já existir um.

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
  google_id  TEXT UNIQUE,
  -- vincula a conta ao "sub" do token do Google (login/cadastro social).
  -- Continua exigindo telefone/CPF/senha: o Google só poupa digitar
  -- nome/e-mail e a senha, o resto do cadastro nacional é obrigatório.
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
  google_id           TEXT UNIQUE,
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
  status              VARCHAR(30) DEFAULT 'ativo',
  -- status: ativo | inadimplente | bloqueado
  -- (sem período de trial: o prestador já entra cobrável, no modelo que
  -- ele escolheu — percentual por serviço ou assinatura fixa mensal)
  modelo_cobranca     VARCHAR(20) DEFAULT 'percentual',
  -- percentual (5% por servico concluido) | fixo_mensal (R$25/mes)
  avaliacao           DECIMAL(2,1) DEFAULT 5.0,
  total_servicos      INT DEFAULT 0,
  total_avaliacoes    INT DEFAULT 0,
  total_fotos_trabalho INT DEFAULT 0,
  asaas_customer_id   TEXT,
  fcm_token           TEXT,
  idioma              VARCHAR(5) DEFAULT 'pt',
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

-- O mesmo token nunca pode pertencer a dois usuários: se o dispositivo
-- trocar de conta, o INSERT ... ON CONFLICT (token) DO UPDATE em
-- FcmToken.salvar reatribui o token ao novo usuário em vez de duplicar.
CREATE UNIQUE INDEX IF NOT EXISTS idx_fcm_tokens_token ON fcm_tokens(token);

-- Colunas adicionadas depois da criação inicial das tabelas — ALTER em
-- vez de entrar no CREATE TABLE porque o banco de produção já existe;
-- CREATE TABLE IF NOT EXISTS não altera uma tabela que já está lá.
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS total_servicos INT DEFAULT 0;
-- nota que PRESTADORES dão ao cliente (pontualidade, educação...) — nunca
-- se mistura com prestadores.avaliacao, que só vem de clientes avaliando
-- prestadores (ver tabela avaliacoes_clientes abaixo).
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS avaliacao DECIMAL(2,1) DEFAULT 5.0;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS total_avaliacoes INT DEFAULT 0;
-- preenchido pelo cliente no chat: "paguei antecipado" ou "paguei depois
-- que o serviço terminou" — só uma atestação dele, não processa
-- pagamento nenhum (isso continua fora do app, Pix direto pro prestador
-- ou dinheiro, até existir split de pagamentos de verdade).
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS pagamento_confirmado_em TIMESTAMPTZ;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS pagamento_quando VARCHAR(12);
-- pagamento_quando: antecipado | apos
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS pagamento_forma VARCHAR(12);
-- pagamento_forma: app | pix_direto

-- Avaliação na outra direção: prestador avalia o cliente (educado,
-- ofereceu água/café, ambiente organizado etc). Tabela separada de
-- `avaliacoes` de propósito — nunca pode se misturar com a nota que o
-- cliente dá pro prestador (prestadores.avaliacao continua vindo só de
-- `avaliacoes`, nunca desta tabela).
CREATE TABLE IF NOT EXISTS avaliacoes_clientes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id   UUID REFERENCES clientes(id),
  prestador_id UUID REFERENCES prestadores(id),
  pedido_id    UUID REFERENCES pedidos(id),
  nota         INT CHECK (nota BETWEEN 1 AND 5),
  comentario   TEXT,
  tags         TEXT[], -- ['Pontual', 'Ofereceu água/café', 'Ambiente organizado', ...]
  criado_em    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_clientes_cliente ON avaliacoes_clientes(cliente_id);

-- Serviços extras que o prestador oferece além do segmento principal do
-- cadastro (ex.: cadastrou como "Pedreiro", mas também faz "Encanador" e
-- "Servente" com diárias diferentes cada um). Aparecem no marketplace
-- como se fossem o segmento dele — um cliente buscando "Encanador" acha
-- esse prestador mesmo o segmento principal sendo outro. Outros
-- prestadores também veem esses serviços navegando no marketplace, do
-- mesmo jeito que um cliente veria.
CREATE TABLE IF NOT EXISTS servicos_prestador (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prestador_id UUID REFERENCES prestadores(id) ON DELETE CASCADE,
  categoria    VARCHAR(80) NOT NULL,
  valor        DECIMAL(10,2),
  descricao    TEXT,
  criado_em    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_servicos_prestador_prestador ON servicos_prestador(prestador_id);
CREATE INDEX IF NOT EXISTS idx_servicos_prestador_categoria ON servicos_prestador(categoria);

-- Cupons de desconto (gestão/promoções no painel admin). Aplicados na
-- criação do pedido (percentual sobre o valor, ou fixo em reais).
CREATE TABLE IF NOT EXISTS cupons (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo       VARCHAR(30) UNIQUE NOT NULL,
  tipo         VARCHAR(12) NOT NULL, -- percentual | fixo
  valor        DECIMAL(10,2) NOT NULL,
  descricao    TEXT,
  validade_fim DATE,
  limite_uso   INT,
  -- NULL = sem limite de usos totais
  usos         INT DEFAULT 0,
  ativo        BOOLEAN DEFAULT TRUE,
  criado_em    TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT chk_cupons_tipo CHECK (tipo IN ('percentual', 'fixo'))
);
CREATE INDEX IF NOT EXISTS idx_cupons_codigo ON cupons(codigo);

-- Banners promocionais exibidos no topo do marketplace (web + mobile),
-- geridos pelo painel admin.
CREATE TABLE IF NOT EXISTS banners (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo     VARCHAR(100),
  imagem_url TEXT NOT NULL,
  link_url   TEXT,
  ordem      INT DEFAULT 0,
  ativo      BOOLEAN DEFAULT TRUE,
  criado_em  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_banners_ativo ON banners(ativo);

-- Taxa de urgência (cliente paga um adicional pra sinalizar prioridade)
-- e rastro do cupom aplicado no pedido.
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS urgente BOOLEAN DEFAULT FALSE;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS taxa_urgencia DECIMAL(10,2);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cupom_codigo VARCHAR(30);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS desconto_valor DECIMAL(10,2);

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
