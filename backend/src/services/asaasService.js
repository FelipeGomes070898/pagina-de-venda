// Integração com o Asaas (cobrança do prestador). Todas as funções são
// "best-effort": se ASAAS_API_KEY não estiver configurada (ambiente de
// desenvolvimento, ou antes do dono configurar a conta Asaas), elas
// registram um aviso e não quebram o fluxo principal (cadastro, fechar
// pedido) — a plataforma continua funcionando, só a cobrança automática
// fica pendente até a chave ser configurada.
const asaas = require('../config/asaas');
const Prestador = require('../models/Prestador');
const Pagamento = require('../models/Pagamento');

const TAXA_PERCENTUAL = 0.05; // 5% por serviço concluído
const VALOR_ASSINATURA_MENSAL = 25;

function asaasConfigurado() {
  return Boolean(process.env.ASAAS_API_KEY);
}

function daquiA(dias) {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  return data.toISOString().slice(0, 10); // YYYY-MM-DD
}

// Cria o cliente no Asaas para o prestador (necessário antes de qualquer
// cobrança) e salva o id em prestadores.asaas_customer_id.
async function garantirClienteAsaas(prestador) {
  if (prestador.asaas_customer_id) return prestador.asaas_customer_id;
  if (!asaasConfigurado()) {
    console.warn(`[asaas] ASAAS_API_KEY não configurada — pulando criação de cliente (prestador ${prestador.id})`);
    return null;
  }

  try {
    const { data } = await asaas.post('/customers', {
      name: prestador.nome,
      email: prestador.email,
      cpfCnpj: prestador.cpf,
      mobilePhone: prestador.telefone,
    });
    await Prestador.definirAsaasCustomerId(prestador.id, data.id);
    return data.id;
  } catch (erro) {
    console.error('[asaas] Falha ao criar cliente:', erro.response?.data || erro.message);
    return null;
  }
}

// Prestador escolheu cobrança fixa mensal (R$25) — cria a assinatura
// recorrente no Asaas. Primeira cobrança em 7 dias (carência inicial).
async function criarAssinaturaMensal(prestador) {
  if (!asaasConfigurado()) {
    console.warn(`[asaas] ASAAS_API_KEY não configurada — assinatura mensal não criada (prestador ${prestador.id})`);
    return null;
  }

  const customerId = await garantirClienteAsaas(prestador);
  if (!customerId) return null;

  try {
    const { data } = await asaas.post('/subscriptions', {
      customer: customerId,
      billingType: 'PIX',
      value: VALOR_ASSINATURA_MENSAL,
      cycle: 'MONTHLY',
      nextDueDate: daquiA(7),
      description: 'Assinatura mensal Vexo — taxa fixa da plataforma',
    });
    return data;
  } catch (erro) {
    console.error('[asaas] Falha ao criar assinatura:', erro.response?.data || erro.message);
    return null;
  }
}

// Prestador escolheu cobrança por serviço (5%) — cria uma cobrança Pix
// avulsa quando um pedido é concluído, e registra em `pagamentos`.
async function cobrarTaxaServico(prestador, pedido) {
  if (!pedido.valor || pedido.valor <= 0) return null;
  const valorTaxa = Number((pedido.valor * TAXA_PERCENTUAL).toFixed(2));

  if (!asaasConfigurado()) {
    console.warn(`[asaas] ASAAS_API_KEY não configurada — taxa de serviço não cobrada (prestador ${prestador.id})`);
    return Pagamento.criar({
      prestadorId: prestador.id,
      pedidoId: pedido.id,
      tipo: 'taxa_servico',
      valor: valorTaxa,
      metodo: 'pix',
    });
  }

  const customerId = await garantirClienteAsaas(prestador);
  if (!customerId) {
    return Pagamento.criar({
      prestadorId: prestador.id,
      pedidoId: pedido.id,
      tipo: 'taxa_servico',
      valor: valorTaxa,
      metodo: 'pix',
    });
  }

  try {
    const { data } = await asaas.post('/payments', {
      customer: customerId,
      billingType: 'PIX',
      value: valorTaxa,
      dueDate: daquiA(3),
      description: `Taxa Vexo (5%) — serviço concluído #${pedido.id}`,
    });

    return Pagamento.criar({
      prestadorId: prestador.id,
      pedidoId: pedido.id,
      tipo: 'taxa_servico',
      valor: valorTaxa,
      metodo: 'pix',
      asaasId: data.id,
      vencimento: data.dueDate,
    });
  } catch (erro) {
    console.error('[asaas] Falha ao criar cobrança de serviço:', erro.response?.data || erro.message);
    return Pagamento.criar({
      prestadorId: prestador.id,
      pedidoId: pedido.id,
      tipo: 'taxa_servico',
      valor: valorTaxa,
      metodo: 'pix',
    });
  }
}

module.exports = {
  TAXA_PERCENTUAL,
  VALOR_ASSINATURA_MENSAL,
  garantirClienteAsaas,
  criarAssinaturaMensal,
  cobrarTaxaServico,
};
