// Encapsula @react-native-firebase/messaging. Assim como o login com
// Google, exige configuração nativa que depende de uma credencial que só
// o dono do projeto pode gerar (criar o projeto no Firebase Console e
// colocar o google-services.json em android/app/) — ver
// mobile/README.md > "Notificações push". Até isso existir,
// disponivel() retorna false e o app simplesmente não pede permissão
// nem registra token nenhum, sem quebrar nada (mesmo padrão de
// googleAuthService.ts).
import { Platform, PermissionsAndroid } from 'react-native';
import { api } from './api';

let messaging: typeof import('@react-native-firebase/messaging').default | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  messaging = require('@react-native-firebase/messaging').default;
} catch {
  messaging = null;
}

export function disponivel(): boolean {
  return !!messaging;
}

async function solicitarPermissaoAndroid(): Promise<boolean> {
  // POST_NOTIFICATIONS só existe/é exigida a partir do Android 13 (API 33);
  // em versões anteriores a notificação já chega sem pedir nada.
  if (Platform.OS !== 'android' || Number(Platform.Version) < 33) return true;
  try {
    const resultado = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    return resultado === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

// Pede permissão, obtém o token do FCM deste dispositivo e manda pro
// backend salvar (vinculado ao usuário logado). Chamar depois do
// login/cadastro bem-sucedido. Nunca lança erro: sem Firebase
// configurado, ou se o usuário negar a permissão, o app continua
// funcionando normal, só sem notificações.
export async function registrarDispositivoParaNotificacoes(): Promise<void> {
  if (!disponivel() || !messaging) return;

  try {
    const permitido = await solicitarPermissaoAndroid();
    if (!permitido) return;

    const instancia = messaging();
    const status = await instancia.requestPermission();
    const autorizado =
      status === messaging.AuthorizationStatus.AUTHORIZED ||
      status === messaging.AuthorizationStatus.PROVISIONAL;
    if (!autorizado) return;

    const token = await instancia.getToken();
    if (!token) return;

    await api.post('/api/notificacoes/token', { token, plataforma: Platform.OS });
  } catch {
    // Sem google-services.json configurado, ou qualquer outra falha —
    // best-effort, o app não depende disso pra funcionar.
  }
}

// Chamar no logout, pra esse dispositivo parar de receber notificações
// da conta que acabou de saír. Recebe o token de sessão explicitamente
// (em vez de depender do header padrão do axios) porque o logout limpa
// esse header de forma síncrona, antes dessa chamada assíncrona chegar
// a disparar a requisição — sem isso, o DELETE sairia sem Authorization
// e cairia no interceptor de 401, chamando logout() de novo.
export async function removerDispositivoDasNotificacoes(tokenSessao?: string | null): Promise<void> {
  if (!disponivel() || !messaging) return;
  try {
    const token = await messaging().getToken();
    if (token) {
      await api.delete('/api/notificacoes/token', {
        data: { token },
        headers: tokenSessao ? { Authorization: `Bearer ${tokenSessao}` } : undefined,
      });
    }
  } catch {
    // ignorado — best-effort
  }
}

// Chamar uma vez na inicialização do app (AppNavigator), só quando
// autenticado. Cobre os dois jeitos de abrir o app tocando numa
// notificação: app em background (onNotificationOpenedApp) e app
// fechado/quit (getInitialNotification). Retorna uma função de
// cancelamento (ou um no-op se indisponível).
export function configurarAberturaPorNotificacao(
  aoAbrir: (dados: Record<string, string>) => void,
): () => void {
  if (!disponivel() || !messaging) return () => {};

  try {
    const instancia = messaging();

    instancia.getInitialNotification().then((mensagemRemota) => {
      if (mensagemRemota?.data) aoAbrir(mensagemRemota.data as Record<string, string>);
    });

    return instancia.onNotificationOpenedApp((mensagemRemota) => {
      if (mensagemRemota?.data) aoAbrir(mensagemRemota.data as Record<string, string>);
    });
  } catch {
    return () => {};
  }
}

// Precisa ser chamado uma única vez, fora da árvore de componentes
// (index.js), antes do app renderizar — exigência da própria lib pra
// tratar notificações recebidas com o app em background/fechado.
export function registrarHandlerBackground(): void {
  if (!disponivel() || !messaging) return;
  try {
    messaging().setBackgroundMessageHandler(async () => {
      // Nada a fazer aqui além de deixar o sistema exibir a notificação
      // — a navegação pro pedido certo acontece ao tocar nela, quando o
      // app volta pro foreground (configurarListenerForeground/dados).
    });
  } catch {
    // ignorado — best-effort
  }
}
