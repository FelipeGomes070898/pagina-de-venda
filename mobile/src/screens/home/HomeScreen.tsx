import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/theme/tokens';

export function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Marketplace</Text>
      <Text style={styles.texto}>
        Próxima etapa: lista de prestadores por proximidade, categorias e busca.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  titulo: { fontSize: 22, fontWeight: '800', color: colors.textForte, marginBottom: spacing.sm },
  texto: { fontSize: 14, color: colors.muted, textAlign: 'center' },
});
