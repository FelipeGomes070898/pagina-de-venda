require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
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

  // Mesma proteção, pra criar o primeiro admin (dono) sem precisar de
  // acesso direto ao banco. Recusa se já existir algum dono cadastrado.
  app.post('/setup-inicial/dono', async (req, res, next) => {
    if (req.get('x-migrate-secret') !== process.env.MIGRATE_SECRET) {
      return res.status(404).json({ erro: 'Não encontrado' });
    }
    try {
      const { nome, email, senha } = req.body;
      if (!nome || !email || !senha || senha.length < 8) {
        return res
          .status(400)
          .json({ erro: 'Nome, e-mail e senha (mín. 8 caracteres) são obrigatórios' });
      }

      const { rows: existentes } = await pool.query(
        `SELECT id FROM admins WHERE cargo = 'dono' LIMIT 1`,
      );
      if (existentes.length > 0) {
        return res.status(409).json({ erro: 'Já existe um dono cadastrado.' });
      }

      const senhaHash = await bcrypt.hash(senha, 10);
      const { rows } = await pool.query(
        `INSERT INTO admins (nome, email, senha_hash, cargo) VALUES ($1, $2, $3, 'dono')
         RETURNING id, nome, email, cargo`,
        [nome, email, senhaHash],
      );
      res.json({ ok: true, dono: rows[0] });
    } catch (erro) {
      next(erro);
    }
  });
}

app.use(tratarErros);

module.exports = app;
