require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const rotas = require('./routes');
const pool = require('./config/database');
const { tratarErros } = require('./middlewares/erros');

const app = express();

// CORS_ORIGINS (opcional): lista separada por vírgula das origens
// permitidas em produção (ex.: https://app.konectaja.com,https://admin.konectaja.com).
// Sem essa variável, libera qualquer origem — conveniente em
// desenvolvimento, mas troque isso antes de ir pra produção de verdade.
// String vazia (CORS_ORIGINS= no .env) precisa se comportar igual a
// "variável não definida" — sem esse filter, ''.split(',') vira [''],
// que o pacote cors trata como uma origem literal vazia e acaba
// bloqueando geral em vez de liberar tudo.
const origensPermitidas = process.env.CORS_ORIGINS?.split(',')
  .map((o) => o.trim())
  .filter(Boolean);
app.use(cors(origensPermitidas?.length ? { origin: origensPermitidas } : {}));
app.use(express.json());

app.use('/api', rotas);

app.get('/health', (req, res) => res.json({ ok: true }));

// Endpoint temporário de setup inicial do banco, usado só uma vez no
// primeiro deploy de um ambiente novo — protegido por um segredo que só
// existe como variável de ambiente (nunca aparece em lugar nenhum do
// código). Sem MIGRATE_SECRET configurado, a rota responde 404 e não
// existe na prática. Remover depois do primeiro deploy bem-sucedido.
if (process.env.MIGRATE_SECRET) {
  app.post('/setup-inicial', async (req, res, next) => {
    if (req.get('x-migrate-secret') !== process.env.MIGRATE_SECRET) {
      return res.status(404).json({ erro: 'Não encontrado' });
    }
    try {
      const sql = fs.readFileSync(
        path.join(__dirname, 'utils', 'migrations.sql'),
        'utf-8',
      );
      await pool.query(sql);
      res.json({ ok: true, mensagem: 'Migrations aplicadas com sucesso.' });
    } catch (erro) {
      next(erro);
    }
  });
}

app.use(tratarErros);

module.exports = app;
