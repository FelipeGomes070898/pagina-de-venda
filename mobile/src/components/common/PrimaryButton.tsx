import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { colors, radius, sombra, spacing } from '@/theme/tokens';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline';
  style?: ViewStyle;
}

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  style,
}: Props) {
  const isOutline = variant === 'outline';
  return (
    <TouchableOpacity
      style={[
        styles.base,
        isOutline ? styles.outline : styles.primary,
        (disabled || loading) && styles.desabilitado,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? colors.laranja : '#fff'} />
      ) : (
        <Text style={[styles.texto, isOutline && styles.textoOutline]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  primary: { backgroundColor: colors.laranjaEscuro, ...sombra },
  outline: {
    backgroundColor: colors.bg2,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  desabilitado: { opacity: 0.5 },
  texto: { color: '#fff', fontWeight: '700', fontSize: 16 },
  textoOutline: { color: colors.text },
});
