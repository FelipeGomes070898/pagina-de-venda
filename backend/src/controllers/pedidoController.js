const Pedido = require('../models/Pedido');
const Prestador = require('../models/Prestador');
const asaasService = require('../services/asaasService');
const pushService = require('../services/pushService');

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

  pushService
    .enviarPush(prestadorId, 'prestador', {
      titulo: 'Novo pedido de serviço',
      corpo: descricao ? descricao.slice(0, 120) : 'Um cliente quer contratar seu serviço.',
      dados: { tipo: 'novo_pedido', pedidoId: pedido.id },
    })
    .catch(() => {});

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
  const { cidade, segmento } = req.query;
  const pedidos = await Pedido.listarAbertos({ cidade, segmento });
  res.json(pedidos);
}

// Prestador responde a um pedido em aberto (publicado por um cliente sem
// escolher ninguém específico) — equivalente a "entrar em contato", só
// que iniciado pelo prestador. A partir daqui segue o fluxo normal:
// chat, proposta, fechamento.
async function responderAberto(req, res) {
  if (req.usuarioApp.tipo !== 'prestador') {
    return res.status(403).json({ erro: 'Somente prestadores podem responder a um pedido aberto' });
  }

  const atualizado = await Pedido.responderAberto(req.params.id, req.usuarioApp.id);
  if (!atualizado) {
    return res.status(409).json({ erro: 'Este pedido já não está mais disponível' });
  }

  pushService
    .enviarPush(atualizado.cliente_id, 'cliente', {
      titulo: 'Um prestador respondeu seu pedido',
      corpo: 'Toque para ver os detalhes e conversar.',
      dados: { tipo: 'pedido_respondido', pedidoId: atualizado.id },
    })
    .catch(() => {});

  res.json(atualizado);
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

  // Serviço concluído + prestador no modelo "5% por serviço" → cobra a
  // taxa agora. Best-effort: não falha a requisição se o Asaas cair.
  // `pedido.status !== 'concluido'` evita contar/cobrar duas vezes se
  // o mesmo pedido for marcado concluído mais de uma vez.
  if (status === 'concluido' && pedido.status !== 'concluido' && atualizado.prestador_id) {
    await Prestador.incrementarServicos(atualizado.prestador_id);

    const prestador = await Prestador.buscarCompletoPorId(atualizado.prestador_id);
    if (prestador?.modelo_cobranca === 'percentual') {
      asaasService.cobrarTaxaServico(prestador, atualizado).catch(() => {});
    }

    pushService
      .enviarPush(atualizado.cliente_id, 'cliente', {
        titulo: 'Serviço concluído',
        corpo: 'Que tal avaliar o prestador?',
        dados: { tipo: 'avaliar', pedidoId: atualizado.id },
      })
      .catch(() => {});
  }

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
  responderAberto,
  meus,
  buscar,
  atualizarStatus,
  definirEndereco,
};
