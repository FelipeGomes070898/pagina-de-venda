const Pedido = require('../models/Pedido');
const Mensagem = require('../models/Mensagem');
const Proposta = require('../models/Proposta');

async function carregarPedidoDoParticipante(req, res) {
  const pedido = await Pedido.buscarPorId(req.params.pedidoId);
  if (!pedido) {
    res.status(404).json({ erro: 'Pedido não encontrado' });
    return null;
  }
  if (!Pedido.ehParte(pedido, req.usuarioApp)) {
    res.status(403).json({ erro: 'Você não faz parte desta conversa' });
    return null;
  }
  return pedido;
}

async function listar(req, res) {
  const pedido = await carregarPedidoDoParticipante(req, res);
  if (!pedido) return;

  const [mensagens, propostas] = await Promise.all([
    Mensagem.listarPorPedido(pedido.id),
    Proposta.listarPorPedido(pedido.id),
  ]);

  res.json({ pedido, mensagens, propostas });
}

async function enviarMensagem(req, res) {
  const pedido = await carregarPedidoDoParticipante(req, res);
  if (!pedido) return;

  const { conteudo } = req.body;
  if (!conteudo || !conteudo.trim()) {
    return res.status(400).json({ erro: 'Mensagem vazia' });
  }

  const mensagem = await Mensagem.criar({
    pedidoId: pedido.id,
    remetenteId: req.usuarioApp.id,
    remetenteTipo: req.usuarioApp.tipo,
    conteudo: conteudo.trim(),
  });

  res.status(201).json(mensagem);
}

async function enviarProposta(req, res) {
  const pedido = await carregarPedidoDoParticipante(req, res);
  if (!pedido) return;

  const { valor, descricao } = req.body;
  if (!valor || Number(valor) <= 0) {
    return res.status(400).json({ erro: 'Informe um valor válido para a proposta' });
  }

  const proposta = await Proposta.criar({
    pedidoId: pedido.id,
    remetenteId: req.usuarioApp.id,
    remetenteTipo: req.usuarioApp.tipo,
    valor,
    descricao,
  });

  await Mensagem.criarSistema(pedido.id, `Proposta enviada: R$ ${Number(valor).toFixed(2)}`);

  res.status(201).json(proposta);
}

// Só quem NÃO enviou a proposta pode aceitar/recusar (a outra parte).
async function responderProposta(req, res) {
  const pedido = await carregarPedidoDoParticipante(req, res);
  if (!pedido) return;

  const { acao } = req.body;
  if (!['aceitar', 'recusar'].includes(acao)) {
    return res.status(400).json({ erro: 'acao deve ser "aceitar" ou "recusar"' });
  }

  const proposta = await Proposta.buscarPorId(req.params.propostaId);
  if (!proposta || proposta.pedido_id !== pedido.id) {
    return res.status(404).json({ erro: 'Proposta não encontrada' });
  }
  if (proposta.status !== 'pendente') {
    return res.status(409).json({ erro: 'Esta proposta já foi respondida' });
  }
  if (proposta.remetente_id === req.usuarioApp.id) {
    return res.status(403).json({ erro: 'Você não pode responder a própria proposta' });
  }

  const novoStatus = acao === 'aceitar' ? 'aceita' : 'recusada';
  const propostaAtualizada = await Proposta.atualizarStatus(proposta.id, novoStatus);

  if (acao === 'aceitar') {
    await Pedido.fecharComValor(pedido.id, proposta.valor);
    await Mensagem.criarSistema(
      pedido.id,
      `Proposta aceita: R$ ${Number(proposta.valor).toFixed(2)}. Pedido fechado — envie o endereço para continuar.`,
    );
  } else {
    await Mensagem.criarSistema(pedido.id, 'Proposta recusada.');
  }

  res.json(propostaAtualizada);
}

module.exports = { listar, enviarMensagem, enviarProposta, responderProposta };
