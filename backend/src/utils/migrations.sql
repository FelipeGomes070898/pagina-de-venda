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
