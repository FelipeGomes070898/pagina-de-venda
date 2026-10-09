import { upload } from '@vercel/blob/client';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';

// Em alguns navegadores (principalmente WebViews Android), canvas.toBlob
// às vezes nunca chama o callback — nem sucesso nem erro — travando a
// Promise pra sempre. Esse timeout garante que o upload sempre acaba
// com sucesso ou erro, nunca girando infinitamente sem explicação.
function comTimeout(promessa, ms, mensagemErro) {
  return Promise.race([
    promessa,
    new Promise((_, reject) => setTimeout(() => reject(new Error(mensagemErro)), ms)),
  ]);
}

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
    corpo = await comTimeout(redimensionar(arquivo), 8000, 'timeout compressão');
  } catch {
    // segue com o arquivo original (compressão falhou ou travou)
    corpo = arquivo;
  }

  try {
    const resultado = await comTimeout(
      upload(pathname, corpo, {
        access: 'public',
        contentType: 'image/jpeg',
        handleUploadUrl: `${API_URL}/api/uploads/handle-blob`,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }),
      30000,
      // O SDK do Vercel Blob tenta de novo sozinho (até 10x, com espera
      // crescente) quando o servidor devolve um erro que ele não
      // reconhece — então um backend sem BLOB_READ_WRITE_TOKEN
      // configurado (ver backend/src/config/blob.js) também aparece
      // como "demorou demais", não como o erro real. Por isso a
      // mensagem já aponta as duas causas prováveis, em vez de só
      // sugerir "internet ruim".
      'Tempo esgotado enviando a foto. Pode ser sua internet, ou o armazenamento de imagens ainda não estar configurado no servidor — avise o suporte se continuar em toda tentativa.',
    );
    return resultado.url;
  } catch (erro) {
    if (erro?.message?.includes('esgotado')) throw erro;
    throw new Error('Não foi possível enviar a foto agora. Tente novamente em instantes.');
  }
}
