// Inicialização do Firebase Admin SDK (push notifications). Mesmo padrão
// de "best-effort" do asaasService: sem a credencial configurada
// (FIREBASE_SERVICE_ACCOUNT_JSON), o app inteiro continua funcionando
// normal — só as notificações push não saem, e isso é avisado no log,
// nunca quebra uma requisição.
//
// FIREBASE_SERVICE_ACCOUNT_JSON deve conter o conteúdo do arquivo JSON
// da conta de serviço (Firebase Console > Configurações do projeto >
// Contas de serviço > Gerar nova chave privada), colado direto como
// variável de ambiente (ou em base64, se o provedor de deploy não
// aceitar JSON com quebras de linha na variável).
let appInicializado = null;
let tentouInicializar = false;

function configurado() {
  return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
}

function obterApp() {
  if (appInicializado) return appInicializado;
  if (tentouInicializar || !configurado()) return null;
  tentouInicializar = true;

  try {
    const admin = require('firebase-admin');
    const bruto = process.env.FIREBASE_SERVICE_ACCOUNT_JSON.trim();
    const json = bruto.startsWith('{') ? bruto : Buffer.from(bruto, 'base64').toString('utf-8');
    const credenciais = JSON.parse(json);

    appInicializado = admin.initializeApp({ credential: admin.credential.cert(credenciais) });
    return appInicializado;
  } catch (erro) {
    console.error('[firebase] FIREBASE_SERVICE_ACCOUNT_JSON inválida, push notifications desativadas:', erro.message);
    return null;
  }
}

module.exports = { configurado, obterApp };
