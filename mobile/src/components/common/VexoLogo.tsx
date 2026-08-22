import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/tokens';

interface Props {
  size?: 'sm' | 'lg';
}

export function VexoLogo({ size = 'lg' }: Props) {
  const grande = size === 'lg';
  return (
    <View style={styles.wrapper}>
      <Text style={[styles.marca, grande ? styles.grande : styles.pequeno]}>
        Vex<Text style={styles.destaque}>o</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  marca: { fontWeight: '900', color: colors.textForte, letterSpacing: 0.5 },
  grande: { fontSize: 48 },
  pequeno: { fontSize: 24 },
  destaque: { color: colors.laranja },
});
