import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { colors, radius, spacing } from '@/theme/tokens';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { avaliarPrestador, TAGS_AVALIACAO } from '@/services/reviewService';

type Props = NativeStackScreenProps<RootStackParamList, 'Review'>;

const ESTRELAS = [1, 2, 3, 4, 5];

export function ReviewScreen({ route, navigation }: Props) {
  const { pedidoId, prestadorNome } = route.params;

  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState('');
  const [tagsSelecionadas, setTagsSelecionadas] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function alternarTag(tag: string) {
    setTagsSelecionadas((atual) =>
      atual.includes(tag) ? atual.filter((t) => t !== tag) : [...atual, tag],
    );
  }

  async function aoEnviar() {
    setErro(null);
    setEnviando(true);
    try {
      await avaliarPrestador({
        pedidoId,
        nota,
        comentario: comentario.trim() || undefined,
        tags: tagsSelecionadas,
      });
      navigation.popToTop();
    } catch {
      setErro('Não foi possível enviar sua avaliação. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Como foi o serviço?</Text>
      <Text style={styles.subtitulo}>Avalie {prestadorNome}</Text>

      <View style={styles.estrelas}>
        {ESTRELAS.map((valor) => (
          <TouchableOpacity key={valor} onPress={() => setNota(valor)}>
            <Text style={[styles.estrela, valor <= nota && styles.estrelaAtiva]}>★</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.rotulo}>O que se destacou?</Text>
      <View style={styles.tags}>
        {TAGS_AVALIACAO.map((tag) => (
          <TouchableOpacity
            key={tag}
            style={[styles.tag, tagsSelecionadas.includes(tag) && styles.tagAtiva]}
            onPress={() => alternarTag(tag)}
          >
            <Text style={styles.tagTexto}>{tag}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Deixe um comentário (opcional)"
        placeholderTextColor={colors.muted}
        value={comentario}
        onChangeText={setComentario}
        multiline
      />

      {erro && <Text style={styles.erro}>{erro}</Text>}

      <PrimaryButton label="Enviar avaliação" onPress={aoEnviar} loading={enviando} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.bg, padding: spacing.xl, paddingTop: spacing.xxl },
  titulo: { fontSize: 22, fontWeight: '800', color: colors.textForte, textAlign: 'center' },
  subtitulo: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  estrelas: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: spacing.lg },
  estrela: { fontSize: 40, color: colors.border },
  estrelaAtiva: { color: colors.laranja },
  rotulo: { color: colors.text, fontSize: 13, fontWeight: '600', marginBottom: spacing.sm },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagAtiva: { backgroundColor: colors.roxo, borderColor: colors.roxo },
  tagTexto: { color: colors.text, fontSize: 12 },
  input: {
    minHeight: 80,
    backgroundColor: colors.bg2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    color: colors.textForte,
    marginBottom: spacing.lg,
    textAlignVertical: 'top',
  },
  erro: { color: colors.red, fontSize: 13, textAlign: 'center', marginBottom: spacing.md },
});
