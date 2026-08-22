const Pedido = require('../models/Pedido');
const Prestador = require('../models/Prestador');

// Cliente toca em "Entrar em contato" com um prestador do marketplace.
// Cria o pedido já com o valor anunciado pelo prestador (ponto de partida
// da negociação, que continua no chat).
async function criarComPrestador(req, res) {
  if (req.usuarioApp.tipo !== 'cliente') {
    return res.status(403).json({ erro: 'Somente clientes podem contatar um prestador' });
  }

  const { prestadorId, descricao } = req.body;
  if (!prestadorId) return res.status(400).json({ erro: 'prestadorId é obrigatório' });

  const prestador = await Prestador.buscarPorId(prestadorId);
  if (!prestador) return res.status(404).json({ erro: 'Prestador não encontrado' });

  const pedido = await Pedido.criarComPrestador({
    clienteId: req.usuarioApp.id,
    prestadorId,
    descricao,
    valor: prestador.valor_servico,
  });

  res.status(201).json(pedido);
}

// Cliente publica no marketplace que precisa de um serviço, sugerindo um
// valor, sem escolher um prestador específico (oferta reversa).
async function criarAberto(req, res) {
  if (req.usuarioApp.tipo !== 'cliente') {
    return res.status(403).json({ erro: 'Somente clientes podem publicar um pedido' });
  }

  const { descricao, valorSugerido, segmento } = req.body;
  if (!descricao) return res.status(400).json({ erro: 'Descreva o serviço que você precisa' });

  const pedido = await Pedido.criarAberto({
    clienteId: req.usuarioApp.id,
    descricao,
    valorSugerido,
    segmento,
  });

  res.status(201).json(pedido);
}

async function listarAbertos(req, res) {
  const pedidos = await Pedido.listarAbertos();
  res.json(pedidos);
}

async function meus(req, res) {
  const { id, tipo } = req.usuarioApp;
  const pedidos =
    tipo === 'cliente' ? await Pedido.listarDoCliente(id) : await Pedido.listarDoPrestador(id);
  res.json(pedidos);
}

async function buscar(req, res) {
  const pedido = await Pedido.buscarPorId(req.params.id);
  if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado' });
  if (!Pedido.ehParte(pedido, req.usuarioApp)) {
    return res.status(403).json({ erro: 'Você não faz parte deste pedido' });
  }
  res.json(pedido);
}

async function atualizarStatus(req, res) {
  const { status } = req.body;
  const permitidos = ['andamento', 'concluido', 'cancelado'];
  if (!permitidos.includes(status)) {
    return res.status(400).json({ erro: `status deve ser um de: ${permitidos.join(', ')}` });
  }

  const pedido = await Pedido.buscarPorId(req.params.id);
  if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado' });
  if (!Pedido.ehParte(pedido, req.usuarioApp)) {
    return res.status(403).json({ erro: 'Você não faz parte deste pedido' });
  }

  const atualizado = await Pedido.atualizarStatus(req.params.id, status);
  res.json(atualizado);
}

// Endereço só é liberado depois que o pedido é fechado no chat.
async function definirEndereco(req, res) {
  const { endereco, lat, lng } = req.body;
  if (!endereco) return res.status(400).json({ erro: 'endereco é obrigatório' });

  const pedido = await Pedido.buscarPorId(req.params.id);
  if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado' });
  if (pedido.cliente_id !== req.usuarioApp.id) {
    return res.status(403).json({ erro: 'Somente o cliente do pedido pode informar o endereço' });
  }

  const atualizado = await Pedido.definirEndereco(req.params.id, { endereco, lat, lng });
  res.json(atualizado);
}

module.exports = {
  criarComPrestador,
  criarAberto,
  listarAbertos,
  meus,
  buscar,
  atualizarStatus,
  definirEndereco,
};
