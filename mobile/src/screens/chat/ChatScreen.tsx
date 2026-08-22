import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

// Etapa atual: só confirma que o pedido foi criado e abre espaço para a
// conversa. Próxima etapa: mensagens em tempo real, proposta de valor,
// aceite e liberação do endereço.
export function ChatScreen({ route }: Props) {
  const { prestadorNome } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Conversa com {prestadorNome}</Text>
      <Text style={styles.texto}>
        Seu pedido foi enviado. Em breve o prestador responde por aqui — combine o valor, e
        quando fecharem, você poderá enviar o endereço para o serviço.
      </Text>
      <Text style={styles.emBreve}>Chat completo: próxima etapa de construção do app.</Text>
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
  titulo: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textForte,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  texto: { fontSize: 14, color: colors.text, textAlign: 'center', marginBottom: spacing.lg },
  emBreve: { fontSize: 12, color: colors.muted, textAlign: 'center' },
});
