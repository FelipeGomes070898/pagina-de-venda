const Pedido = require('../models/Pedido');
const Mensagem = require('../models/Mensagem');
const Proposta = require('../models/Proposta');
const pushService = require('../services/pushService');

// Quem recebe a notificação é sempre a outra parte do pedido, nunca
// quem acabou de agir. `null` quando o pedido ainda não tem prestador
// vinculado (oferta aberta) — nesse caso não há pra quem notificar.
function outraParte(pedido, remetente) {
  if (remetente.tipo === 'cliente') {
    return pedido.prestador_id ? { id: pedido.prestador_id, tipo: 'prestador' } : null;
  }
  return { id: pedido.cliente_id, tipo: 'cliente' };
}

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

  const destinatario = outraParte(pedido, req.usuarioApp);
  if (destinatario) {
    pushService
      .enviarPush(destinatario.id, destinatario.tipo, {
        titulo: 'Nova mensagem',
        corpo: conteudo.trim().slice(0, 120),
        dados: { tipo: 'mensagem', pedidoId: pedido.id },
      })
      .catch(() => {});
  }

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

  const destinatario = outraParte(pedido, req.usuarioApp);
  if (destinatario) {
    pushService
      .enviarPush(destinatario.id, destinatario.tipo, {
        titulo: 'Nova proposta de valor',
        corpo: `R$ ${Number(valor).toFixed(2)}${descricao ? ` — ${descricao}` : ''}`,
        dados: { tipo: 'proposta', pedidoId: pedido.id },
      })
      .catch(() => {});
  }

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
  if (acao === 'aceitar' && ['concluido', 'cancelado'].includes(pedido.status)) {
    return res.status(409).json({ erro: 'Este pedido já foi finalizado — não é possível aceitar propostas' });
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

  // Notifica quem enviou a proposta original (não quem respondeu agora).
  pushService
    .enviarPush(proposta.remetente_id, proposta.remetente_tipo, {
      titulo: acao === 'aceitar' ? 'Proposta aceita!' : 'Proposta recusada',
      corpo:
        acao === 'aceitar'
          ? `Sua proposta de R$ ${Number(proposta.valor).toFixed(2)} foi aceita.`
          : `Sua proposta de R$ ${Number(proposta.valor).toFixed(2)} foi recusada.`,
      dados: { tipo: 'proposta_resposta', pedidoId: pedido.id },
    })
    .catch(() => {});

  res.json(propostaAtualizada);
}

module.exports = { listar, enviarMensagem, enviarProposta, responderProposta };
