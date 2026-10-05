const Pagamento = require('../models/Pagamento');

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
  const dados = await Pagamento.resumo();
  res.json(dados);
}

module.exports = { listarPagamentos, resumo };
