import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { MainTabParamList, RootStackParamList } from '@/navigation/types';
import { colors, radius, sombra, spacing } from '@/theme/tokens';
import { useCategoryStore } from '@/store/categoryStore';
import { CategoryChip } from '@/components/common/CategoryChip';
import { ProfessionalCard } from '@/components/cards/ProfessionalCard';
import {
  Pedido,
  Prestador,
  listarPedidosAbertos,
  listarPrestadores,
  responderPedidoAberto,
} from '@/services/marketplaceService';
import { meuPerfil, MeuPerfil } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'MarketplaceTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

const ROTULO_STATUS: Record<string, { texto: string; cor: string }> = {
  ativo: { texto: 'Conta ativa', cor: colors.green },
  inadimplente: { texto: 'Pagamento pendente', cor: colors.laranja },
  bloqueado: { texto: 'Conta bloqueada', cor: colors.red },
};

// Home do prestador: diferente da do cliente (que navega o marketplace de
// prestadores) — aqui o que importa é ver o próprio desempenho e os
// pedidos em aberto que ele pode responder. Antes disso não existia,
// então o prestador via a mesma tela do cliente (inclusive a si mesmo na
// lista, com um botão "Contato" sem sentido pra ele mesmo).
export function PrestadorHomeScreen({ navigation }: Props) {
  const cidadeUsuario = useAuthStore((s) => s.usuario?.cidade);
  const categorias = useCategoryStore((s) => s.categorias);

  const [perfil, setPerfil] = useState<MeuPerfil | null>(null);
  const [aba, setAba] = useState<'pedidos' | 'prestadores'>('pedidos');
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [outrosPrestadores, setOutrosPrestadores] = useState<Prestador[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [respondendoId, setRespondendoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    setErro(null);
    try {
      if (aba === 'pedidos') {
        const [listaPedidos] = await Promise.all([
          listarPedidosAbertos({ cidade: cidadeUsuario || undefined, segmento: categoriaAtiva || undefined }),
          meuPerfil().then(setPerfil),
        ]);
        setPedidos(listaPedidos);
      } else {
        const [listaPrestadores] = await Promise.all([
          listarPrestadores({ cidade: cidadeUsuario || undefined, segmento: categoriaAtiva || undefined }),
          meuPerfil().then(setPerfil),
        ]);
        setOutrosPrestadores(listaPrestadores);
      }
    } catch {
      setErro('Não foi possível carregar. Puxe para atualizar.');
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }

  // useFocusEffect cobre tanto o carregamento inicial quanto a troca de
  // categoria/cidade/aba (mesmas deps de um useEffect normal) e também
  // recarrega toda vez que a aba ganha foco de novo — o status/avaliação
  // pode ter mudado (ex.: voltando de um pedido concluído).
  useFocusEffect(
    useCallback(() => {
      setCarregando(true);
      carregar();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [aba, categoriaAtiva, cidadeUsuario]),
  );

  function aoAtualizar() {
    setAtualizando(true);
    carregar();
  }

  async function aoResponder(pedido: Pedido) {
    setRespondendoId(pedido.id);
    setErro(null);
    try {
      await responderPedidoAberto(pedido.id);
      navigation.navigate('Chat', { pedidoId: pedido.id, prestadorNome: '' });
    } catch {
      setErro('Esse pedido já não está mais disponível — outro prestador deve ter respondido primeiro.');
      setPedidos((atual) => atual.filter((p) => p.id !== pedido.id));
    } finally {
      setRespondendoId(null);
    }
  }

  const status = perfil?.status ? ROTULO_STATUS[perfil.status] : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Olá, {perfil?.nome?.split(' ')[0] || ''}</Text>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValor}>⭐ {Number(perfil?.avaliacao ?? 5).toFixed(1)}</Text>
            <Text style={styles.statLabel}>{perfil?.total_avaliacoes ?? 0} avaliações</Text>
          </View>
          <View style={styles.statDivisor} />
          <View style={styles.statItem}>
            <Text style={styles.statValor}>{perfil?.total_servicos ?? 0}</Text>
            <Text style={styles.statLabel}>serviços feitos</Text>
          </View>
        </View>

        {status && (
          <View style={[styles.statusChip, { borderColor: status.cor }]}>
            <View style={[styles.statusBolinha, { backgroundColor: status.cor }]} />
            <Text style={[styles.statusTexto, { color: status.cor }]}>{status.texto}</Text>
          </View>
        )}

        <View style={styles.abas}>
          <TouchableOpacity
            style={[styles.aba, aba === 'pedidos' && styles.abaAtiva]}
            onPress={() => setAba('pedidos')}
          >
            <Text style={[styles.abaTexto, aba === 'pedidos' && styles.abaTextoAtivo]}>
              Pedidos em aberto
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.aba, aba === 'prestadores' && styles.abaAtiva]}
            onPress={() => setAba('prestadores')}
          >
            <Text style={[styles.abaTexto, aba === 'prestadores' && styles.abaTextoAtivo]}>
              Outros prestadores
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriasScroll}
        contentContainerStyle={styles.categoriasConteudo}
      >
        <CategoryChip label="Todas" ativo={categoriaAtiva === null} onPress={() => setCategoriaAtiva(null)} />
        {categorias.map((cat) => (
          <CategoryChip
            key={cat.id}
            label={cat.nome}
            icone={cat.icone}
            ativo={categoriaAtiva === cat.nome}
            onPress={() => setCategoriaAtiva(cat.nome)}
          />
        ))}
      </ScrollView>

      {erro && <Text style={styles.erro}>{erro}</Text>}

      {carregando ? (
        <ActivityIndicator color={colors.laranja} style={{ marginTop: spacing.xl }} />
      ) : aba === 'pedidos' ? (
        <FlatList
          data={pedidos}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          refreshControl={<RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} />}
          renderItem={({ item }) => (
            <View style={styles.pedidoCard}>
              <Text style={styles.pedidoDescricao}>{item.descricao}</Text>
              <View style={styles.pedidoRodape}>
                {item.valor != null ? (
                  <Text style={styles.pedidoValor}>R$ {Number(item.valor).toFixed(2)}</Text>
                ) : (
                  <Text style={styles.pedidoSemValor}>Sem valor sugerido</Text>
                )}
                <TouchableOpacity
                  style={styles.botaoResponder}
                  onPress={() => aoResponder(item)}
                  disabled={respondendoId === item.id}
                >
                  <Text style={styles.botaoResponderTexto}>
                    {respondendoId === item.id ? 'Respondendo...' : 'Responder'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.vazio}>Nenhum pedido em aberto na sua cidade ainda.</Text>
          }
        />
      ) : (
        <FlatList
          data={outrosPrestadores}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          refreshControl={<RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} />}
          renderItem={({ item }) => (
            <ProfessionalCard
              prestador={item}
              onAbrirPerfil={() => navigation.navigate('ProProfile', { prestadorId: item.id, prestadorNome: item.nome })}
              ocultarContato
            />
          )}
          ListEmptyComponent={
            <Text style={styles.vazio}>Nenhum outro prestador na sua cidade ainda.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  titulo: { fontSize: 22, fontWeight: '800', color: colors.textForte, marginBottom: spacing.md },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.bg2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...sombra,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDivisor: { width: 1, backgroundColor: colors.border },
  statValor: { fontSize: 20, fontWeight: '800', color: colors.textForte },
  statLabel: { fontSize: 12, color: colors.muted, marginTop: 2 },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: spacing.sm,
    gap: 6,
  },
  statusBolinha: { width: 8, height: 8, borderRadius: 4 },
  statusTexto: { fontSize: 12, fontWeight: '700' },
  subtitulo: { fontSize: 15, fontWeight: '700', color: colors.textForte, marginTop: spacing.lg },
  abas: {
    flexDirection: 'row',
    backgroundColor: colors.bg2,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
    marginTop: spacing.lg,
  },
  aba: { flex: 1, paddingVertical: 10, borderRadius: radius.sm, alignItems: 'center' },
  abaAtiva: { backgroundColor: colors.laranja },
  abaTexto: { color: colors.muted, fontWeight: '600', fontSize: 13 },
  abaTextoAtivo: { color: '#fff' },
  categoriasScroll: { marginTop: spacing.sm, maxHeight: 44 },
  categoriasConteudo: { paddingHorizontal: spacing.lg },
  erro: { color: colors.red, fontSize: 13, paddingHorizontal: spacing.lg, marginTop: spacing.sm },
  lista: { padding: spacing.lg },
  vazio: { color: colors.muted, textAlign: 'center', marginTop: spacing.xl, fontSize: 13 },
  pedidoCard: {
    backgroundColor: colors.bg2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  pedidoDescricao: { color: colors.text, fontSize: 14 },
  pedidoRodape: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  pedidoValor: { color: colors.green, fontWeight: '700' },
  pedidoSemValor: { color: colors.muted, fontSize: 12, fontStyle: 'italic' },
  botaoResponder: {
    backgroundColor: colors.laranja,
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  botaoResponderTexto: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
