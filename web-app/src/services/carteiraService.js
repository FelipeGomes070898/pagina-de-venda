import { api } from './api';

export async function meuSaldo() {
  const { data } = await api.get('/api/carteira/saldo');
  return data;
}

export async function meuExtrato(pagina = 1) {
  const { data } = await api.get('/api/carteira/extrato', { params: { page: pagina } });
  return data;
}

export async function meuDashboard() {
  const { data } = await api.get('/api/carteira/dashboard');
  return data;
}

export async function depositar(valor) {
  const { data } = await api.post('/api/carteira/depositar', { valor });
  return data;
}

export async function sacar({ valor, chavePix, tipoChavePix }) {
  const { data } = await api.post('/api/carteira/sacar', { valor, chavePix, tipoChavePix });
  return data;
}
