import { api } from './api';

export interface TransacaoCarteira {
  id: string;
  usuario_id: string;
  usuario_tipo: 'cliente' | 'prestador';
  tipo: 'deposito' | 'pagamento_enviado' | 'pagamento_recebido' | 'saque' | 'estorno';
  valor: number;
  status: 'pendente' | 'concluido' | 'falhou';
  pedido_id: string | null;
  descricao: string | null;
  criado_em: string;
}

export async function meuSaldo(): Promise<{ saldo: number }> {
  const { data } = await api.get('/api/carteira/saldo');
  return data;
}

export async function meuExtrato(): Promise<TransacaoCarteira[]> {
  const { data } = await api.get('/api/carteira/extrato');
  return data;
}

export async function depositar(valor: number): Promise<{ invoiceUrl: string; asaasPaymentId: string }> {
  const { data } = await api.post('/api/carteira/depositar', { valor });
  return data;
}

export type TipoChavePix = 'CPF' | 'EMAIL' | 'PHONE' | 'EVP';

export async function sacar(payload: {
  valor: number;
  chavePix: string;
  tipoChavePix: TipoChavePix;
}): Promise<TransacaoCarteira> {
  const { data } = await api.post('/api/carteira/sacar', payload);
  return data;
}
