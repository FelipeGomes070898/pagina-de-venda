const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Cliente = require('../models/Cliente');
const Prestador = require('../models/Prestador');
const asaasService = require('../services/asaasService');

const TIPOS_IDENTIFICADOR = ['telefone', 'email', 'cpf'];

function gerarToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });
}

// Login do app (cliente ou prestador) — nacional, aceita celular, e-mail
// ou CPF como identificador, mais senha.
async function login(req, res) {
  const { identificador, tipoIdentificador, senha } = req.body;

  if (!identificador || !senha || !TIPOS_IDENTIFICADOR.includes(tipoIdentificador)) {
    return res.status(400).json({ erro: 'Informe identificador, tipoIdentificador e senha' });
  }

  const cliente = await Cliente.buscarPorIdentificadorComSenha(tipoIdentificador, identificador);
  if (cliente) {
    const senhaValida = await Cliente.verificarSenha(senha, cliente.senha_hash);
    if (!senhaValida) return res.status(401).json({ erro: 'Credenciais inválidas' });

    const token = gerarToken({ id: cliente.id, tipo: 'cliente' });
    return res.json({
      token,
      usuario: { id: cliente.id, nome: cliente.nome, tipo: 'cliente', fotoUrl: cliente.foto_url },
    });
  }

  const prestador = await Prestador.buscarPorIdentificadorComSenha(
    tipoIdentificador,
    identificador,
  );
  if (prestador) {
    const senhaValida = await Prestador.verificarSenha(senha, prestador.senha_hash);
    if (!senhaValida) return res.status(401).json({ erro: 'Credenciais inválidas' });

    const token = gerarToken({ id: prestador.id, tipo: 'prestador' });
    return res.json({
      token,
      usuario: {
        id: prestador.id,
        nome: prestador.nome,
        tipo: 'prestador',
        fotoUrl: prestador.foto_url,
      },
    });
  }

  return res.status(401).json({ erro: 'Credenciais inválidas' });
}

// Cadastro do app — tipo: 'cliente' | 'prestador'.
async function cadastro(req, res) {
  const { tipo, nome, email, telefone, cpf, senha } = req.body;

  if (!['cliente', 'prestador'].includes(tipo)) {
    return res.status(400).json({ erro: 'tipo deve ser "cliente" ou "prestador"' });
  }
  if (!nome || !email || !telefone || !cpf || !senha) {
    return res.status(400).json({ erro: 'Nome, e-mail, telefone, CPF e senha são obrigatórios' });
  }

  if (tipo === 'cliente') {
    const cliente = await Cliente.criar({
      nome,
      email,
      telefone,
      cpf,
      senha,
      cidade: req.body.cidade,
      estado: req.body.estado,
    });
    const token = gerarToken({ id: cliente.id, tipo: 'cliente' });
    return res.status(201).json({ token, usuario: { ...cliente, tipo: 'cliente' } });
  }

  const prestador = await Prestador.criar({
    nome,
    email,
    telefone,
    cpf,
    senha,
    segmento: req.body.segmento,
    valorServico: req.body.valorServico,
    cidade: req.body.cidade,
    estado: req.body.estado,
    modeloCobranca: req.body.modeloCobranca,
  });

  // Best-effort: não bloqueia o cadastro se o Asaas falhar ou não
  // estiver configurado ainda (fica pendente até o dono configurar).
  if (prestador.modelo_cobranca === 'fixo_mensal') {
    asaasService.criarAssinaturaMensal(prestador).catch(() => {});
  } else {
    asaasService.garantirClienteAsaas(prestador).catch(() => {});
  }

  const token = gerarToken({ id: prestador.id, tipo: 'prestador' });
  return res.status(201).json({ token, usuario: { ...prestador, tipo: 'prestador' } });
}

// Login do painel administrativo (equipe interna, hierarquia própria).
async function loginAdmin(req, res) {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ erro: 'Informe e-mail e senha' });
  }

  const admin = await Admin.buscarPorEmailComSenha(email);
  if (!admin || !admin.ativo) {
    return res.status(401).json({ erro: 'Credenciais inválidas' });
  }

  const senhaValida = await Admin.verificarSenha(senha, admin.senha_hash);
  if (!senhaValida) {
    return res.status(401).json({ erro: 'Credenciais inválidas' });
  }

  const token = jwt.sign(
    { id: admin.id, cargo: admin.cargo, divisaoId: admin.divisao_id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_ADMIN || '8h' },
  );

  await Admin.registrarLogin(admin.id);

  res.json({
    token,
    admin: {
      id: admin.id,
      nome: admin.nome,
      email: admin.email,
      cargo: admin.cargo,
      divisaoId: admin.divisao_id,
    },
  });
}

module.exports = { login, cadastro, loginAdmin };
