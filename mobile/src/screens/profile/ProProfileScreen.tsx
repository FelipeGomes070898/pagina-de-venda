import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { colors, radius, sombra, spacing } from '@/theme/tokens';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { buscarPrestador, contatarPrestador, PrestadorDetalhe } from '@/services/marketplaceService';
import { somenteDigitos } from '@/utils/masks';

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

  async function aoSolicitar() {
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

  function aoChamarNoWhatsapp() {
    if (!prestador?.whatsapp) return;
    const numero = somenteDigitos(prestador.whatsapp);
    const numeroComPais = numero.startsWith('55') ? numero : `55${numero}`;
    const mensagem = encodeURIComponent(
      `Olá ${prestador.nome}, vi seu perfil na Konecta Já e gostaria de saber mais sobre seus serviços.`,
    );
    Linking.openURL(`https://wa.me/${numeroComPais}?text=${mensagem}`);
  }

  function aoCompartilhar() {
    Share.share({
      message: `Dá uma olhada no perfil de ${prestadorNome} na Konecta Já!`,
    });
  }

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator color={colors.laranja} />
      </View>
    );
  }

  if (erro || !prestador) {
    return (
      <View style={styles.centro}>
        <TouchableOpacity style={styles.voltarCentro} onPress={() => navigation.goBack()}>
          <Text style={styles.voltarTexto}>‹ Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.erro}>{erro || 'Prestador não encontrado.'}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={styles.headerBotao}>‹ Voltar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={aoCompartilhar} hitSlop={10}>
          <Text style={styles.headerBotao}>Compartilhar ⤴</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.corpo}>
        {prestador.foto_url ? (
          <Image source={{ uri: prestador.foto_url }} style={styles.foto} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarTexto}>{prestador.nome.charAt(0).toUpperCase()}</Text>
          </View>
        )}

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
                <Image key={foto.id} source={{ uri: foto.url }} style={styles.fotoTrabalho} />
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

        {erro && <Text style={styles.erroAcao}>{erro}</Text>}

        <PrimaryButton
          label="Solicitar serviço"
          onPress={aoSolicitar}
          loading={contatando}
          style={styles.botaoContato}
        />

        {prestador.whatsapp && (
          <TouchableOpacity style={styles.botaoWhatsapp} onPress={aoChamarNoWhatsapp}>
            <Text style={styles.botaoWhatsappTexto}>💬 Chamar no WhatsApp</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: spacing.xxl, backgroundColor: colors.bg, flexGrow: 1 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  voltarCentro: { position: 'absolute', top: spacing.xl, left: spacing.lg },
  voltarTexto: { color: colors.azul, fontSize: 14, fontWeight: '600' },
  erro: { color: colors.red, fontSize: 14 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerBotao: { color: colors.azul, fontSize: 14, fontWeight: '600' },
  corpo: { paddingHorizontal: spacing.xl },
  foto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: spacing.md,
    backgroundColor: colors.bg2,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.laranja,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  avatarTexto: { color: '#fff', fontSize: 48, fontWeight: '800' },
  nome: { color: colors.textForte, fontSize: 22, fontWeight: '800', textAlign: 'center' },
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
    color: colors.laranja,
    fontWeight: '800',
    fontSize: 18,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  bio: { color: colors.text, fontSize: 14, textAlign: 'center', marginTop: spacing.md },
  secao: { marginTop: spacing.xl },
  secaoTitulo: { color: colors.textForte, fontSize: 15, fontWeight: '700', marginBottom: spacing.sm },
  fotoTrabalho: {
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
    ...sombra,
  },
  avaliacaoHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  avaliacaoNome: { color: colors.textForte, fontWeight: '600', fontSize: 13 },
  avaliacaoNota: { fontSize: 12 },
  avaliacaoComentario: { color: colors.text, fontSize: 13, marginTop: 4 },
  erroAcao: { color: colors.red, fontSize: 13, textAlign: 'center', marginTop: spacing.lg },
  botaoContato: { marginTop: spacing.xl },
  botaoWhatsapp: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  botaoWhatsappTexto: { color: colors.green, fontWeight: '700', fontSize: 14 },
});
