const Pagamento = require('../models/Pagamento');
const Pedido = require('../models/Pedido');

async function listarPagamentos(req, res) {
  const { status, page } = req.query;
  const pagina = page ? Number(page) : 1;

  const [pagamentos, total] = await Promise.all([
    Pagamento.listarTodos({ status, pagina }),
    Pagamento.contar({ status }),
  ]);

  res.json({ pagamentos, total, pagina });
}

async function resumo(req, res) {
  const [dados, metricas] = await Promise.all([Pagamento.resumo(), Pedido.metricasNegocio()]);
  res.json({ ...dados, negocio: metricas });
}

module.exports = { listarPagamentos, resumo };
