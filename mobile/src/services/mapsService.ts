// Usa a Places API (Autocomplete + Details) via REST puro — sem SDK
// nativo, então funciona sem depender de projeto android/ios gerado.
// Sem GOOGLE_MAPS_API_KEY configurada, as funções abaixo retornam vazio
// e o campo de endereço vira um texto livre (sem sugestões nem lat/lng).
const API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';
const BASE_URL = 'https://maps.googleapis.com/maps/api/place';

export interface SugestaoEndereco {
  placeId: string;
  descricao: string;
}

export interface EnderecoDetalhado {
  enderecoCompleto: string;
  cidade: string | null;
  estado: string | null;
  lat: number;
  lng: number;
}

export function mapsDisponivel(): boolean {
  return !!API_KEY;
}

export async function buscarSugestoesEndereco(query: string): Promise<SugestaoEndereco[]> {
  if (!mapsDisponivel() || query.trim().length < 3) return [];

  try {
    const url = `${BASE_URL}/autocomplete/json?input=${encodeURIComponent(
      query,
    )}&components=country:br&language=pt-BR&key=${API_KEY}`;
    const resposta = await fetch(url);
    const dados = await resposta.json();
    if (dados.status !== 'OK') return [];
    return dados.predictions.map((p: any) => ({ placeId: p.place_id, descricao: p.description }));
  } catch {
    return [];
  }
}

export async function buscarDetalhesLugar(placeId: string): Promise<EnderecoDetalhado | null> {
  if (!mapsDisponivel()) return null;

  try {
    const url = `${BASE_URL}/details/json?place_id=${placeId}&fields=formatted_address,address_component,geometry&language=pt-BR&key=${API_KEY}`;
    const resposta = await fetch(url);
    const dados = await resposta.json();
    if (dados.status !== 'OK') return null;

    const componentes = dados.result.address_components as any[];
    const cidade =
      componentes.find((c) => c.types.includes('administrative_area_level_2'))?.long_name ||
      componentes.find((c) => c.types.includes('locality'))?.long_name ||
      null;
    const estado =
      componentes.find((c) => c.types.includes('administrative_area_level_1'))?.short_name || null;

    return {
      enderecoCompleto: dados.result.formatted_address,
      cidade,
      estado,
      lat: dados.result.geometry.location.lat,
      lng: dados.result.geometry.location.lng,
    };
  } catch {
    return null;
  }
}
