import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';
import { SubPaginaHeader } from '@/components/common/SubPaginaHeader';
import { meuPerfil, MeuPerfil } from '@/services/authService';
import { mascararCPF, mascararTelefoneBR } from '@/utils/masks';

export function DadosPessoaisScreen() {
  const [perfil, setPerfil] = useState<MeuPerfil | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    meuPerfil()
      .then(setPerfil)
      .catch(() => setErro('Não foi possível carregar seus dados.'));
  }, []);

  return (
    <View style={styles.container}>
      <SubPaginaHeader titulo="Dados pessoais" />
      <ScrollView contentContainerStyle={styles.corpo}>
        {erro && <Text style={styles.erro}>{erro}</Text>}
        {!perfil && !erro ? (
          <ActivityIndicator color={colors.laranja} style={{ marginTop: spacing.xl }} />
        ) : (
          perfil && (
            <View style={styles.secao}>
              <Campo label="Nome" valor={perfil.nome} />
              <Campo label="E-mail" valor={perfil.email} />
              <Campo label="Telefone" valor={perfil.telefone ? mascararTelefoneBR(perfil.telefone) : '—'} />
              <Campo label="CPF" valor={perfil.cpf ? mascararCPF(perfil.cpf) : '—'} />
              <Campo label="Cidade" valor={perfil.cidade || '—'} />
              <Campo label="Estado" valor={perfil.estado || '—'} />
            </View>
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
});
