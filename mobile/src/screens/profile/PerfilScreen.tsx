import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '@/navigation/types';
import { colors, radius, sombra, spacing } from '@/theme/tokens';
import { useAuthStore } from '@/store/authStore';
import { meuPerfil, MeuPerfil } from '@/services/authService';
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Perfil</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>{(usuario?.nome || '?').charAt(0).toUpperCase()}</Text>
        </View>
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
