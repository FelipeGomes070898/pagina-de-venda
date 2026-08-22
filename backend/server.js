require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rotas = require('./src/routes');
const { tratarErros } = require('./src/middlewares/erros');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', rotas);

app.get('/health', (req, res) => res.json({ ok: true }));

app.use(tratarErros);

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => console.log(`Vexo API rodando na porta ${PORT}`));
