require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rotas = require('./src/routes');
const { tratarErros } = require('./src/middlewares/erros');

const app = express();

// CORS_ORIGINS (opcional): lista separada por vírgula das origens
// permitidas em produção (ex.: https://app.vexo.com,https://admin.vexo.com).
// Sem essa variável, libera qualquer origem — conveniente em
// desenvolvimento, mas troque isso antes de ir pra produção de verdade.
const origensPermitidas = process.env.CORS_ORIGINS?.split(',').map((o) => o.trim());
app.use(cors(origensPermitidas ? { origin: origensPermitidas } : {}));
app.use(express.json());

app.use('/api', rotas);

app.get('/health', (req, res) => res.json({ ok: true }));

app.use(tratarErros);

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => console.log(`Vexo API rodando na porta ${PORT}`));
