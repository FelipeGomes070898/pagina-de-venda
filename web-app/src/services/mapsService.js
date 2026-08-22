let scriptPromise = null;

// Carrega a Google Maps JavaScript API (biblioteca Places) uma única
// vez. Sem VITE_GOOGLE_MAPS_API_KEY configurada, resolve `false` e o
// campo de endereço vira um input de texto comum (sem autocomplete) —
// não quebra o cadastro.
export function carregarGoogleMaps() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return Promise.resolve(false);
  if (window.google?.maps?.places) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=pt-BR&region=BR`;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
  return scriptPromise;
}

function extrairComponente(place, tipo) {
  return place.address_components?.find((c) => c.types.includes(tipo))?.long_name || null;
}

export function extrairEnderecoDoPlace(place) {
  if (!place?.geometry) return null;
  return {
    enderecoCompleto: place.formatted_address,
    cidade: extrairComponente(place, 'administrative_area_level_2') || extrairComponente(place, 'locality'),
    estado: place.address_components?.find((c) => c.types.includes('administrative_area_level_1'))?.short_name || null,
    lat: place.geometry.location.lat(),
    lng: place.geometry.location.lng(),
  };
}
