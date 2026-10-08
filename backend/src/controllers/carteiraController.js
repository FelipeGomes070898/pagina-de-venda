const CarteiraTransacao = require('../models/CarteiraTransacao');
const Cliente = require('../models/Cliente');
const asaasService = require('../services/asaasService');

const VALOR_MINIMO_DEPOSITO = 5;
const VALOR_MINIMO_SAQUE = 10;
const TIPOS_CHAVE_PIX = ['CPF', 'EMAIL', 'PHONE', 'EVP'];

async function meuSaldo(req, res) {
  const { id, tipo } = req.usuarioApp;
  const saldo = await CarteiraTransacao.saldo(id, tipo);
  res.json({ saldo });
}

// Dashboard de entrada/saída por mês — só faz sentido pro prestador
// (é quem recebe por serviço e saca; o cliente só deposita/gasta, sem
// o mesmo padrão de "renda").
async function meuDashboard(req, res) {
  if (req.usuarioApp.tipo !== 'prestador') {
    return res.status(403).json({ erro: 'Dashboard disponível só pra prestadores' });
  }
  const { id, tipo } = req.usuarioApp;
  const porMes = await CarteiraTransacao.dashboardMensal(id, tipo);
  res.json({ porMes });
}

async function meuExtrato(req, res) {
  const { id, tipo } = req.usuarioApp;
  const pagina = req.query.page ? Number(req.query.page) : 1;
  const extrato = await CarteiraTransacao.extrato(id, tipo, { pagina });
  res.json(extrato);
}

// Cliente gera uma cobrança (Pix/cartão/boleto, via página hospedada
// do Asaas) pra colocar dinheiro na carteira. O valor só entra de
// verdade quando o webhook confirmar o pagamento (ver
// pagamentoController.webhook).
async function criarDeposito(req, res) {
  if (req.usuarioApp.tipo !== 'cliente') {
    return res.status(403).json({ erro: 'Somente clientes podem depositar na carteira' });
  }

  const valor = Number(req.body.valor);
  if (!valor || valor < VALOR_MINIMO_DEPOSITO) {
    return res
      .status(400)
      .json({ erro: `Informe um valor de pelo menos R$ ${VALOR_MINIMO_DEPOSITO.toFixed(2)}` });
  }

  const cliente = await Cliente.buscarCompletoPorId(req.usuarioApp.id);
  if (!cliente) return res.status(404).json({ erro: 'Conta não encontrada' });

  const cobranca = await asaasService.criarCobrancaDeposito(cliente, valor);
  await CarteiraTransacao.registrarDeposito({
    usuarioId: cliente.id,
    usuarioTipo: 'cliente',
    valor,
    asaasPaymentId: cobranca.id,
  });

  res.status(201).json({ invoiceUrl: cobranca.invoiceUrl, asaasPaymentId: cobranca.id });
}

// Cliente ou prestador pede pra tirar dinheiro da carteira, via chave
// Pix (não exige cadastro de dados bancários completos). O valor é
// debitado na hora (reserva o saldo); se a transferência no Asaas
// falhar, o valor volta automaticamente (ver registrarEstorno).
async function solicitarSaque(req, res) {
  const { id, tipo } = req.usuarioApp;
  const valor = Number(req.body.valor);
  const { chavePix, tipoChavePix } = req.body;

  if (!valor || valor < VALOR_MINIMO_SAQUE) {
    return res
      .status(400)
      .json({ erro: `Informe um valor de pelo menos R$ ${VALOR_MINIMO_SAQUE.toFixed(2)}` });
  }
  if (!chavePix || !TIPOS_CHAVE_PIX.includes(tipoChavePix)) {
    return res.status(400).json({
      erro: 'Informe uma chave Pix e o tipo dela (CPF, e-mail, telefone ou aleatória)',
    });
  }

  // Lança 409 (capturado pelo middleware de erros) se o saldo não for
  // suficiente — ver CarteiraTransacao.registrarSaque.
  const transacao = await CarteiraTransacao.registrarSaque({ usuarioId: id, usuarioTipo: tipo, valor });

  try {
    const transferencia = await asaasService.criarTransferenciaPix({
      chavePix,
      tipoChavePix,
      valor,
      descricao: `Saque Konecta Já (${tipo})`,
    });
    await CarteiraTransacao.vincularTransferencia(transacao.id, transferencia.id);
  } catch (erro) {
    console.error('[carteira] Falha ao transferir saque, estornando:', erro.response?.data || erro.message);
    await CarteiraTransacao.registrarEstorno({
      usuarioId: id,
      usuarioTipo: tipo,
      valor,
      descricao: 'Estorno: não foi possível processar o saque',
    });
    return res.status(502).json({
      erro: 'Não foi possível processar o saque agora — o valor voltou pra sua carteira. Tente de novo em instantes.',
    });
  }

  res.status(201).json(transacao);
}

module.exports = { meuSaldo, meuExtrato, meuDashboard, criarDeposito, solicitarSaque };
