const { Pool } = require('pg');

// DATABASE_URL (Supabase, Render, Railway, etc.) tem prioridade sobre as
// variáveis DB_* separadas — é o formato que esses provedores entregam
// prontinho ("Connection string"), então evita erro de digitar host/porta
// errado à mão. As DB_* continuam funcionando pra quem prefere configurar
// assim localmente.
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      // Supabase (e a maioria dos provedores gerenciados) exige SSL nas
      // conexões externas; o certificado deles não vem na cadeia padrão
      // de confiança do Node, por isso rejectUnauthorized: false aqui.
      ssl: { rejectUnauthorized: false },
      // Rodando como função serverless (Vercel), cada invocação pode abrir
      // sua própria conexão — um pool grande por instância esgota rápido
      // o limite de conexões do banco. Por isso o max baixo; use a
      // "Connection pooling" (Supavisor, porta 6543) do Supabase na
      // DATABASE_URL quando for rodar na Vercel.
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
