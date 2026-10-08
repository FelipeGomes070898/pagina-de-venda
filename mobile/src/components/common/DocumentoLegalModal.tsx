import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';
import { DOCUMENTOS, ATUALIZADO_EM_LABEL } from '@/content/documentosLegais';

type Chave = keyof typeof DOCUMENTOS;

interface Props {
  visivel: boolean;
  docInicial?: Chave;
  onFechar: () => void;
}

const ABAS: { chave: Chave; rotulo: string }[] = [
  { chave: 'termos', rotulo: 'Termos de Uso' },
  { chave: 'privacidade', rotulo: 'Privacidade' },
  { chave: 'cancelamento', rotulo: 'Cancelamento' },
];

// Modal com os 3 documentos legais do Konecta Já — aberto a partir do
// cadastro (checkbox de aceite) e da tela de Perfil. Sem navegação
// própria de propósito: evita alterar RootStackParamList/AppNavigator
// só pra isso. Ver web-app/src/pages/legal/Legal.jsx pro equivalente
// com rota.
export function DocumentoLegalModal({ visivel, docInicial = 'termos', onFechar }: Props) {
  const [aba, setAba] = useState<Chave>(docInicial);
  const documento = DOCUMENTOS[aba];

  return (
    <Modal visible={visivel} animationType="slide" onRequestClose={onFechar}>
      <View style={styles.container}>
        <View style={styles.abas}>
          {ABAS.map((item) => (
            <TouchableOpacity
              key={item.chave}
              style={[styles.aba, aba === item.chave && styles.abaAtiva]}
              onPress={() => setAba(item.chave)}
            >
              <Text style={[styles.abaTexto, aba === item.chave && styles.abaTextoAtivo]}>
                {item.rotulo}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.conteudo}>
          <Text style={styles.titulo}>{documento.titulo}</Text>
          <Text style={styles.atualizado}>Última atualização: {ATUALIZADO_EM_LABEL}</Text>

          <Text style={styles.aviso}>
            Este é um rascunho técnico escrito para refletir como o app funciona hoje — ainda em
            revisão jurídica antes do lançamento comercial oficial do Konecta Já.
          </Text>

          {documento.secoes.map((secao) => (
            <View key={secao.titulo} style={styles.secao}>
              <Text style={styles.secaoTitulo}>{secao.titulo}</Text>
              {secao.paragrafos.map((p, i) => (
                <Text key={i} style={styles.paragrafo}>
                  {p}
                </Text>
              ))}
            </View>
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.botaoFechar} onPress={onFechar}>
          <Text style={styles.botaoFecharTexto}>Fechar</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingTop: spacing.xxl },
  abas: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: colors.bg3,
    borderRadius: radius.md,
    padding: 5,
    marginHorizontal: spacing.lg,
  },
  aba: { flex: 1, paddingVertical: 10, borderRadius: radius.sm, alignItems: 'center' },
  abaAtiva: { backgroundColor: colors.laranja },
  abaTexto: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  abaTextoAtivo: { color: '#fff' },
  scroll: { flex: 1, marginTop: spacing.lg },
  conteudo: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  titulo: { color: colors.textForte, fontSize: 22, fontWeight: '800' },
  atualizado: { color: colors.muted, fontSize: 12, marginTop: 6, marginBottom: 14 },
  aviso: {
    backgroundColor: colors.laranjaSoft,
    color: colors.laranjaEscuro,
    borderRadius: radius.sm,
    padding: 12,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 18,
  },
  secao: { marginTop: 18 },
  secaoTitulo: { color: colors.textForte, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  paragrafo: { color: colors.text, fontSize: 13, lineHeight: 19, marginBottom: 8 },
  botaoFechar: {
    margin: spacing.lg,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.bg3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  botaoFecharTexto: { color: colors.textForte, fontWeight: '700', fontSize: 14 },
});
