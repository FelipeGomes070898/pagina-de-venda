const TicketSuporte = require('../models/TicketSuporte');
const Cliente = require('../models/Cliente');
const Prestador = require('../models/Prestador');

// Usado tanto pela barra de Ajuda (web/mobile) quanto por um futuro
// robô de atendimento — por enquanto é um formulário simples que vira
// um ticket na fila do painel admin.
async function criar(req, res) {
  const { assunto, mensagem } = req.body;
  if (!assunto || !mensagem) {
    return res.status(400).json({ erro: 'assunto e mensagem são obrigatórios' });
  }

  const { id, tipo } = req.usuarioApp;
  const usuario = tipo === 'cliente' ? await Cliente.buscarPorId(id) : await Prestador.buscarPorId(id);
  if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado' });

  const ticket = await TicketSuporte.criar({
    usuarioId: id,
    usuarioTipo: tipo,
    usuarioNome: usuario.nome,
    assunto,
    mensagem,
  });
  res.status(201).json(ticket);
}

async function meus(req, res) {
  const tickets = await TicketSuporte.listarDoUsuario(req.usuarioApp.id);
  res.json(tickets);
}

module.exports = { criar, meus };
