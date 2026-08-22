const Avaliacao = require('../models/Avaliacao');
const Pedido = require('../models/Pedido');

async function criar(req, res) {
  if (req.usuarioApp.tipo !== 'cliente') {
    return res.status(403).json({ erro: 'Somente clientes podem avaliar um prestador' });
  }

  const { pedidoId, nota, comentario, tags } = req.body;
  if (!pedidoId || !nota || nota < 1 || nota > 5) {
    return res.status(400).json({ erro: 'Informe pedidoId e uma nota entre 1 e 5' });
  }

  const pedido = await Pedido.buscarPorId(pedidoId);
  if (!pedido || pedido.cliente_id !== req.usuarioApp.id) {
    return res.status(404).json({ erro: 'Pedido não encontrado' });
  }
  if (!pedido.prestador_id) {
    return res.status(400).json({ erro: 'Este pedido não tem um prestador vinculado' });
  }

  const podeAvaliar = await Avaliacao.clientePodeAvaliar(req.usuarioApp.id, pedidoId);
  if (!podeAvaliar) {
    return res.status(409).json({
      erro: 'Este pedido não pode ser avaliado (não está concluído ou já foi avaliado)',
    });
  }

  const avaliacao = await Avaliacao.criar({
    prestadorId: pedido.prestador_id,
    clienteId: req.usuarioApp.id,
    pedidoId,
    nota,
    comentario,
    tags,
  });

  res.status(201).json(avaliacao);
}

async function listarPorPrestador(req, res) {
  const avaliacoes = await Avaliacao.listarPorPrestador(req.params.prestadorId);
  res.json(avaliacoes);
}

module.exports = { criar, listarPorPrestador };
