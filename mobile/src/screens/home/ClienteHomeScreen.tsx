import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import { MainTabParamList, RootStackParamList } from '@/navigation/types';
import { colors, radius, spacing } from '@/theme/tokens';
import { useCategoryStore } from '@/store/categoryStore';
import { CategoryChip } from '@/components/common/CategoryChip';
import { ProfessionalCard } from '@/components/cards/ProfessionalCard';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import {
  Banner,
  contatarPrestador,
  CupomValidado,
  listarBannersAtivos,
  listarPedidosAbertos,
  listarPrestadores,
  Pedido,
  Prestador,
  publicarPedidoAberto,
  validarCupom,
} from '@/services/marketplaceService';
import { Coordenadas, obterLocalizacaoComPermissao } from '@/services/locationService';
import { useAuthStore } from '@/store/authStore';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'MarketplaceTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

type Aba = 'prestadores' | 'pedidos';

export function ClienteHomeScreen({ navigation }: Props) {
  const categorias = useCategoryStore((s) => s.categorias);
  const cidadeUsuario = useAuthStore((s) => s.usuario?.cidade);

  const [aba, setAba] = useState<Aba>('prestadores');
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null);
  const [buscaTexto, setBuscaTexto] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [pedidosAbertos, setPedidosAbertos] = useState<Pedido[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [contatandoId, setContatandoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const [mostrarFormPedido, setMostrarFormPedido] = useState(false);
  const [descricaoPedido, setDescricaoPedido] = useState('');
  const [valorPedido, setValorPedido] = useState('');
  const [urgente, setUrgente] = useState(false);
  const [cupomTexto, setCupomTexto] = useState('');
  const [cupomAplicado, setCupomAplicado] = useState<CupomValidado | null>(null);
  const [cupomErro, setCupomErro] = useState<string | null>(null);
  const [validandoCupom, setValidandoCupom] = useState(false);
  const [publicando, setPublicando] = useState(false);

  const [banners, setBanners] = useState<Banner[]>([]);

  const [coordenadas, setCoordenadas] = useState<Coordenadas | null>(null);
  const [buscandoLocalizacao, setBuscandoLocalizacao] = useState(true);

  useEffect(() => {
    obterLocalizacaoComPermissao()
      .then(setCoordenadas)
      .finally(() => setBuscandoLocalizacao(false));
    listarBannersAtivos()
      .then(setBanners)
      .catch(() => {});
  }, []);

  async function aoAplicarCupom() {
    if (!cupomTexto.trim()) return;
    setCupomErro(null);
    setValidandoCupom(true);
    try {
      const resultado = await validarCupom(
        cupomTexto.trim(),
        Number(valorPedido.replace(',', '.')) || 0,
      );
      setCupomAplicado(resultado);
    } catch {
      setCupomAplicado(null);
      setCupomErro('Cupom inválido ou expirado');
    } finally {
      setValidandoCupom(false);
    }
  }

  async function carregar() {
    setErro(null);
    try {
      if (aba === 'prestadores') {
        const lista = await listarPrestadores({
          segmento: categoriaAtiva || undefined,
          busca: buscaAplicada || undefined,
          cidade: cidadeUsuario || undefined,
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
  }, [aba, categoriaAtiva, buscaAplicada, buscandoLocalizacao, cidadeUsuario]);

  useEffect(() => {
    const temporizador = setTimeout(() => setBuscaAplicada(buscaTexto.trim()), 400);
    return () => clearTimeout(temporizador);
  }, [buscaTexto]);

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
        urgente,
        cupomCodigo: cupomAplicado?.codigo,
      });
      setDescricaoPedido('');
      setValorPedido('');
      setUrgente(false);
      setCupomTexto('');
      setCupomAplicado(null);
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
        {banners.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.bannersScroll}
            contentContainerStyle={styles.bannersConteudo}
          >
            {banners.map((b) => (
              <Image key={b.id} source={{ uri: b.imagem_url }} style={styles.bannerImg} />
            ))}
          </ScrollView>
        )}
        <Text style={styles.titulo}>Marketplace</Text>
        {aba === 'prestadores' && (
          <TextInput
            style={styles.buscaInput}
            placeholder="Buscar por nome ou serviço"
            placeholderTextColor={colors.muted}
            value={buscaTexto}
            onChangeText={setBuscaTexto}
            autoCapitalize="none"
            autoCorrect={false}
          />
        )}
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
        <ActivityIndicator color={colors.laranja} style={{ marginTop: spacing.xl }} />
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

                  <View style={styles.urgenteLinha}>
                    <Text style={styles.urgenteTexto}>
                      Marcar como urgente (prioridade na lista, taxa adicional)
                    </Text>
                    <Switch
                      value={urgente}
                      onValueChange={setUrgente}
                      trackColor={{ true: colors.laranja }}
                    />
                  </View>

                  <View style={styles.cupomLinha}>
                    <TextInput
                      style={[styles.input, styles.cupomInput]}
                      placeholder="Cupom de desconto (opcional)"
                      placeholderTextColor={colors.muted}
                      value={cupomTexto}
                      onChangeText={(t) => setCupomTexto(t.toUpperCase())}
                      autoCapitalize="characters"
                      editable={!cupomAplicado}
                    />
                    {!cupomAplicado ? (
                      <TouchableOpacity
                        style={styles.cupomBotao}
                        onPress={aoAplicarCupom}
                        disabled={validandoCupom || !cupomTexto.trim()}
                      >
                        <Text style={styles.cupomBotaoTexto}>
                          {validandoCupom ? 'Validando...' : 'Aplicar'}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.cupomBotao}
                        onPress={() => {
                          setCupomAplicado(null);
                          setCupomTexto('');
                        }}
                      >
                        <Text style={styles.cupomBotaoTexto}>Remover</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {cupomErro && <Text style={styles.erro}>{cupomErro}</Text>}
                  {cupomAplicado && (
                    <Text style={styles.cupomSucesso}>
                      Cupom {cupomAplicado.codigo} aplicado — desconto de R${' '}
                      {cupomAplicado.desconto.toFixed(2)}
                    </Text>
                  )}

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
              {item.urgente && (
                <Text style={styles.badgeUrgente}>URGENTE</Text>
              )}
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
  titulo: { fontSize: 22, fontWeight: '800', color: colors.textForte, marginBottom: spacing.sm },
  buscaInput: {
    height: 44,
    backgroundColor: colors.bg2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    color: colors.textForte,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  localizacaoInfo: { fontSize: 12, color: colors.muted, marginBottom: spacing.md },
  abas: { flexDirection: 'row', backgroundColor: colors.bg2, borderRadius: radius.md, padding: 4 },
  aba: { flex: 1, paddingVertical: 10, borderRadius: radius.sm, alignItems: 'center' },
  abaAtiva: { backgroundColor: colors.laranja },
  abaTexto: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  abaTextoAtiva: { color: '#fff' },
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
  bannersScroll: { marginBottom: spacing.md },
  bannersConteudo: { gap: 10 },
  bannerImg: { width: 260, height: 100, borderRadius: radius.md, marginRight: 10 },
  urgenteLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  urgenteTexto: { color: colors.text, fontSize: 12.5, flex: 1, marginRight: spacing.sm },
  cupomLinha: { flexDirection: 'row', gap: 8, marginBottom: spacing.sm },
  cupomInput: { flex: 1, marginBottom: 0 },
  cupomBotao: {
    height: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  cupomBotaoTexto: { color: colors.text, fontSize: 12.5, fontWeight: '700' },
  cupomSucesso: { color: colors.green, fontSize: 12, marginBottom: spacing.sm },
  badgeUrgente: {
    alignSelf: 'flex-start',
    backgroundColor: colors.red,
    color: '#fff',
    fontSize: 10.5,
    fontWeight: '800',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 6,
    overflow: 'hidden',
  },
});
