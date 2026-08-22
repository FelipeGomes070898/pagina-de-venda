const Pagamento = require('../models/Pagamento');
const Prestador = require('../models/Prestador');

// Webhook do Asaas. Configurar no painel do Asaas apontando para
// POST /api/pagamentos/webhook?token=SEU_ASAAS_WEBHOOK_TOKEN — o token
// é um segredo simples nosso (o Asaas não assina o payload por padrão),
// só pra garantir que a chamada realmente veio de quem configurou o
// webhook.
async function webhook(req, res) {
  if (process.env.ASAAS_WEBHOOK_TOKEN && req.query.token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return res.status(401).json({ erro: 'Token inválido' });
  }

  const { event, payment } = req.body;
  if (!payment?.id) return res.status(200).json({ ok: true });

  const pagamento = await Pagamento.buscarPorAsaasId(payment.id);
  if (!pagamento) return res.status(200).json({ ok: true }); // evento de algo que não rastreamos

  if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') {
    await Pagamento.marcarPago(pagamento.id);
    const prestador = await Prestador.buscarCompletoPorId(pagamento.prestador_id);
    if (prestador?.status === 'inadimplente') {
      await Prestador.atualizarStatus(prestador.id, 'ativo');
    }
  } else if (event === 'PAYMENT_OVERDUE') {
    await Pagamento.marcarVencido(pagamento.id);
    await Prestador.atualizarStatus(pagamento.prestador_id, 'inadimplente');
  }

  res.status(200).json({ ok: true });
}

async function meus(req, res) {
  if (req.usuarioApp.tipo !== 'prestador') {
    return res.status(403).json({ erro: 'Somente prestadores têm histórico de pagamentos' });
  }
  const pagamentos = await Pagamento.listarPorPrestador(req.usuarioApp.id);
  res.json(pagamentos);
}

module.exports = { webhook, meus };
