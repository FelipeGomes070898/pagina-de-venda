// Upload de imagens (foto de perfil, álbum de trabalhos) via Vercel
// Blob, direto do navegador/app pro Blob (ver uploadController.js —
// evita o limite de 4.5MB de corpo das funções serverless da Vercel).
// Mesmo padrão "best-effort documentado" do resto do projeto (Firebase,
// Asaas, Google): sem BLOB_READ_WRITE_TOKEN configurado, os endpoints de
// upload respondem com um erro claro, sem derrubar o resto do app.
//
// Pra configurar: no dashboard da Vercel, no projeto do backend, aba
// Storage > Create Database > Blob. Isso gera e já conecta a variável
// BLOB_READ_WRITE_TOKEN automaticamente (não precisa copiar/colar nada).
function configurado() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

// Best-effort: se a remoção falhar (token ausente, URL já removida...),
// só loga — nunca impede o registro de ser apagado do banco.
async function removerImagem(url) {
  if (!configurado() || !url) return;
  try {
    const { del } = require('@vercel/blob');
    await del(url);
  } catch (erro) {
    console.error('[blob] Falha ao remover imagem:', erro.message);
  }
}

module.exports = { configurado, removerImagem };
