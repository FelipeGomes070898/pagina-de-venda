// Aplica o schema em src/utils/migrations.sql no banco configurado no .env.
// Uso: npm run migrate
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./database');

async function migrar() {
  const caminho = path.join(__dirname, '..', 'utils', 'migrations.sql');
  const sql = fs.readFileSync(caminho, 'utf-8');

  console.log('Aplicando migrations...');
  await pool.query(sql);
  console.log('Migrations aplicadas com sucesso.');
  await pool.end();
}

migrar().catch((erro) => {
  console.error('Falha ao aplicar migrations:', erro.message);
  process.exit(1);
});
