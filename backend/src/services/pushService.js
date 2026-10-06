// Envio de push notifications (Firebase Cloud Messaging). Mesmo padrão
// "best-effort" do asaasService: nunca lança erro pra quem chamou —
// uma notificação que falha não pode derrubar o envio de uma mensagem
// no chat, por exemplo.
const FcmToken = require('../models/FcmToken');
const { configurado, obterApp } = require('../config/firebase');

const CODIGOS_TOKEN_MORTO = [
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
];

// `dados` vai como payload "data" do FCM (tudo string — o app mobile usa
// isso pra navegar direto pra tela certa ao tocar na notificação).
async function enviarPush(usuarioId, usuarioTipo, { titulo, corpo, dados } = {}) {
  if (!configurado()) {
    console.warn(`[push] FIREBASE_SERVICE_ACCOUNT_JSON não configurada — notificação não enviada (${usuarioTipo} ${usuarioId})`);
    return;
  }

  const app = obterApp();
  if (!app) return;

  const tokens = await FcmToken.listarPorUsuario(usuarioId, usuarioTipo);
  if (!tokens.length) return;

  try {
    const admin = require('firebase-admin');
    const resposta = await admin.messaging(app).sendEachForMulticast({
      tokens,
      notification: { title: titulo, body: corpo },
      data: dados
        ? Object.fromEntries(Object.entries(dados).map(([chave, valor]) => [chave, String(valor)]))
        : undefined,
    });

    const tokensMortos = resposta.responses
      .map((r, i) => (!r.success && CODIGOS_TOKEN_MORTO.includes(r.error?.code) ? tokens[i] : null))
      .filter(Boolean);
    if (tokensMortos.length) {
      await FcmToken.removerTokens(tokensMortos);
    }
  } catch (erro) {
    console.error('[push] Falha ao enviar notificação:', erro.message);
  }
}

module.exports = { enviarPush };
