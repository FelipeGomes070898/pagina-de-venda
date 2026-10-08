import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/tokens';

interface Props {
  size?: 'sm' | 'lg';
}

const TAMANHO_GRANDE = { selo: 56, peek: 5, eloW: 34, eloH: 18, spark: 10, fonte: 26 };
const TAMANHO_PEQUENO = { selo: 34, peek: 3, eloW: 21, eloH: 11, spark: 7, fonte: 15 };

// Selo com dois "elos" brancos entrelaçados (conexão cliente↔prestador)
// e um brilho no canto (o "Já" — resposta na hora). A sombra em degradê
// é simulada com duas Views sobrepostas (sem react-native-svg/
// linear-gradient — este projeto evita libs nativas novas porque o
// APK não pode ser recompilado neste ambiente). Equivalente em SVG
// real: web-app/src/components/KonectaLogo.jsx.
export function KonectaLogo({ size = 'lg' }: Props) {
  const grande = size === 'lg';
  const s = grande ? TAMANHO_GRANDE : TAMANHO_PEQUENO;

  return (
    <View style={styles.wrapper}>
      <View style={{ width: s.selo + s.peek, height: s.selo + s.peek }}>
        <View
          style={[
            styles.seloBase,
            {
              width: s.selo,
              height: s.selo,
              borderRadius: s.selo * 0.32,
              top: s.peek,
              left: s.peek,
              backgroundColor: colors.laranjaEscuro,
            },
          ]}
        />
        <View
          style={[
            styles.seloBase,
            styles.seloFrente,
            { width: s.selo, height: s.selo, borderRadius: s.selo * 0.32 },
          ]}
        >
          <View style={[styles.elo, styles.eloTras, { width: s.eloW, height: s.eloH }]} />
          <View style={[styles.elo, styles.eloFrente, { width: s.eloW, height: s.eloH }]} />
          <View
            style={[
              styles.spark,
              { width: s.spark, height: s.spark, borderRadius: s.spark / 2 },
            ]}
          />
        </View>
      </View>
      <Text style={[styles.marca, { fontSize: s.fonte }]}>
        Konecta<Text style={styles.marcaDestaque}>Já</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  seloBase: {
    position: 'absolute',
    backgroundColor: colors.laranja,
  },
  seloFrente: {
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  elo: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: 999,
  },
  eloTras: { transform: [{ rotate: '35deg' }], opacity: 0.6 },
  eloFrente: { transform: [{ rotate: '-35deg' }] },
  spark: {
    position: 'absolute',
    top: '14%',
    right: '14%',
    backgroundColor: colors.laranjaSoft,
  },
  marca: { fontWeight: '900', color: colors.azul, letterSpacing: 0.3, marginTop: 10 },
  marcaDestaque: { color: colors.laranja },
});
