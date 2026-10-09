import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, sombra, spacing } from '@/theme/tokens';

interface Props {
  titulo: string;
}

// Cabeçalho simples de "voltar + título", usado pelas sub-páginas do
// perfil (Dados pessoais, Área de serviço, etc.) — mesmo padrão do
// web-app/src/components/SubPaginaHeader.jsx. Sempre volta pra tela
// anterior na pilha (o hub do Perfil), por isso só usa goBack().
export function SubPaginaHeader({ titulo }: Props) {
  const navigation = useNavigation();
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.voltar} onPress={() => navigation.goBack()} hitSlop={8}>
        <Text style={styles.voltarSeta}>‹</Text>
      </TouchableOpacity>
      <Text style={styles.titulo}>{titulo}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  voltar: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg2,
    alignItems: 'center',
    justifyContent: 'center',
    ...sombra,
  },
  voltarSeta: { color: colors.textForte, fontSize: 20, fontWeight: '700', marginTop: -2 },
  titulo: { color: colors.textForte, fontSize: 17, fontWeight: '800' },
});
