import { api } from './api';

let scriptPromise = null;

// Carrega o script do Google Identity Services uma única vez (mesmo se
// vários componentes pedirem ao mesmo tempo).
export function carregarGoogleIdentity() {
  if (window.google?.accounts?.id) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
  return scriptPromise;
}

// Renderiza o botão oficial do Google no elemento indicado. Retorna
// false (sem lançar erro) se não houver Client ID configurado — o
// componente que chama isso decide não mostrar nada nesse caso.
export function renderizarBotaoGoogle(elementId, aoReceberCredential) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) return false;

  const elemento = document.getElementById(elementId);
  if (!elemento) return false;

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (response) => aoReceberCredential(response.credential),
  });
  window.google.accounts.id.renderButton(elemento, {
    theme: 'filled_black',
    size: 'large',
    width: 320,
    text: 'continue_with',
    locale: 'pt-BR',
  });
  return true;
}

export async function loginComGoogle(idToken) {
  const { data } = await api.post('/api/auth/google', { idToken });
  return data;
}
