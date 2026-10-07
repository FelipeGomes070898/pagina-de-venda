const Cupom = require('../models/Cupom');

// App (cliente): valida um código digitado na criação do pedido e já
// devolve o desconto calculado, sem registrar o uso ainda — o uso só é
// confirmado quando o pedido é de fato criado (ver pedidoController).
async function validar(req, res) {
  const { codigo, valorPedido } = req.body;
  if (!codigo) return res.status(400).json({ erro: 'Informe o código do cupom' });

  const cupom = await Cupom.buscarPorCodigo(codigo);
  if (!cupom || !Cupom.estaValido(cupom)) {
    return res.status(404).json({ erro: 'Cupom inválido ou expirado' });
  }

  const desconto = Cupom.calcularDesconto(cupom, Number(valorPedido) || 0);
  res.json({ codigo: cupom.codigo, tipo: cupom.tipo, valor: Number(cupom.valor), desconto });
}

module.exports = { validar };
