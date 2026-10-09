import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import { MainTabParamList, RootStackParamList } from '@/navigation/types';
import { colors, radius, sombra, spacing } from '@/theme/tokens';
import { useAuthStore } from '@/store/authStore';
import { meuPerfil, trocarPapel, MeuPerfil } from '@/services/authService';
import { AppIcon, NomeIcone } from '@/components/common/AppIcon';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'PerfilTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

const ROTULO_TIPO: Record<string, string> = {
  cliente: 'Cliente',
  prestador: 'Prestador de serviço',
};

// Hub do perfil: a identidade (foto/nome/tipo) fica aqui, o resto vira
// um menu de sub-telas — espelha web-app/src/pages/profile/MeuPerfil.jsx.
// Cada seção tinha informação/formulário demais pra caber numa tela só
// sem virar uma rolagem infinita.
export function PerfilScreen({ navigation }: Props) {
  const usuario = useAuthStore((s) => s.usuario);
  const logout = useAuthStore((s) => s.logout);
  const definirSessao = useAuthStore((s) => s.definirSessao);

  const [perfil, setPerfil] = useState<MeuPerfil | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [trocandoPapel, setTrocandoPapel] = useState(false);

  useEffect(() => {
    meuPerfil()
      .then(setPerfil)
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  // Troca de "modo" (cliente ⇄ prestador) sem deslogar — a conta já
  // tem os dois papéis vinculados (ver TornarPrestadorScreen).
  async function aoTrocarPapel() {
    setTrocandoPapel(true);
    try {
      const { token, usuario: novoUsuario } = await trocarPapel();
      definirSessao({ token, usuario: novoUsuario });
    } catch {
      Alert.alert('Erro', 'Não foi possível trocar de modo agora.');
    } finally {
      setTrocandoPapel(false);
    }
  }

  function aoSair() {
    Alert.alert('Sair', 'Tem certeza que deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  }

  const souPrestador = usuario?.tipo === 'prestador';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Perfil</Text>
      </View>

      <View style={styles.card}>
        {perfil?.foto_url ? (
          <Image source={{ uri: perfil.foto_url }} style={styles.avatarFoto} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarTexto}>{(usuario?.nome || '?').charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <Text style={styles.nome}>{usuario?.nome || 'Usuário'}</Text>
        <Text style={styles.tipo}>{ROTULO_TIPO[usuario?.tipo || ''] || usuario?.tipo}</Text>

        {!souPrestador && !perfil?.temPapelPrestador && (
          <TouchableOpacity style={styles.botaoPapel} onPress={() => navigation.navigate('TornarPrestador')}>
            <Text style={styles.botaoPapelTexto}>+ Quero também trabalhar</Text>
          </TouchableOpacity>
        )}

        {((souPrestador && perfil?.temPapelCliente) || (!souPrestador && perfil?.temPapelPrestador)) && (
          <TouchableOpacity style={styles.botaoPapel} onPress={aoTrocarPapel} disabled={trocandoPapel}>
            <Text style={styles.botaoPapelTexto}>
              {trocandoPapel ? 'Trocando...' : `⇄ Mudar para modo ${souPrestador ? 'cliente' : 'prestador'}`}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {carregando ? (
        <ActivityIndicator color={colors.laranja} style={{ marginTop: spacing.lg }} />
      ) : (
        souPrestador &&
        (perfil?.fotos?.length ?? 0) > 0 && (
          <TouchableOpacity style={styles.albumPreview} onPress={() => navigation.navigate('AlbumTrabalhos')}>
            <View style={styles.albumCabecalho}>
              <Text style={styles.albumTitulo}>Álbum de trabalhos</Text>
              <Text style={styles.albumVerTudo}>Ver tudo ›</Text>
            </View>
            <View style={styles.albumGrade}>
              {perfil!.fotos!.slice(0, 6).map((foto, i) => (
                <View key={foto.id} style={styles.albumItem}>
                  <Image source={{ uri: foto.url }} style={styles.albumFoto} />
                  {i === 5 && perfil!.fotos!.length > 6 && (
                    <View style={styles.albumMais}>
                      <Text style={styles.albumMaisTexto}>+{perfil!.fotos!.length - 6}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </TouchableOpacity>
        )
      )}

      <View style={styles.menu}>
        <ItemMenu
          icone="pessoa"
          titulo="Dados pessoais"
          descricao="E-mail, telefone, CPF, cidade"
          onPress={() => navigation.navigate('DadosPessoais')}
        />

        {souPrestador ? (
          <>
            <ItemMenu
              icone="mala"
              titulo="Dados de prestador"
              descricao="Serviço, valor, cobrança, avaliação"
              onPress={() => navigation.navigate('DadosPrestador')}
            />
            <ItemMenu
              icone="pino"
              titulo="Mapa dos trabalhos"
              descricao="Onde você já prestou serviço"
              onPress={() => navigation.navigate('MapaTrabalhosPerfil')}
            />
            <ItemMenu
              icone="ferramenta"
              titulo="Área de serviço"
              descricao="Outros trabalhos que você também faz"
              onPress={() => navigation.navigate('AreaServico')}
            />
            <ItemMenu
              icone="foto"
              titulo="Álbum de trabalhos"
              descricao="Fotos de serviços já feitos"
              onPress={() => navigation.navigate('AlbumTrabalhos')}
            />
          </>
        ) : (
          <ItemMenu
            icone="mala"
            titulo="Meu histórico"
            descricao="Serviços contratados e avaliações"
            onPress={() => navigation.navigate('MeuHistorico')}
          />
        )}

        <ItemMenu
          icone="escudo"
          titulo="Privacidade e dados"
          descricao="LGPD, baixar dados, excluir conta"
          onPress={() => navigation.navigate('PrivacidadeDados')}
        />
      </View>

      <TouchableOpacity style={styles.opcao} onPress={aoSair}>
        <Text style={styles.opcaoTextoSair}>Sair da conta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function ItemMenu({
  icone,
  titulo,
  descricao,
  onPress,
}: {
  icone: NomeIcone;
  titulo: string;
  descricao: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.itemMenu} onPress={onPress}>
      <View style={styles.itemMenuIcone}>
        <AppIcon nome={icone} cor={colors.laranjaEscuro} tamanho={18} />
      </View>
      <View style={styles.itemMenuTextos}>
        <Text style={styles.itemMenuTitulo}>{titulo}</Text>
        <Text style={styles.itemMenuDescricao} numberOfLines={1}>
          {descricao}
        </Text>
      </View>
      <Text style={styles.itemMenuSeta}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  conteudo: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { marginBottom: spacing.lg },
  titulo: { fontSize: 22, fontWeight: '800', color: colors.textForte },
  card: {
    backgroundColor: colors.bg2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...sombra,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.laranja,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarTexto: { color: '#fff', fontWeight: '800', fontSize: 30 },
  avatarFoto: { width: 72, height: 72, borderRadius: 36, marginBottom: spacing.md },
  nome: { color: colors.textForte, fontWeight: '800', fontSize: 18 },
  tipo: { color: colors.muted, fontSize: 13, marginTop: 2 },
  botaoPapel: {
    marginTop: spacing.md,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.laranja,
    backgroundColor: colors.bg,
  },
  botaoPapelTexto: { color: colors.laranjaEscuro, fontWeight: '700', fontSize: 12.5 },
  albumPreview: {
    backgroundColor: colors.bg2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  albumCabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  albumTitulo: { color: colors.textForte, fontWeight: '700', fontSize: 15 },
  albumVerTudo: { color: colors.laranjaEscuro, fontWeight: '700', fontSize: 12.5 },
  albumGrade: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  albumItem: { width: 64, height: 64, borderRadius: radius.sm, overflow: 'hidden' },
  albumFoto: { width: '100%', height: '100%' },
  albumMais: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(28,25,23,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  albumMaisTexto: { color: '#fff', fontWeight: '800', fontSize: 14 },
  menu: { gap: 10, marginBottom: spacing.lg },
  itemMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  itemMenuIcone: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.bg3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemMenuTextos: { flex: 1 },
  itemMenuTitulo: { color: colors.textForte, fontWeight: '700', fontSize: 14 },
  itemMenuDescricao: { color: colors.muted, fontSize: 12, marginTop: 2 },
  itemMenuSeta: { color: colors.muted, fontSize: 20 },
  opcao: {
    backgroundColor: colors.bg2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
  },
  opcaoTextoSair: { color: colors.textForte, fontWeight: '700', fontSize: 14 },
});
