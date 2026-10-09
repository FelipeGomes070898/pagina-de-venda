import React from 'react';
import { Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';
import { urlMapaEstatico } from '@/services/mapsService';

interface LocalTrabalho {
  id: string;
  lat: number;
  lng: number;
  endereco: string | null;
  criado_em: string;
}

function abrirNoGoogleMaps(ponto: LocalTrabalho) {
  const query = encodeURIComponent(ponto.endereco || `${ponto.lat},${ponto.lng}`);
  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
}

export function MapaTrabalhos({ pontos }: { pontos: LocalTrabalho[] }) {
  if (pontos.length === 0) {
    return (
      <View style={styles.vazioBox}>
        <Text style={styles.vazioTexto}>
          Assim que você concluir um serviço com endereço registrado, ele aparece aqui.
        </Text>
      </View>
    );
  }

  const urlMapa = urlMapaEstatico(pontos.map((p) => ({ lat: p.lat, lng: p.lng })));

  return (
    <View>
      {urlMapa ? (
        <Image source={{ uri: urlMapa }} style={styles.mapa} resizeMode="cover" />
      ) : (
        <View style={styles.vazioBox}>
          <Text style={styles.vazioTexto}>Mapa indisponível no momento.</Text>
        </View>
      )}
      <View style={styles.lista}>
        {pontos.map((ponto) => (
          <TouchableOpacity key={ponto.id} style={styles.item} onPress={() => abrirNoGoogleMaps(ponto)}>
            <Text style={styles.itemTexto} numberOfLines={1}>
              {ponto.endereco || 'Serviço concluído'}
            </Text>
            <Text style={styles.itemSeta}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapa: { width: '100%', height: 180, borderRadius: radius.md, marginBottom: spacing.sm },
  vazioBox: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 130,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.bg3,
    paddingHorizontal: spacing.lg,
  },
  vazioTexto: { color: colors.muted, fontSize: 12.5, textAlign: 'center', lineHeight: 18 },
  lista: { gap: 6 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg3,
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  itemTexto: { color: colors.textForte, fontSize: 12.5, flex: 1, marginRight: 6 },
  itemSeta: { color: colors.muted, fontSize: 14 },
});
