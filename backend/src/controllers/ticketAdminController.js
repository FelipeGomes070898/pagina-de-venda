const TicketSuporte = require('../models/TicketSuporte');

const STATUS_VALIDOS = ['aberto', 'em_atendimento', 'resolvido'];

async function listar(req, res) {
  const { status } = req.query;
  const tickets = await TicketSuporte.listarTodos({ status });
  res.json(tickets);
}

async function responder(req, res) {
  const { resposta, status } = req.body;
  if (!STATUS_VALIDOS.includes(status)) {
    return res.status(400).json({ erro: `status deve ser um de: ${STATUS_VALIDOS.join(', ')}` });
  }

  const ticket = await TicketSuporte.buscarPorId(req.params.id);
  if (!ticket) return res.status(404).json({ erro: 'Ticket não encontrado' });

  const atualizado = await TicketSuporte.responder(req.params.id, {
    resposta,
    status,
    atendidoPor: req.admin.id,
  });
  res.json(atualizado);
}

module.exports = { listar, responder };
