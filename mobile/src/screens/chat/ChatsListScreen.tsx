import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import { MainTabParamList, RootStackParamList } from '@/navigation/types';
import { colors, radius, spacing } from '@/theme/tokens';
import { Conversa, listarMinhasConversas } from '@/services/marketplaceService';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'ChatsTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

const ROTULO_STATUS: Record<string, string> = {
  pendente: 'Aguardando resposta',
  andamento: 'Em andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
  agendado: 'Agendado',
};

export function ChatsListScreen({ navigation }: Props) {
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    setErro(null);
    try {
      const lista = await listarMinhasConversas();
      setConversas(lista);
    } catch {
      setErro('Não foi possível carregar suas conversas.');
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      carregar();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  function aoAtualizar() {
    setAtualizando(true);
    carregar();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Chats</Text>
      </View>

      {erro && <Text style={styles.erro}>{erro}</Text>}

      {carregando ? (
        <ActivityIndicator color={colors.laranja} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={conversas}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          refreshControl={<RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                navigation.navigate('Chat', {
                  pedidoId: item.id,
                  prestadorNome: item.contraparte_nome || 'Conversa',
                })
              }
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarTexto}>
                  {(item.contraparte_nome || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.nome}>{item.contraparte_nome || 'Aguardando prestador'}</Text>
                <Text style={styles.descricao} numberOfLines={1}>
                  {item.descricao || 'Sem descrição'}
                </Text>
              </View>
              <View style={styles.direita}>
                {item.valor != null && (
                  <Text style={styles.valor}>R$ {Number(item.valor).toFixed(2)}</Text>
                )}
                <Text style={styles.status}>{ROTULO_STATUS[item.status] || item.status}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.vazio}>
              Você ainda não tem conversas. Entre em contato com um prestador no Marketplace.
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  titulo: { fontSize: 22, fontWeight: '800', color: colors.textForte },
  erro: { color: colors.red, fontSize: 13, paddingHorizontal: spacing.lg, marginTop: spacing.sm },
  lista: { padding: spacing.lg },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.laranja,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: { color: '#fff', fontWeight: '800', fontSize: 16 },
  info: { flex: 1, minWidth: 0 },
  nome: { color: colors.textForte, fontWeight: '700', fontSize: 14 },
  descricao: { color: colors.muted, fontSize: 12, marginTop: 2 },
  direita: { alignItems: 'flex-end' },
  valor: { color: colors.laranja, fontWeight: '800', fontSize: 14 },
  status: { color: colors.muted, fontSize: 11, marginTop: 2 },
  vazio: { color: colors.muted, textAlign: 'center', marginTop: spacing.xl, fontSize: 13, paddingHorizontal: spacing.lg },
});
