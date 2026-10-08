const Prestador = require('../models/Prestador');
const Cliente = require('../models/Cliente');
const Pedido = require('../models/Pedido');
const Cupom = require('../models/Cupom');
const Banner = require('../models/Banner');
const TicketSuporte = require('../models/TicketSuporte');

// Resumo leve (sem valores financeiros) pro Dashboard, visível a
// qualquer cargo — números de receita ficam reservados à tela
// Financeiro (só dono).
async function resumo(req, res) {
  const [prestadoresPorStatus, totalClientes, pedidosPorStatus, cuponsAtivos, bannersAtivos, ticketsAbertos] =
    await Promise.all([
      Prestador.contarPorStatus(),
      Cliente.contar(),
      Pedido.contarPorStatus(),
      Cupom.contarAtivos(),
      Banner.contarAtivos(),
      TicketSuporte.contarAbertos(),
    ]);

  res.json({ prestadoresPorStatus, totalClientes, pedidosPorStatus, cuponsAtivos, bannersAtivos, ticketsAbertos });
}

module.exports = { resumo };
