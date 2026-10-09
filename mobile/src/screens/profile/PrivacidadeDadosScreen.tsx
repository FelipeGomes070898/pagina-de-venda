import React, { useState } from 'react';
import { Alert, Modal, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';
import { SubPaginaHeader } from '@/components/common/SubPaginaHeader';
import { DocumentoLegalModal } from '@/components/common/DocumentoLegalModal';
import { useAuthStore } from '@/store/authStore';
import { exportarDados, excluirConta } from '@/services/authService';

export function PrivacidadeDadosScreen() {
  const logout = useAuthStore((s) => s.logout);

  const [docAberto, setDocAberto] = useState<'termos' | 'privacidade' | null>(null);
  const [mostrarExcluir, setMostrarExcluir] = useState(false);
  const [senhaExcluir, setSenhaExcluir] = useState('');
  const [excluindo, setExcluindo] = useState(false);
  const [erroExcluir, setErroExcluir] = useState<string | null>(null);

  // LGPD "portabilidade" — compartilha os dados cadastrais (sem salvar
  // arquivo em disco, pra não depender de nenhuma lib nova).
  async function aoBaixarDados() {
    try {
      const resultado = await exportarDados();
      await Share.share({
        title: 'Meus dados — Konecta Já',
        message: JSON.stringify(resultado, null, 2),
      });
    } catch {
      Alert.alert('Erro', 'Não foi possível preparar seus dados.');
    }
  }

  // LGPD "direito ao esquecimento" — exige a senha atual.
  async function aoConfirmarExclusao() {
    if (!senhaExcluir) return;
    setExcluindo(true);
    setErroExcluir(null);
    try {
      await excluirConta(senhaExcluir);
      setMostrarExcluir(false);
      logout();
    } catch (erro: any) {
      setErroExcluir(erro.response?.data?.erro || 'Não foi possível excluir sua conta.');
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <View style={styles.container}>
      <SubPaginaHeader titulo="Privacidade e dados" />
      <ScrollView contentContainerStyle={styles.corpo}>
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>Seus dados (LGPD)</Text>
          <TouchableOpacity onPress={() => setDocAberto('privacidade')}>
            <Text style={styles.linkPrivacidade}>Ver Política de Privacidade</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setDocAberto('termos')}>
            <Text style={styles.linkPrivacidade}>Ver Termos de Uso</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.botaoSecundario} onPress={aoBaixarDados}>
            <Text style={styles.botaoSecundarioTexto}>Baixar meus dados</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.botaoExcluir} onPress={() => setMostrarExcluir(true)}>
          <Text style={styles.botaoExcluirTexto}>Excluir minha conta</Text>
        </TouchableOpacity>
      </ScrollView>

      <DocumentoLegalModal
        visivel={docAberto !== null}
        docInicial={docAberto ?? 'termos'}
        onFechar={() => setDocAberto(null)}
      />

      <Modal visible={mostrarExcluir} transparent animationType="fade">
        <View style={styles.modalFundo}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo}>Excluir sua conta</Text>
            <Text style={styles.modalTexto}>
              Isso remove seus dados pessoais (nome, e-mail, telefone, CPF, foto) do Konecta Já e
              bloqueia o acesso à conta imediatamente. Pedidos já feitos continuam existindo pra
              outra parte envolvida, mas sem te identificar. Essa ação não pode ser desfeita.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Confirme sua senha"
              placeholderTextColor={colors.muted}
              secureTextEntry
              value={senhaExcluir}
              onChangeText={setSenhaExcluir}
            />
            {erroExcluir && <Text style={styles.erroExcluir}>{erroExcluir}</Text>}
            <View style={styles.modalBotoes}>
              <TouchableOpacity
                style={styles.botaoSecundario}
                onPress={() => {
                  setMostrarExcluir(false);
                  setSenhaExcluir('');
                  setErroExcluir(null);
                }}
                disabled={excluindo}
              >
                <Text style={styles.botaoSecundarioTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.botaoExcluirConfirmar} onPress={aoConfirmarExclusao} disabled={excluindo}>
                <Text style={styles.botaoExcluirConfirmarTexto}>{excluindo ? 'Excluindo...' : 'Excluir conta'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  corpo: { padding: spacing.lg, paddingBottom: spacing.xxl },
  secao: {
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  secaoTitulo: { color: colors.textForte, fontWeight: '700', fontSize: 14, marginBottom: spacing.sm },
  linkPrivacidade: { color: colors.azul, fontSize: 13, fontWeight: '600', marginBottom: 10 },
  botaoSecundario: {
    height: 40,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg3,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    marginTop: 4,
  },
  botaoSecundarioTexto: { color: colors.textForte, fontWeight: '600', fontSize: 13 },
  botaoExcluir: { padding: spacing.md, alignItems: 'center', marginTop: spacing.lg },
  botaoExcluirTexto: { color: colors.red, fontWeight: '600', fontSize: 13 },
  modalFundo: {
    flex: 1,
    backgroundColor: 'rgba(28, 25, 23, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.bg2,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: 12,
  },
  modalTitulo: { color: colors.textForte, fontSize: 18, fontWeight: '800' },
  modalTexto: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  modalInput: {
    height: 46,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg3,
    color: colors.textForte,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  erroExcluir: { color: colors.red, fontSize: 13 },
  modalBotoes: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginTop: 4 },
  botaoExcluirConfirmar: {
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  botaoExcluirConfirmarTexto: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
