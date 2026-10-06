const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const Admin = require('../models/Admin');
const Cliente = require('../models/Cliente');
const Prestador = require('../models/Prestador');
const asaasService = require('../services/asaasService');

const googleClient = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;

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
      usuario: {
        id: cliente.id,
        nome: cliente.nome,
        tipo: 'cliente',
        fotoUrl: cliente.foto_url,
        cidade: cliente.cidade,
      },
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
        cidade: prestador.cidade,
      },
    });
  }

  return res.status(401).json({ erro: 'Credenciais inválidas' });
}

// Cadastro do app — tipo: 'cliente' | 'prestador'. `googleId` é opcional:
// vem preenchido quando o usuário veio do fluxo "Continuar com Google"
// (POST /auth/google) e está completando o cadastro nacional (telefone,
// CPF, senha) que o Google sozinho não fornece.
async function cadastro(req, res) {
  const { tipo, nome, email, telefone, cpf, senha, lat, lng, googleId } = req.body;

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
      lat,
      lng,
      googleId,
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
    lat,
    lng,
    modeloCobranca: req.body.modeloCobranca,
    googleId,
    whatsapp: req.body.whatsapp,
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

// Login/cadastro com Google. Verifica o idToken emitido pelo Google
// Identity Services no front (web ou mobile). Se já existe conta com
// esse google_id ou e-mail, loga direto. Se não existe, NÃO cria a
// conta aqui — devolve os dados do perfil Google pro front levar o
// usuário a completar o cadastro nacional (telefone, CPF, senha), que
// depois chama /auth/cadastro passando o mesmo googleId pra vincular.
async function loginGoogle(req, res) {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ erro: 'idToken é obrigatório' });
  if (!googleClient) {
    return res.status(503).json({ erro: 'Login com Google não configurado no servidor' });
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ erro: 'Token do Google inválido' });
  }

  const { sub: googleId, email, name } = payload;

  const cliente = await Cliente.buscarPorGoogleIdOuEmail(googleId, email);
  if (cliente) {
    if (!cliente.google_id) await Cliente.vincularGoogleId(cliente.id, googleId);
    const token = gerarToken({ id: cliente.id, tipo: 'cliente' });
    return res.json({
      token,
      usuario: {
        id: cliente.id,
        nome: cliente.nome,
        tipo: 'cliente',
        fotoUrl: cliente.foto_url,
        cidade: cliente.cidade,
      },
    });
  }

  const prestador = await Prestador.buscarPorGoogleIdOuEmail(googleId, email);
  if (prestador) {
    if (!prestador.google_id) await Prestador.vincularGoogleId(prestador.id, googleId);
    const token = gerarToken({ id: prestador.id, tipo: 'prestador' });
    return res.json({
      token,
      usuario: {
        id: prestador.id,
        nome: prestador.nome,
        tipo: 'prestador',
        fotoUrl: prestador.foto_url,
        cidade: prestador.cidade,
      },
    });
  }

  return res.json({ novoCadastro: true, perfilGoogle: { googleId, email, nome: name } });
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

// "Esqueci minha senha" do app (cliente ou prestador). Sem e-mail/SMS
// configurado no servidor ainda, a confirmação de identidade é por
// conferência: e-mail + CPF + telefone têm que bater exatamente com o
// que está no cadastro (os 3 juntos, não só um) antes de trocar a
// senha. Quem não lembra algum desses dados precisa do suporte (painel
// admin tem a opção de redefinir a senha manualmente).
async function recuperarSenha(req, res) {
  const { email, cpf, telefone, senhaNova } = req.body;

  if (!email || !cpf || !telefone || !senhaNova || senhaNova.length < 8) {
    return res.status(400).json({
      erro: 'Informe e-mail, CPF, telefone e uma nova senha (mín. 8 caracteres)',
    });
  }

  const cliente = await Cliente.buscarParaRecuperacao(email, cpf, telefone);
  if (cliente) {
    await Cliente.atualizarSenha(cliente.id, senhaNova);
    return res.json({ ok: true });
  }

  const prestador = await Prestador.buscarParaRecuperacao(email, cpf, telefone);
  if (prestador) {
    await Prestador.atualizarSenha(prestador.id, senhaNova);
    return res.json({ ok: true });
  }

  // Mensagem genérica de propósito: não revela se existe conta com
  // esse e-mail nem qual dos 3 campos está errado (evita que alguém
  // use esse endpoint pra descobrir dados de outra pessoa).
  return res.status(400).json({
    erro:
      'Não conseguimos confirmar seus dados. Verifique e-mail, CPF e telefone exatamente como no cadastro, ou fale com o suporte.',
  });
}

// Dados de cadastro do usuário logado (app cliente/prestador) — usado
// pela tela "Meu perfil", tanto no site quanto no mobile.
async function meuPerfil(req, res) {
  const { id, tipo } = req.usuarioApp;

  if (tipo === 'cliente') {
    const cliente = await Cliente.buscarPorId(id);
    if (!cliente) return res.status(404).json({ erro: 'Conta não encontrada' });
    return res.json({ ...cliente, tipo: 'cliente' });
  }

  const prestador = await Prestador.buscarPorId(id);
  if (!prestador) return res.status(404).json({ erro: 'Conta não encontrada' });
  return res.json({ ...prestador, tipo: 'prestador' });
}

module.exports = { login, cadastro, loginGoogle, loginAdmin, recuperarSenha, meuPerfil };
