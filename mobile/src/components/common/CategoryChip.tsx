import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';

interface Props {
  label: string;
  icone?: string;
  ativo?: boolean;
  onPress: () => void;
}

export function CategoryChip({ label, icone, ativo, onPress }: Props) {
  return (
    <TouchableOpacity style={[styles.chip, ativo && styles.chipAtivo]} onPress={onPress}>
      <Text style={[styles.texto, ativo && styles.textoAtivo]}>
        {icone ? `${icone} ` : ''}
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  chipAtivo: { backgroundColor: colors.laranja, borderColor: colors.laranja },
  texto: { color: colors.text, fontSize: 12, fontWeight: '600' },
  textoAtivo: { color: '#fff' },
});
