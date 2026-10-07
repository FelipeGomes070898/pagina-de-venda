require('dotenv').config();
const express = require('express');
const cors = require('cors');
require('./utils/expressAsync').instalar();
const rotas = require('./routes');
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

app.use(tratarErros);

module.exports = app;
