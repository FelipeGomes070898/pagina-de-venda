import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';
import { SubPaginaHeader } from '@/components/common/SubPaginaHeader';
import { meuPerfil, MeuPerfil } from '@/services/authService';
import { definirAvatarPrestador } from '@/services/marketplaceService';
import { Boneco, OPCOES_BONECO } from '@/utils/bonecos';

const ROTULOS_COBRANCA: Record<string, string> = {
  percentual: '5% por serviço concluído',
  fixo_mensal: 'R$ 25,00 fixo por mês',
};

export function DadosPrestadorScreen() {
  const [perfil, setPerfil] = useState<MeuPerfil | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvandoAvatar, setSalvandoAvatar] = useState(false);

  useEffect(() => {
    meuPerfil()
      .then(setPerfil)
      .catch(() => setErro('Não foi possível carregar seus dados.'));
  }, []);

  async function aoEscolherBoneco(valor: 'masculino' | 'feminino') {
    if (salvandoAvatar || perfil?.avatarGenero === valor) return;
    setSalvandoAvatar(true);
    try {
      await definirAvatarPrestador(valor);
      setPerfil((p) => (p ? { ...p, avatarGenero: valor } : p));
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar seu boneco agora.');
    } finally {
      setSalvandoAvatar(false);
    }
  }

  return (
    <View style={styles.container}>
      <SubPaginaHeader titulo="Dados de prestador" />
      <ScrollView contentContainerStyle={styles.corpo}>
        {erro && <Text style={styles.erro}>{erro}</Text>}
        {!perfil && !erro ? (
          <ActivityIndicator color={colors.laranja} style={{ marginTop: spacing.xl }} />
        ) : (
          perfil && (
            <>
              <View style={styles.secao}>
                <Campo label="Serviço oferecido" valor={perfil.segmento || '—'} />
                <Campo
                  label="Valor do serviço"
                  valor={perfil.valor_servico != null ? `R$ ${Number(perfil.valor_servico).toFixed(2)}` : '—'}
                />
                <Campo
                  label="Cobrança da plataforma"
                  valor={(perfil.modelo_cobranca && ROTULOS_COBRANCA[perfil.modelo_cobranca]) || '—'}
                />
                <Campo
                  label="Avaliação"
                  valor={`★ ${Number(perfil.avaliacao ?? 5).toFixed(1)} (${perfil.total_avaliacoes ?? 0} avaliações)`}
                />
                <Campo label="Serviços concluídos" valor={String(perfil.total_servicos ?? 0)} />
              </View>

              <View style={styles.secaoBoneco}>
                <Text style={styles.tituloBoneco}>Seu boneco no mapa</Text>
                <Text style={styles.ajudaBoneco}>
                  Esse é o ícone que aparece representando você no mapa de trabalhadores.
                </Text>
                <View style={styles.listaBonecos}>
                  {OPCOES_BONECO.map((opcao) => {
                    const ativo = (perfil.avatarGenero || 'neutro') === opcao.valor;
                    return (
                      <TouchableOpacity
                        key={opcao.valor}
                        style={[styles.bonecoOpcao, ativo && styles.bonecoOpcaoAtiva]}
                        onPress={() => aoEscolherBoneco(opcao.valor)}
                        disabled={salvandoAvatar}
                      >
                        <Boneco genero={opcao.valor} tamanho={44} />
                        <Text style={styles.bonecoRotulo}>{opcao.rotulo}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </>
          )
        )}
      </ScrollView>
    </View>
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
  corpo: { padding: spacing.lg, paddingBottom: spacing.xxl },
  erro: { color: colors.red, fontSize: 13, textAlign: 'center', marginBottom: spacing.sm },
  secao: {
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  campo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  campoLabel: { color: colors.muted, fontSize: 13 },
  campoValor: { color: colors.textForte, fontWeight: '600', fontSize: 13 },
  secaoBoneco: {
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  tituloBoneco: { color: colors.textForte, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  ajudaBoneco: { color: colors.muted, fontSize: 12, marginBottom: spacing.md },
  listaBonecos: { flexDirection: 'row', gap: 10 },
  bonecoOpcao: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.bg3,
  },
  bonecoOpcaoAtiva: { borderColor: colors.laranja, backgroundColor: colors.laranjaSoft },
  bonecoRotulo: { color: colors.textForte, fontSize: 11.5, fontWeight: '600' },
});
