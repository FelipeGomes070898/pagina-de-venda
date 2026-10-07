import { api } from './api';

// "Área de serviço": outros trabalhos que o prestador também faz, além
// do segmento principal do cadastro — cada um com sua própria diária.
export async function adicionarServico({ categoria, valor, descricao }) {
  const { data } = await api.post('/api/prestadores/me/servicos', { categoria, valor, descricao });
  return data;
}

export async function removerServico(servicoId) {
  await api.delete(`/api/prestadores/me/servicos/${servicoId}`);
}
