import { api } from './api';

// Álbum de trabalhos realizados (só prestador). Chamado depois que a
// foto já subiu pro Vercel Blob — ver uploadService.js.
export async function adicionarFotoTrabalho({ url, legenda }) {
  const { data } = await api.post('/api/prestadores/me/fotos-trabalho', { url, legenda });
  return data;
}

export async function removerFotoTrabalho(fotoId) {
  await api.delete(`/api/prestadores/me/fotos-trabalho/${fotoId}`);
}
