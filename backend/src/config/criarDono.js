// Cria o primeiro admin com cargo 'dono'. É o único jeito de dar o
// primeiro acesso ao painel — de propósito não existe endpoint HTTP
// para isso (segurança: ninguém deveria virar dono clicando num botão).
//
// Uso:
//   npm run criar-dono
//   (pede nome/e-mail/senha interativamente)
//
// Ou sem interação (ex.: script de deploy):
//   DONO_NOME="Fulano" DONO_EMAIL="dono@vexo.app" DONO_SENHA="..." npm run criar-dono
require('dotenv').config();
const readline = require('readline');
const bcrypt = require('bcrypt');
const pool = require('./database');

function perguntar(rl, texto) {
  return new Promise((resolve) => rl.question(texto, resolve));
}

async function obterDados() {
  if (process.env.DONO_NOME && process.env.DONO_EMAIL && process.env.DONO_SENHA) {
    return {
      nome: process.env.DONO_NOME,
      email: process.env.DONO_EMAIL,
      senha: process.env.DONO_SENHA,
    };
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const nome = await perguntar(rl, 'Nome do dono: ');
  const email = await perguntar(rl, 'E-mail do dono: ');
  const senha = await perguntar(rl, 'Senha (mínimo 8 caracteres): ');
  rl.close();
  return { nome, email, senha };
}

async function criarDono() {
  const { nome, email, senha } = await obterDados();

  if (!nome || !email || !senha || senha.length < 8) {
    throw new Error('Nome, e-mail e senha (mín. 8 caracteres) são obrigatórios');
  }

  const { rows: existentes } = await pool.query(
    `SELECT id FROM admins WHERE cargo = 'dono' LIMIT 1`,
  );
  if (existentes.length > 0) {
    throw new Error(
      'Já existe um dono cadastrado. Use o painel para criar RH/gerentes/atendimento a partir dele.',
    );
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const { rows } = await pool.query(
    `INSERT INTO admins (nome, email, senha_hash, cargo) VALUES ($1, $2, $3, 'dono')
     RETURNING id, nome, email, cargo`,
    [nome, email, senhaHash],
  );

  console.log('Dono criado com sucesso:', rows[0]);
  await pool.end();
}

criarDono().catch((erro) => {
  console.error('Falha ao criar o dono:', erro.message);
  process.exit(1);
});
