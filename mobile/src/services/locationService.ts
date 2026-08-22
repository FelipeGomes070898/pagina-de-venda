import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export interface Coordenadas {
  lat: number;
  lng: number;
}

async function solicitarPermissaoAndroid(): Promise<boolean> {
  try {
    const resultado = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Permitir localização',
        message:
          'O Vexo usa sua localização para mostrar os prestadores mais próximos de você.',
        buttonPositive: 'Permitir',
        buttonNegative: 'Agora não',
      },
    );
    return resultado === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

// No Android pede a permissão explicitamente; no iOS a própria lib
// dispara o prompt do sistema na primeira chamada de getCurrentPosition.
export async function solicitarPermissaoLocalizacao(): Promise<boolean> {
  if (Platform.OS === 'android') {
    return solicitarPermissaoAndroid();
  }
  return true;
}

// Retorna null quando o usuário nega a permissão ou o GPS falha — o
// marketplace cai de volta para a ordenação por data (sem distância).
export function obterLocalizacaoAtual(): Promise<Coordenadas | null> {
  return new Promise((resolve) => {
    Geolocation.getCurrentPosition(
      (posicao) => {
        resolve({ lat: posicao.coords.latitude, lng: posicao.coords.longitude });
      },
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  });
}

export async function obterLocalizacaoComPermissao(): Promise<Coordenadas | null> {
  const permitido = await solicitarPermissaoLocalizacao();
  if (!permitido) return null;
  return obterLocalizacaoAtual();
}
