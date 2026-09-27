import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import { MainTabParamList, RootStackParamList } from '@/navigation/types';
import { colors, radius, spacing } from '@/theme/tokens';
import { useCategoryStore } from '@/store/categoryStore';
import { CategoryChip } from '@/components/common/CategoryChip';
import { ProfessionalCard } from '@/components/cards/ProfessionalCard';
import { contatarPrestador, listarPrestadores, Prestador } from '@/services/marketplaceService';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'BuscaTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function BuscaScreen({ navigation }: Props) {
  const categorias = useCategoryStore((s) => s.categorias);

  const [texto, setTexto] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null);
  const [resultados, setResultados] = useState<Prestador[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [jaBuscou, setJaBuscou] = useState(false);
  const [contatandoId, setContatandoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const termo = texto.trim();
    if (!termo && !categoriaAtiva) {
      setResultados([]);
      setJaBuscou(false);
      return;
    }

    const temporizador = setTimeout(async () => {
      setBuscando(true);
      setErro(null);
      try {
        const lista = await listarPrestadores({
          busca: termo || undefined,
          segmento: categoriaAtiva || undefined,
        });
        setResultados(lista);
      } catch {
        setErro('Não foi possível buscar agora. Tente novamente.');
      } finally {
        setBuscando(false);
        setJaBuscou(true);
      }
    }, 400);

    return () => clearTimeout(temporizador);
  }, [texto, categoriaAtiva]);

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Buscar</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: eletricista, diarista, João..."
          placeholderTextColor={colors.muted}
          value={texto}
          onChangeText={setTexto}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriasScroll}
        contentContainerStyle={styles.categoriasConteudo}
      >
        {categorias.map((cat) => (
          <CategoryChip
            key={cat.id}
            label={cat.nome}
            icone={cat.icone}
            ativo={categoriaAtiva === cat.nome}
            onPress={() => setCategoriaAtiva(categoriaAtiva === cat.nome ? null : cat.nome)}
          />
        ))}
      </ScrollView>

      {erro && <Text style={styles.erro}>{erro}</Text>}

      {buscando ? (
        <ActivityIndicator color={colors.laranja} style={{ marginTop: spacing.xl }} />
      ) : !jaBuscou ? (
        <Text style={styles.dica}>Digite um nome, serviço ou escolha uma categoria acima.</Text>
      ) : (
        <FlatList
          data={resultados}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
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
            <Text style={styles.vazio}>Nenhum resultado para essa busca.</Text>
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
  input: {
    height: 48,
    backgroundColor: colors.bg2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    color: colors.textForte,
    fontSize: 14,
  },
  categoriasScroll: { marginTop: spacing.md, maxHeight: 44 },
  categoriasConteudo: { paddingHorizontal: spacing.lg },
  erro: { color: colors.red, fontSize: 13, paddingHorizontal: spacing.lg, marginTop: spacing.sm },
  dica: { color: colors.muted, textAlign: 'center', marginTop: spacing.xl, fontSize: 13, paddingHorizontal: spacing.xl },
  lista: { padding: spacing.lg },
  vazio: { color: colors.muted, textAlign: 'center', marginTop: spacing.xl, fontSize: 13 },
});
