import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';
import { disponivel, obterIdTokenGoogle } from '@/services/googleAuthService';

interface Props {
  onIdToken: (idToken: string) => void | Promise<void>;
}

// Some da tela se a lib do Google Sign-In não estiver instalada/
// configurada nativamente — não quebra o login normal.
export function GoogleLoginButton({ onIdToken }: Props) {
  const [carregando, setCarregando] = useState(false);

  if (!disponivel()) return null;

  async function aoPressionar() {
    setCarregando(true);
    try {
      const idToken = await obterIdTokenGoogle();
      if (idToken) await onIdToken(idToken);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.separador}>
        <View style={styles.linha} />
        <Text style={styles.ou}>ou</Text>
        <View style={styles.linha} />
      </View>
      <TouchableOpacity style={styles.botao} onPress={aoPressionar} disabled={carregando}>
        <Text style={styles.texto}>{carregando ? 'Conectando...' : 'Continuar com Google'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%', marginTop: spacing.sm },
  separador: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  linha: { flex: 1, height: 1, backgroundColor: colors.border },
  ou: { color: colors.muted, fontSize: 12, marginHorizontal: spacing.sm },
  botao: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg2,
  },
  texto: { color: colors.textForte, fontWeight: '700', fontSize: 14 },
});
