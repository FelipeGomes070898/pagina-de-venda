const Pedido = require('../models/Pedido');
const Prestador = require('../models/Prestador');
const Cliente = require('../models/Cliente');
const Cupom = require('../models/Cupom');
const CarteiraTransacao = require('../models/CarteiraTransacao');
const asaasService = require('../services/asaasService');
const pushService = require('../services/pushService');

const TAXA_URGENCIA_PERCENTUAL = 0.15; // 15% sobre o valor do pedido
const TAXA_URGENCIA_MINIMA = 10; // piso de R$10, pra pedidos de valor baixo/sem valor

function calcularTaxaUrgencia(valor) {
  if (!valor) return TAXA_URGENCIA_MINIMA;
  return Math.max(Number((valor * TAXA_URGENCIA_PERCENTUAL).toFixed(2)), TAXA_URGENCIA_MINIMA);
}

// Confere o cupom (se informado) e devolve { cupom, descontoValor } —
// cupom vem null e descontoValor 0 se nenhum código foi passado, ou se o
// código não existe/está inválido (não falha a criação do pedido por
// isso, só ignora o desconto).
async function resolverCupom(cupomCodigo, valor) {
  if (!cupomCodigo) return { cupom: null, descontoValor: 0 };

  const cupom = await Cupom.buscarPorCodigo(cupomCodigo);
  if (!cupom || !Cupom.estaValido(cupom)) return { cupom: null, descontoValor: 0 };

  return { cupom, descontoValor: Cupom.calcularDesconto(cupom, Number(valor) || 0) };
}

// Cliente toca em "Entrar em contato" com um prestador do marketplace.
// Cria o pedido já com o valor anunciado pelo prestador (ponto de partida
// da negociação, que continua no chat).
async function criarComPrestador(req, res) {
  if (req.usuarioApp.tipo !== 'cliente') {
    return res.status(403).json({ erro: 'Somente clientes podem contatar um prestador' });
  }

  const { prestadorId, descricao, urgente, cupomCodigo } = req.body;
  if (!prestadorId) return res.status(400).json({ erro: 'prestadorId é obrigatório' });

  const prestador = await Prestador.buscarPorId(prestadorId);
  if (!prestador) return res.status(404).json({ erro: 'Prestador não encontrado' });
  if (prestador.status !== 'ativo') {
    return res.status(409).json({ erro: 'Este prestador não está disponível pra novos pedidos no momento' });
  }

  const valor = prestador.valor_servico;
  const { cupom, descontoValor } = await resolverCupom(cupomCodigo, valor);
  const taxaUrgencia = urgente ? calcularTaxaUrgencia(valor) : null;

  const pedido = await Pedido.criarComPrestador({
    clienteId: req.usuarioApp.id,
    prestadorId,
    descricao,
    valor,
    urgente,
    taxaUrgencia,
    cupomCodigo: cupom?.codigo,
    descontoValor: descontoValor || null,
  });
  if (cupom) Cupom.registrarUso(cupom.id).catch(() => {});

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

  const { descricao, valorSugerido, segmento, urgente, cupomCodigo } = req.body;
  if (!descricao) return res.status(400).json({ erro: 'Descreva o serviço que você precisa' });

  const { cupom, descontoValor } = await resolverCupom(cupomCodigo, valorSugerido);
  const taxaUrgencia = urgente ? calcularTaxaUrgencia(valorSugerido) : null;

  const pedido = await Pedido.criarAberto({
    clienteId: req.usuarioApp.id,
    descricao,
    valorSugerido,
    segmento,
    urgente,
    taxaUrgencia,
    cupomCodigo: cupom?.codigo,
    descontoValor: descontoValor || null,
  });
  if (cupom) Cupom.registrarUso(cupom.id).catch(() => {});

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

  const prestador = await Prestador.buscarPorId(req.usuarioApp.id);
  if (prestador?.status !== 'ativo') {
    return res.status(409).json({
      erro: 'Sua conta está com pagamento pendente — regularize pra poder aceitar novos pedidos.',
    });
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
  if (['concluido', 'cancelado'].includes(pedido.status)) {
    return res.status(409).json({ erro: 'Este pedido já foi finalizado e não pode mais mudar de status' });
  }

  const atualizado = await Pedido.atualizarStatus(req.params.id, status);

  if (status === 'cancelado') {
    const outraParte =
      req.usuarioApp.tipo === 'cliente'
        ? { id: atualizado.prestador_id, tipo: 'prestador' }
        : { id: atualizado.cliente_id, tipo: 'cliente' };
    if (outraParte.id) {
      pushService
        .enviarPush(outraParte.id, outraParte.tipo, {
          titulo: 'Pedido cancelado',
          corpo: 'O outro lado cancelou este pedido.',
          dados: { tipo: 'pedido_cancelado', pedidoId: atualizado.id },
        })
        .catch(() => {});
    }
  }

  // Serviço concluído + prestador no modelo "5% por serviço" → cobra a
  // taxa agora. Best-effort: não falha a requisição se o Asaas cair.
  // `pedido.status !== 'concluido'` evita contar/cobrar duas vezes se
  // o mesmo pedido for marcado concluído mais de uma vez.
  // `pago_via_carteira` pula essa cobrança — se o cliente já pagou
  // pela carteira, a comissão já foi descontada na hora (ver
  // CarteiraTransacao.pagarComSaldo), cobrar de novo aqui duplicaria.
  if (status === 'concluido' && pedido.status !== 'concluido' && atualizado.prestador_id) {
    await Prestador.incrementarServicos(atualizado.prestador_id);
    await Cliente.incrementarServicos(atualizado.cliente_id);

    const prestador = await Prestador.buscarCompletoPorId(atualizado.prestador_id);
    if (prestador?.modelo_cobranca === 'percentual' && !atualizado.pago_via_carteira) {
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

const QUANDO_VALIDOS = ['antecipado', 'apos'];
const FORMA_VALIDAS = ['app', 'pix_direto'];

// Cliente avisa que já pagou — quando (antes/depois do serviço) e como
// (pelo app ou direto no Pix do prestador). Só uma atestação, não
// processa nenhum pagamento de verdade — fica registrado no pedido e
// aparece pro prestador no chat. A cobrança da taxa da plataforma (5%)
// acontece de qualquer forma quando o pedido é concluído (ver
// atualizarStatus), independente de como o cliente pagou o prestador.
async function confirmarPagamento(req, res) {
  const { quando, forma } = req.body;
  if (!QUANDO_VALIDOS.includes(quando)) {
    return res.status(400).json({ erro: `quando deve ser um de: ${QUANDO_VALIDOS.join(', ')}` });
  }
  if (forma && !FORMA_VALIDAS.includes(forma)) {
    return res.status(400).json({ erro: `forma deve ser um de: ${FORMA_VALIDAS.join(', ')}` });
  }

  const pedido = await Pedido.buscarPorId(req.params.id);
  if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado' });
  if (pedido.cliente_id !== req.usuarioApp.id) {
    return res.status(403).json({ erro: 'Somente o cliente do pedido pode confirmar o pagamento' });
  }

  const atualizado = await Pedido.confirmarPagamento(req.params.id, { quando, forma });

  pushService
    .enviarPush(atualizado.prestador_id, 'prestador', {
      titulo: 'Cliente confirmou o pagamento',
      corpo: quando === 'antecipado' ? 'Pagamento feito antecipado.' : 'Pagamento feito após o serviço.',
      dados: { tipo: 'pagamento_confirmado', pedidoId: atualizado.id },
    })
    .catch(() => {});

  res.json(atualizado);
}

// Cliente paga o pedido com o saldo da carteira — diferente de
// confirmarPagamento (autodeclaração, sem cobrança real por trás),
// isso move dinheiro de verdade entre os saldos internos: debita o
// cliente, credita o prestador já líquido (sem a comissão, retida na
// hora pro Konecta Já). Ver CarteiraTransacao.pagarComSaldo.
async function pagarComSaldo(req, res) {
  const pedido = await Pedido.buscarPorId(req.params.id);
  if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado' });
  if (pedido.cliente_id !== req.usuarioApp.id) {
    return res.status(403).json({ erro: 'Somente o cliente do pedido pode pagar' });
  }
  if (!pedido.prestador_id) {
    return res.status(409).json({ erro: 'Este pedido ainda não tem um prestador definido' });
  }
  if (!pedido.valor || Number(pedido.valor) <= 0) {
    return res.status(409).json({ erro: 'Este pedido ainda não tem um valor definido' });
  }

  // Reivindica o pagamento antes de mexer em qualquer saldo — garante
  // que duas requisições simultâneas (duplo toque, retry de rede)
  // nunca cobram o mesmo pedido duas vezes (ver
  // Pedido.reivindicarPagamentoComSaldo).
  const reivindicado = await Pedido.reivindicarPagamentoComSaldo(pedido.id);
  if (!reivindicado) {
    return res.status(409).json({
      erro: 'Este pedido já foi pago, ou o pagamento pela carteira ainda não está disponível.',
    });
  }

  const prestador = await Prestador.buscarPorId(pedido.prestador_id);
  const valorTotal = Number(pedido.valor);
  const comissao =
    prestador?.modelo_cobranca === 'percentual'
      ? Number((valorTotal * asaasService.TAXA_PERCENTUAL).toFixed(2))
      : 0;

  try {
    // Lança 409 (capturado pelo middleware de erros) se o saldo não
    // for suficiente — ver CarteiraTransacao.pagarComSaldo.
    await CarteiraTransacao.pagarComSaldo({
      pedidoId: pedido.id,
      clienteId: pedido.cliente_id,
      prestadorId: pedido.prestador_id,
      valorTotal,
      comissao,
    });
  } catch (erro) {
    // O pagamento em si não aconteceu — libera o pedido pra uma nova
    // tentativa em vez de deixá-lo travado como "já reivindicado".
    await Pedido.desfazerReivindicacaoPagamento(pedido.id).catch(() => {});
    throw erro;
  }

  const atualizado = await Pedido.confirmarPagamento(pedido.id, { quando: 'antecipado', forma: 'app' });

  pushService
    .enviarPush(atualizado.prestador_id, 'prestador', {
      titulo: 'Pagamento recebido',
      corpo: 'O cliente pagou pela carteira do Konecta Já.',
      dados: { tipo: 'pagamento_confirmado', pedidoId: atualizado.id },
    })
    .catch(() => {});

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
  confirmarPagamento,
  pagarComSaldo,
  definirEndereco,
};
