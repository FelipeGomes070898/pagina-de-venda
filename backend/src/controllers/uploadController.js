// Upload de imagens direto do navegador/app pro Vercel Blob, sem passar
// pela nossa função serverless — necessário porque a Vercel limita o
// corpo de uma requisição de função em 4.5MB (foto de celular passa
// disso fácil), e não tem como configurar esse limite pra cima. O fluxo
// é: 1) cliente pede um token aqui (JSON pequeno), 2) cliente manda os
// bytes da imagem direto pro Blob usando esse token, 3) cliente chama um
// endpoint separado (ex.: PATCH /api/auth/me/foto) pra gente salvar a
// URL resultante no banco.
const { handleUpload } = require('@vercel/blob/client');
const { configurado: blobConfigurado } = require('../config/blob');

const TIPOS_AUTORIZADOS = ['image/jpeg', 'image/png', 'image/webp'];
const TAMANHO_MAXIMO_BYTES = 8 * 1024 * 1024; // 8MB (sem a inflação do base64, já que vai direto)

// Só autoriza o token se o caminho pedido realmente pertence a quem tá
// logado — senão qualquer um autenticado poderia pedir um token pra
// sobrescrever a foto de outra pessoa.
function caminhoPertenceAoUsuario(pathname, usuarioApp) {
  const prefixoPerfil = `perfil/${usuarioApp.tipo}/${usuarioApp.id}/`;
  if (pathname.startsWith(prefixoPerfil)) return true;

  if (usuarioApp.tipo === 'prestador' && pathname.startsWith(`trabalhos/${usuarioApp.id}/`)) {
    return true;
  }
  return false;
}

async function gerarToken(req, res) {
  if (!blobConfigurado()) {
    return res.status(503).json({ erro: 'Upload de fotos ainda não configurado no servidor' });
  }

  try {
    const resultado = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        if (!caminhoPertenceAoUsuario(pathname, req.usuarioApp)) {
          throw new Error('Caminho de upload não autorizado');
        }
        return {
          allowedContentTypes: TIPOS_AUTORIZADOS,
          maximumSizeInBytes: TAMANHO_MAXIMO_BYTES,
          addRandomSuffix: true,
        };
      },
      // Sem onUploadCompleted de propósito: quem persiste a URL no banco
      // é o próprio cliente, chamando um segundo endpoint logo depois do
      // upload terminar (ver comentário no topo do arquivo).
    });
    res.json(resultado);
  } catch (erro) {
    res.status(400).json({ erro: erro.message || 'Não foi possível gerar o upload' });
  }
}

module.exports = { gerarToken };
