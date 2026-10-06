import { upload } from '@vercel/blob/client';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';

// Redimensiona/comprime no navegador antes de subir — foto de celular
// direto da câmera pode ter vários MB, e a maior parte disso é
// resolução que a tela nunca vai mostrar. Cai graciosamente pro arquivo
// original se o navegador não suportar (ex.: sem Canvas).
async function redimensionar(arquivo, ladoMaximo = 1280, qualidade = 0.82) {
  const bitmap = await createImageBitmap(arquivo);
  const escala = Math.min(1, ladoMaximo / Math.max(bitmap.width, bitmap.height));
  const largura = Math.round(bitmap.width * escala);
  const altura = Math.round(bitmap.height * escala);

  const canvas = document.createElement('canvas');
  canvas.width = largura;
  canvas.height = altura;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, largura, altura);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Falha ao comprimir'))), 'image/jpeg', qualidade);
  });
}

// Sobe a imagem direto do navegador pro Vercel Blob (nunca passa pela
// nossa função serverless — ela tem um limite de 4.5MB de corpo que uma
// foto de celular estoura fácil). O backend só autoriza o upload (ver
// POST /api/uploads/handle-blob) e depois a URL resultante é salva com
// uma chamada separada (PATCH /api/auth/me/foto ou POST .../fotos-trabalho).
export async function enviarImagem(arquivo, pathname) {
  const token = useAuthStore.getState().token;

  let corpo = arquivo;
  try {
    corpo = await redimensionar(arquivo);
  } catch {
    // segue com o arquivo original
  }

  const resultado = await upload(pathname, corpo, {
    access: 'public',
    contentType: 'image/jpeg',
    handleUploadUrl: `${API_URL}/api/uploads/handle-blob`,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  return resultado.url;
}
