import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '@/navigation/types';
import { colors, radius, sombra, spacing } from '@/theme/tokens';
import { useAuthStore } from '@/store/authStore';
import { meuPerfil, MeuPerfil } from '@/services/authService';
import { adicionarServico, removerServico } from '@/services/servicoPrestadorService';
import { mascararCPF, mascararTelefoneBR } from '@/utils/masks';

type Props = BottomTabScreenProps<MainTabParamList, 'PerfilTab'>;

const ROTULO_TIPO: Record<string, string> = {
  cliente: 'Cliente',
  prestador: 'Prestador de serviço',
};

const ROTULO_COBRANCA: Record<string, string> = {
  percentual: '5% por serviço concluído',
  fixo_mensal: 'R$ 25,00 fixo por mês',
};

export function PerfilScreen(_props: Props) {
  const usuario = useAuthStore((s) => s.usuario);
  const logout = useAuthStore((s) => s.logout);

  const [perfil, setPerfil] = useState<MeuPerfil | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [novoValor, setNovoValor] = useState('');
  const [adicionandoServico, setAdicionandoServico] = useState(false);

  useEffect(() => {
    meuPerfil()
      .then(setPerfil)
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  function aoSair() {
    Alert.alert('Sair', 'Tem certeza que deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  }

  async function aoAdicionarServico() {
    if (!novaCategoria.trim()) return;
    setAdicionandoServico(true);
    try {
      const servico = await adicionarServico({
        categoria: novaCategoria.trim(),
        valor: novoValor ? Number(novoValor.replace(',', '.')) : undefined,
      });
      setPerfil((p) => (p ? { ...p, servicos: [...(p.servicos ?? []), servico] } : p));
      setNovaCategoria('');
      setNovoValor('');
    } catch {
      Alert.alert('Erro', 'Não foi possível adicionar esse serviço.');
    } finally {
      setAdicionandoServico(false);
    }
  }

  async function aoRemoverServico(servicoId: string) {
    try {
      await removerServico(servicoId);
      setPerfil((p) => (p ? { ...p, servicos: p.servicos?.filter((s) => s.id !== servicoId) } : p));
    } catch {
      Alert.alert('Erro', 'Não foi possível remover esse serviço.');
    }
  }

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
      </View>

      {carregando ? (
        <ActivityIndicator color={colors.laranja} style={{ marginTop: spacing.lg }} />
      ) : (
        perfil && (
          <>
            <View style={styles.secao}>
              <Text style={styles.secaoTitulo}>Dados de cadastro</Text>
              <Campo label="E-mail" valor={perfil.email} />
              <Campo label="Telefone" valor={perfil.telefone ? mascararTelefoneBR(perfil.telefone) : '—'} />
              <Campo label="CPF" valor={perfil.cpf ? mascararCPF(perfil.cpf) : '—'} />
              <Campo label="Cidade" valor={perfil.cidade || '—'} />
              <Campo label="Estado" valor={perfil.estado || '—'} />
            </View>

            {perfil.tipo === 'cliente' && (
              <View style={styles.secao}>
                <Text style={styles.secaoTitulo}>Seu histórico</Text>
                <Campo label="Serviços contratados" valor={String(perfil.total_servicos ?? 0)} />
                <Campo
                  label="Avaliação dos prestadores"
                  valor={
                    perfil.total_avaliacoes
                      ? `⭐ ${Number(perfil.avaliacao ?? 5).toFixed(1)} (${perfil.total_avaliacoes} avaliações)`
                      : 'Ainda sem avaliações'
                  }
                />
              </View>
            )}

            {perfil.tipo === 'prestador' && (
              <View style={styles.secao}>
                <Text style={styles.secaoTitulo}>Dados de prestador</Text>
                <Campo label="Serviço oferecido" valor={perfil.segmento || '—'} />
                <Campo
                  label="Valor do serviço"
                  valor={perfil.valor_servico != null ? `R$ ${Number(perfil.valor_servico).toFixed(2)}` : '—'}
                />
                <Campo
                  label="Cobrança da plataforma"
                  valor={(perfil.modelo_cobranca && ROTULO_COBRANCA[perfil.modelo_cobranca]) || '—'}
                />
                <Campo
                  label="Avaliação"
                  valor={`⭐ ${Number(perfil.avaliacao ?? 5).toFixed(1)} (${perfil.total_avaliacoes ?? 0} avaliações)`}
                />
                <Campo label="Serviços concluídos" valor={String(perfil.total_servicos ?? 0)} />
              </View>
            )}

            {perfil.tipo === 'prestador' && (
              <View style={styles.secao}>
                <Text style={styles.secaoTitulo}>Área de serviço</Text>
                <Text style={styles.albumAjuda}>
                  Outros trabalhos que você também faz, além do seu serviço principal — aparecem no marketplace
                  pros clientes (e outros prestadores) encontrarem.
                </Text>

                {(perfil.servicos?.length ?? 0) > 0 && (
                  <View style={styles.listaServicos}>
                    {perfil.servicos!.map((servico) => (
                      <View key={servico.id} style={styles.itemServico}>
                        <View>
                          <Text style={styles.itemServicoCategoria}>{servico.categoria}</Text>
                          {servico.valor != null && (
                            <Text style={styles.itemServicoValor}>R$ {Number(servico.valor).toFixed(2)}</Text>
                          )}
                        </View>
                        <TouchableOpacity onPress={() => aoRemoverServico(servico.id)}>
                          <Text style={styles.itemServicoRemover}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.formServico}>
                  <TextInput
                    style={styles.inputServicoCategoria}
                    placeholder="Ex.: Encanador, Diarista..."
                    placeholderTextColor={colors.muted}
                    value={novaCategoria}
                    onChangeText={setNovaCategoria}
                  />
                  <TextInput
                    style={styles.inputServicoValor}
                    placeholder="Diária (R$)"
                    placeholderTextColor={colors.muted}
                    value={novoValor}
                    onChangeText={setNovoValor}
                    keyboardType="decimal-pad"
                  />
                </View>
                <TouchableOpacity
                  style={styles.botaoAdicionarServico}
                  onPress={aoAdicionarServico}
                  disabled={adicionandoServico}
                >
                  <Text style={styles.botaoAdicionarServicoTexto}>
                    {adicionandoServico ? '...' : '+ Adicionar'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {perfil.tipo === 'prestador' && (perfil.fotos?.length ?? 0) > 0 && (
              <View style={styles.secao}>
                <Text style={styles.secaoTitulo}>Álbum de trabalhos</Text>
                <View style={styles.albumGrade}>
                  {perfil.fotos!.map((foto) => (
                    <Image key={foto.id} source={{ uri: foto.url }} style={styles.albumFoto} />
                  ))}
                </View>
                <Text style={styles.albumAjuda}>
                  Pra adicionar ou remover fotos, use o site da Konecta Já pelo navegador por enquanto.
                </Text>
              </View>
            )}
          </>
        )
      )}

      <TouchableOpacity style={styles.opcao} onPress={aoSair}>
        <Text style={styles.opcaoTextoSair}>Sair da conta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Campo({ label, valor }: { label: string; valor: string }) {
  return (
    <View style={styles.campo}>
      <Text style={styles.campoLabel}>{label}</Text>
      <Text style={styles.campoValor}>{valor}</Text>
    </View>
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
  secao: {
    backgroundColor: colors.bg2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  secaoTitulo: { color: colors.textForte, fontWeight: '700', fontSize: 14, marginBottom: spacing.sm },
  campo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  campoLabel: { color: colors.muted, fontSize: 13 },
  campoValor: { color: colors.textForte, fontWeight: '600', fontSize: 13 },
  listaServicos: { gap: 8, marginBottom: spacing.sm },
  itemServico: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg3,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  itemServicoCategoria: { color: colors.textForte, fontWeight: '600', fontSize: 13 },
  itemServicoValor: { color: colors.laranja, fontWeight: '700', fontSize: 12, marginTop: 2 },
  itemServicoRemover: { color: colors.muted, fontSize: 14, paddingHorizontal: 8 },
  formServico: { flexDirection: 'row', gap: 8, marginTop: spacing.sm },
  inputServicoCategoria: {
    flex: 1.4,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    color: colors.textForte,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  inputServicoValor: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    color: colors.textForte,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  botaoAdicionarServico: {
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.laranja,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  botaoAdicionarServicoTexto: { color: '#fff', fontWeight: '700', fontSize: 13 },
  albumGrade: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  albumFoto: { width: 80, height: 80, borderRadius: radius.sm },
  albumAjuda: { color: colors.muted, fontSize: 11, marginTop: spacing.sm },
  opcao: {
    backgroundColor: colors.bg2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.red,
    padding: spacing.md,
    alignItems: 'center',
  },
  opcaoTextoSair: { color: colors.red, fontWeight: '700', fontSize: 14 },
});
