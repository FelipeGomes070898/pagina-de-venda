import { api } from './api';

export async function criarTicket({ assunto, mensagem }) {
  const { data } = await api.post('/api/tickets', { assunto, mensagem });
  return data;
}

export async function meusTickets() {
  const { data } = await api.get('/api/tickets/meus');
  return data;
}
