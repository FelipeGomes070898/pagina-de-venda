// No navegador não existe manifesto/permissão nativa pra configurar — o
// próprio navegador mostra o prompt de "permitir localização" na hora
// que getCurrentPosition é chamado. Bem mais simples que no app mobile.
export function obterLocalizacaoAtual() {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (posicao) => resolve({ lat: posicao.coords.latitude, lng: posicao.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  });
}
