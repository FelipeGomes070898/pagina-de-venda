// Encapsula @react-native-google-signin/google-signin. Essa lib exige
// configuração nativa que não existe neste repositório ainda (projeto
// android/ios gerado localmente, google-services.json, OAuth client
// Android com o SHA-1 do keystore) — ver mobile/README.md. Até isso
// ser feito, `disponivel()` retorna false e o botão de Google some da
// tela, sem quebrar o login normal.
let GoogleSignin: typeof import('@react-native-google-signin/google-signin').GoogleSignin | null =
  null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
} catch {
  GoogleSignin = null;
}

let configurado = false;

export function disponivel(): boolean {
  return !!GoogleSignin && !!WEB_CLIENT_ID;
}

// Client ID tipo "Web application" no Google Cloud Console — o MESMO
// configurado em GOOGLE_CLIENT_ID no backend. Definido via variável de
// ambiente do build (ex.: react-native-config), não hardcoded.
const WEB_CLIENT_ID = process.env.GOOGLE_WEB_CLIENT_ID || '';

function garantirConfigurado() {
  if (configurado || !GoogleSignin) return;
  GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
  configurado = true;
}

// Retorna o idToken do Google, ou null se indisponível/cancelado.
export async function obterIdTokenGoogle(): Promise<string | null> {
  if (!disponivel() || !GoogleSignin) return null;

  garantirConfigurado();

  try {
    await GoogleSignin.hasPlayServices();
    const resultado: any = await GoogleSignin.signIn();
    // Versões diferentes da lib retornam formatos diferentes
    // ({ idToken } direto, ou { data: { idToken } }).
    return resultado?.data?.idToken ?? resultado?.idToken ?? null;
  } catch {
    return null;
  }
}
