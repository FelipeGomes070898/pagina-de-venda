const AvaliacaoCliente = require('../models/AvaliacaoCliente');
const Pedido = require('../models/Pedido');

// Espelha avaliacaoController.criar, na direção prestador → cliente
// (pontualidade, educação, ofereceu água/café...). Essa nota nunca entra
// na avaliação do prestador (prestadores.avaliacao só vem de clientes
// avaliando prestadores) — é só informativa pro próprio cliente e outros
// prestadores decidirem se aceitam atendê-lo.
async function criar(req, res) {
  if (req.usuarioApp.tipo !== 'prestador') {
    return res.status(403).json({ erro: 'Somente prestadores podem avaliar um cliente' });
  }

  const { pedidoId, nota, comentario, tags } = req.body;
  if (!pedidoId || !nota || nota < 1 || nota > 5) {
    return res.status(400).json({ erro: 'Informe pedidoId e uma nota entre 1 e 5' });
  }

  const pedido = await Pedido.buscarPorId(pedidoId);
  if (!pedido || pedido.prestador_id !== req.usuarioApp.id) {
    return res.status(404).json({ erro: 'Pedido não encontrado' });
  }

  const podeAvaliar = await AvaliacaoCliente.prestadorPodeAvaliar(req.usuarioApp.id, pedidoId);
  if (!podeAvaliar) {
    return res.status(409).json({
      erro: 'Este pedido não pode ser avaliado (não está concluído ou já foi avaliado)',
    });
  }

  const avaliacao = await AvaliacaoCliente.criar({
    clienteId: pedido.cliente_id,
    prestadorId: req.usuarioApp.id,
    pedidoId,
    nota,
    comentario,
    tags,
  });

  res.status(201).json(avaliacao);
}

module.exports = { criar };
