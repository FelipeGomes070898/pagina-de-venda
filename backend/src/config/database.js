const { Pool } = require('pg');

// DATABASE_URL (Supabase, Render, Railway, etc.) tem prioridade sobre as
// variáveis DB_* separadas — é o formato que esses provedores entregam
// prontinho ("Connection string"), então evita erro de digitar host/porta
// errado à mão. As DB_* continuam funcionando pra quem prefere configurar
// assim localmente.
//
// A integração de Postgres da própria Vercel (Neon) deixa escolher um
// prefixo pra variável (ex.: STORAGE_URL em vez de DATABASE_URL) — pra não
// depender de acertar esse nome na hora de conectar o banco, aceitamos
// qualquer uma das variantes mais comuns, nessa ordem de prioridade.
const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.STORAGE_URL ||
  process.env.STORAGE_DATABASE_URL ||
  process.env.STORAGE_POSTGRES_URL;

const pool = connectionString
  ? new Pool({
      connectionString,
      // Supabase/Neon (e a maioria dos provedores gerenciados) exige SSL
      // nas conexões externas; o certificado deles não vem na cadeia
      // padrão de confiança do Node, por isso rejectUnauthorized: false.
      ssl: { rejectUnauthorized: false },
      // Rodando como função serverless (Vercel), cada invocação pode abrir
      // sua própria conexão — um pool grande por instância esgota rápido
      // o limite de conexões do banco. Por isso o max baixo; use a URL de
      // "pooled connection" quando o provedor oferecer mais de uma opção.
      max: 3,
    })
  : new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

module.exports = pool;
