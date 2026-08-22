import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { colors, radius, spacing } from '@/theme/tokens';
import { useCategoryStore } from '@/store/categoryStore';
import { CategoryChip } from '@/components/common/CategoryChip';
import { ProfessionalCard } from '@/components/cards/ProfessionalCard';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import {
  contatarPrestador,
  listarPedidosAbertos,
  listarPrestadores,
  Pedido,
  Prestador,
  publicarPedidoAberto,
} from '@/services/marketplaceService';
import { Coordenadas, obterLocalizacaoComPermissao } from '@/services/locationService';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

type Aba = 'prestadores' | 'pedidos';

export function HomeScreen({ navigation }: Props) {
  const categorias = useCategoryStore((s) => s.categorias);

  const [aba, setAba] = useState<Aba>('prestadores');
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null);
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [pedidosAbertos, setPedidosAbertos] = useState<Pedido[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [contatandoId, setContatandoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const [mostrarFormPedido, setMostrarFormPedido] = useState(false);
  const [descricaoPedido, setDescricaoPedido] = useState('');
  const [valorPedido, setValorPedido] = useState('');
  const [publicando, setPublicando] = useState(false);

  const [coordenadas, setCoordenadas] = useState<Coordenadas | null>(null);
  const [buscandoLocalizacao, setBuscandoLocalizacao] = useState(true);

  useEffect(() => {
    obterLocalizacaoComPermissao()
      .then(setCoordenadas)
      .finally(() => setBuscandoLocalizacao(false));
  }, []);

  async function carregar() {
    setErro(null);
    try {
      if (aba === 'prestadores') {
        const lista = await listarPrestadores({
          segmento: categoriaAtiva || undefined,
          lat: coordenadas?.lat,
          lng: coordenadas?.lng,
        });
        setPrestadores(lista);
      } else {
        const lista = await listarPedidosAbertos();
        setPedidosAbertos(lista);
      }
    } catch {
      setErro('Não foi possível carregar. Puxe para atualizar.');
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }

  useEffect(() => {
    if (buscandoLocalizacao) return;
    setCarregando(true);
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aba, categoriaAtiva, buscandoLocalizacao]);

  function aoAtualizar() {
    setAtualizando(true);
    carregar();
  }

  async function aoContatar(prestador: Prestador) {
    setContatandoId(prestador.id);
    try {
      const pedido = await contatarPrestador(prestador.id);
      navigation.navigate('Chat', { pedidoId: pedido.id, prestadorNome: prestador.nome });
    } catch {
      setErro('Não foi possível entrar em contato agora. Tente novamente.');
    } finally {
      setContatandoId(null);
    }
  }

  async function aoPublicarPedido() {
    if (!descricaoPedido.trim()) return;
    setPublicando(true);
    try {
      await publicarPedidoAberto({
        descricao: descricaoPedido.trim(),
        valorSugerido: valorPedido ? Number(valorPedido.replace(',', '.')) : undefined,
        segmento: categoriaAtiva || undefined,
      });
      setDescricaoPedido('');
      setValorPedido('');
      setMostrarFormPedido(false);
      carregar();
    } catch {
      setErro('Não foi possível publicar seu pedido. Tente novamente.');
    } finally {
      setPublicando(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Marketplace</Text>
        {aba === 'prestadores' && !buscandoLocalizacao && (
          <Text style={styles.localizacaoInfo}>
            {coordenadas
              ? '📍 Ordenado pelos prestadores mais próximos de você'
              : 'Ative a localização para ver quem está mais perto'}
          </Text>
        )}
        <View style={styles.abas}>
          <TouchableOpacity
            style={[styles.aba, aba === 'prestadores' && styles.abaAtiva]}
            onPress={() => setAba('prestadores')}
          >
            <Text style={[styles.abaTexto, aba === 'prestadores' && styles.abaTextoAtiva]}>
              Prestadores
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.aba, aba === 'pedidos' && styles.abaAtiva]}
            onPress={() => setAba('pedidos')}
          >
            <Text style={[styles.abaTexto, aba === 'pedidos' && styles.abaTextoAtiva]}>
              Preciso de um serviço
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
        <CategoryChip
          label="Todas"
          ativo={categoriaAtiva === null}
          onPress={() => setCategoriaAtiva(null)}
        />
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
        <ActivityIndicator color={colors.roxo} style={{ marginTop: spacing.xl }} />
      ) : aba === 'prestadores' ? (
        <FlatList
          data={prestadores}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          refreshControl={<RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} />}
          renderItem={({ item }) => (
            <ProfessionalCard
              prestador={item}
              onContatar={() => aoContatar(item)}
              onAbrirPerfil={() =>
                navigation.navigate('ProProfile', { prestadorId: item.id, prestadorNome: item.nome })
              }
              contatando={contatandoId === item.id}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.vazio}>Nenhum prestador encontrado nessa categoria ainda.</Text>
          }
        />
      ) : (
        <FlatList
          data={pedidosAbertos}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          refreshControl={<RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} />}
          ListHeaderComponent={
            <View style={styles.publicarWrapper}>
              {!mostrarFormPedido ? (
                <PrimaryButton
                  label="Publicar o que eu preciso"
                  onPress={() => setMostrarFormPedido(true)}
                  variant="outline"
                />
              ) : (
                <View>
                  <TextInput
                    style={styles.input}
                    placeholder="Descreva o serviço que você precisa"
                    placeholderTextColor={colors.muted}
                    value={descricaoPedido}
                    onChangeText={setDescricaoPedido}
                    multiline
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Valor que você quer oferecer (opcional)"
                    placeholderTextColor={colors.muted}
                    value={valorPedido}
                    onChangeText={setValorPedido}
                    keyboardType="decimal-pad"
                  />
                  <PrimaryButton
                    label="Publicar"
                    onPress={aoPublicarPedido}
                    loading={publicando}
                  />
                </View>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.pedidoCard}>
              <Text style={styles.pedidoDescricao}>{item.descricao}</Text>
              {item.valor != null && (
                <Text style={styles.pedidoValor}>R$ {Number(item.valor).toFixed(2)}</Text>
              )}
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.vazio}>Nenhum pedido em aberto no momento.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  titulo: { fontSize: 22, fontWeight: '800', color: colors.textForte, marginBottom: spacing.xs },
  localizacaoInfo: { fontSize: 12, color: colors.muted, marginBottom: spacing.md },
  abas: { flexDirection: 'row', backgroundColor: colors.bg2, borderRadius: radius.md, padding: 4 },
  aba: { flex: 1, paddingVertical: 10, borderRadius: radius.sm, alignItems: 'center' },
  abaAtiva: { backgroundColor: colors.roxo },
  abaTexto: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  abaTextoAtiva: { color: colors.textForte },
  categoriasScroll: { marginTop: spacing.md, maxHeight: 44 },
  categoriasConteudo: { paddingHorizontal: spacing.lg },
  erro: { color: colors.red, fontSize: 13, paddingHorizontal: spacing.lg, marginTop: spacing.sm },
  lista: { padding: spacing.lg },
  vazio: { color: colors.muted, textAlign: 'center', marginTop: spacing.xl, fontSize: 13 },
  publicarWrapper: { marginBottom: spacing.md },
  input: {
    height: 48,
    backgroundColor: colors.bg2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    color: colors.textForte,
    marginBottom: spacing.sm,
  },
  pedidoCard: {
    backgroundColor: colors.bg2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  pedidoDescricao: { color: colors.text, fontSize: 14 },
  pedidoValor: { color: colors.green, fontWeight: '700', marginTop: 4 },
});
