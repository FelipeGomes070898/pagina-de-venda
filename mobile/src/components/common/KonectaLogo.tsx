import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/tokens';

interface Props {
  size?: 'sm' | 'lg';
}

export function KonectaLogo({ size = 'lg' }: Props) {
  const grande = size === 'lg';
  return (
    <View style={styles.wrapper}>
      <Text style={[styles.marca, grande ? styles.grande : styles.pequeno]}>KONECTA JÁ</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  marca: { fontWeight: '900', color: colors.laranja, letterSpacing: 1 },
  grande: { fontSize: 32 },
  pequeno: { fontSize: 18 },
});
