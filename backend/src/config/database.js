const { Pool, types } = require('pg');

// Por padrão o node-postgres devolve NUMERIC/DECIMAL (valor_servico,
// avaliacao, pedidos.valor, pagamentos.valor...) como STRING ("120.00"),
// não number — pra não perder precisão em valores muito grandes. Isso
// quebrava o app mobile: chamar .toFixed() direto numa string lança
// TypeError e, sem Error Boundary, vira tela cinza/branca sem aviso
// nenhum. 1700 é o OID do tipo NUMERIC no Postgres.
types.setTypeParser(1700, parseFloat);

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

// Algumas connection strings (Supabase, por exemplo) já vêm com
// ?sslmode=require embutido na URL. Quando isso acontece, o parser
// interno do `pg` monta a config de SSL a partir da URL e ignora o
// `ssl: { rejectUnauthorized: false }` passado aqui embaixo — resultado:
// "self-signed certificate in certificate chain" mesmo com o código
// "certo". Tirando o sslmode da URL, só o `ssl` explícito abaixo manda.
const connectionStringSemSslMode = connectionString?.replace(
  /([?&])sslmode=[^&]*&?/,
  '$1',
).replace(/[?&]$/, '');

const pool = connectionString
  ? new Pool({
      connectionString: connectionStringSemSslMode,
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
