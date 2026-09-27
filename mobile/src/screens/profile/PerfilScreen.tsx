import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '@/navigation/types';
import { colors, radius, sombra, spacing } from '@/theme/tokens';
import { useAuthStore } from '@/store/authStore';

type Props = BottomTabScreenProps<MainTabParamList, 'PerfilTab'>;

const ROTULO_TIPO: Record<string, string> = {
  cliente: 'Cliente',
  prestador: 'Prestador de serviço',
  admin: 'Administrador',
  suporte: 'Suporte',
};

export function PerfilScreen(_props: Props) {
  const usuario = useAuthStore((s) => s.usuario);
  const logout = useAuthStore((s) => s.logout);

  function aoSair() {
    Alert.alert('Sair', 'Tem certeza que deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Perfil</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>{(usuario?.nome || '?').charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.nome}>{usuario?.nome || 'Usuário'}</Text>
        <Text style={styles.tipo}>{ROTULO_TIPO[usuario?.tipo || ''] || usuario?.tipo}</Text>
      </View>

      <TouchableOpacity style={styles.opcao} onPress={aoSair}>
        <Text style={styles.opcaoTextoSair}>Sair da conta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  header: { marginBottom: spacing.lg },
  titulo: { fontSize: 22, fontWeight: '800', color: colors.textForte },
  card: {
    backgroundColor: colors.bg2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...sombra,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.laranja,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarTexto: { color: '#fff', fontWeight: '800', fontSize: 30 },
  nome: { color: colors.textForte, fontWeight: '800', fontSize: 18 },
  tipo: { color: colors.muted, fontSize: 13, marginTop: 2 },
  opcao: {
    backgroundColor: colors.bg2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.red,
    padding: spacing.md,
    alignItems: 'center',
  },
  opcaoTextoSair: { color: colors.red, fontWeight: '700', fontSize: 14 },
});
