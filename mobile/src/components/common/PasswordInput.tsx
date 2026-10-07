import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';

interface Props extends Omit<TextInputProps, 'secureTextEntry' | 'style'> {
  containerStyle?: ViewStyle;
}

// Campo de senha com botão de mostrar/ocultar — usado em Login, Cadastro
// e Esqueci minha senha pra não duplicar o toggle em cada tela.
export function PasswordInput({ containerStyle, ...inputProps }: Props) {
  const [mostrar, setMostrar] = useState(false);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <TextInput
        style={styles.input}
        placeholderTextColor={colors.muted}
        secureTextEntry={!mostrar}
        {...inputProps}
      />
      <TouchableOpacity onPress={() => setMostrar((v) => !v)} hitSlop={8}>
        <Text style={styles.toggle}>{mostrar ? 'Ocultar' : 'Ver'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    height: 52,
    backgroundColor: colors.bg3,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  input: { flex: 1, height: '100%', color: colors.textForte },
  toggle: { fontSize: 12, fontWeight: '700', color: colors.muted, marginLeft: spacing.sm },
});
