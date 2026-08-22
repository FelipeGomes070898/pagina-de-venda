import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { colors, radius, spacing } from '@/theme/tokens';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { buscarPrestador, contatarPrestador, PrestadorDetalhe } from '@/services/marketplaceService';

type Props = NativeStackScreenProps<RootStackParamList, 'ProProfile'>;

export function ProProfileScreen({ route, navigation }: Props) {
  const { prestadorId, prestadorNome } = route.params;

  const [prestador, setPrestador] = useState<PrestadorDetalhe | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [contatando, setContatando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    buscarPrestador(prestadorId)
      .then(setPrestador)
      .catch(() => setErro('Não foi possível carregar este perfil.'))
      .finally(() => setCarregando(false));
  }, [prestadorId]);

  async function aoContatar() {
    setContatando(true);
    try {
      const pedido = await contatarPrestador(prestadorId);
      navigation.navigate('Chat', { pedidoId: pedido.id, prestadorNome });
    } catch {
      setErro('Não foi possível entrar em contato agora.');
    } finally {
      setContatando(false);
    }
  }

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator color={colors.roxo} />
      </View>
    );
  }

  if (erro || !prestador) {
    return (
      <View style={styles.centro}>
        <Text style={styles.erro}>{erro || 'Prestador não encontrado.'}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarTexto}>{prestador.nome.charAt(0).toUpperCase()}</Text>
      </View>

      <Text style={styles.nome}>{prestador.nome}</Text>
      <Text style={styles.segmento}>{prestador.segmento || 'Serviços gerais'}</Text>

      <View style={styles.linhaInfo}>
        <Text style={styles.estrelas}>
          ⭐ {prestador.avaliacao?.toFixed(1) ?? '5.0'} ({prestador.total_avaliacoes} avaliações)
        </Text>
        <Text style={styles.servicos}>· {prestador.total_servicos} serviços feitos</Text>
      </View>

      {prestador.valor_servico != null && (
        <Text style={styles.preco}>A partir de R$ {prestador.valor_servico.toFixed(2)}</Text>
      )}

      {prestador.bio && <Text style={styles.bio}>{prestador.bio}</Text>}

      {prestador.fotos.length > 0 && (
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>Trabalhos anteriores</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {prestador.fotos.map((foto) => (
              <Image key={foto.id} source={{ uri: foto.url }} style={styles.foto} />
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>Avaliações</Text>
        {prestador.avaliacoes.length === 0 ? (
          <Text style={styles.semAvaliacoes}>Ainda sem avaliações.</Text>
        ) : (
          prestador.avaliacoes.map((av) => (
            <View key={av.id} style={styles.avaliacaoCard}>
              <View style={styles.avaliacaoHeader}>
                <Text style={styles.avaliacaoNome}>{av.cliente_nome}</Text>
                <Text style={styles.avaliacaoNota}>{'⭐'.repeat(av.nota)}</Text>
              </View>
              {av.comentario && <Text style={styles.avaliacaoComentario}>{av.comentario}</Text>}
            </View>
          ))
        )}
      </View>

      <PrimaryButton
        label="Entrar em contato"
        onPress={aoContatar}
        loading={contatando}
        style={styles.botaoContato}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, paddingBottom: spacing.xxl, backgroundColor: colors.bg },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  erro: { color: colors.red, fontSize: 14 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.roxo,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  avatarTexto: { color: colors.textForte, fontSize: 36, fontWeight: '800' },
  nome: { color: colors.textForte, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  segmento: { color: colors.muted, fontSize: 14, textAlign: 'center', marginTop: 2 },
  linhaInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
  estrelas: { color: colors.text, fontSize: 13 },
  servicos: { color: colors.muted, fontSize: 13, marginLeft: 4 },
  preco: {
    color: colors.green,
    fontWeight: '800',
    fontSize: 18,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  bio: { color: colors.text, fontSize: 14, textAlign: 'center', marginTop: spacing.md },
  secao: { marginTop: spacing.xl },
  secaoTitulo: { color: colors.textForte, fontSize: 15, fontWeight: '700', marginBottom: spacing.sm },
  foto: {
    width: 110,
    height: 110,
    borderRadius: radius.md,
    marginRight: spacing.sm,
    backgroundColor: colors.bg2,
  },
  semAvaliacoes: { color: colors.muted, fontSize: 13 },
  avaliacaoCard: {
    backgroundColor: colors.bg2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  avaliacaoHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  avaliacaoNome: { color: colors.textForte, fontWeight: '600', fontSize: 13 },
  avaliacaoNota: { fontSize: 12 },
  avaliacaoComentario: { color: colors.text, fontSize: 13, marginTop: 4 },
  botaoContato: { marginTop: spacing.xl },
});
