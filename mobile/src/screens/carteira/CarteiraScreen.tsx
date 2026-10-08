import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radius, spacing } from '@/theme/tokens';
import {
  depositar,
  meuExtrato,
  meuSaldo,
  sacar,
  TipoChavePix,
  TransacaoCarteira,
} from '@/services/carteiraService';

const ROTULOS_TIPO: Record<string, string> = {
  deposito: 'Depósito',
  pagamento_enviado: 'Pagamento de serviço',
  pagamento_recebido: 'Recebimento de serviço',
  saque: 'Saque',
  estorno: 'Estorno',
};

const TIPOS_CHAVE_PIX: { valor: TipoChavePix; rotulo: string }[] = [
  { valor: 'CPF', rotulo: 'CPF' },
  { valor: 'EMAIL', rotulo: 'E-mail' },
  { valor: 'PHONE', rotulo: 'Telefone' },
  { valor: 'EVP', rotulo: 'Chave aleatória' },
];

function formatarValor(valor: number): string {
  const sinal = valor > 0 ? '+' : '';
  return `${sinal}R$ ${valor.toFixed(2)}`;
}

export function CarteiraScreen() {
  const [saldo, setSaldo] = useState<number | null>(null);
  const [extrato, setExtrato] = useState<TransacaoCarteira[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [modal, setModal] = useState<'depositar' | 'sacar' | null>(null);
  const [valorDigitado, setValorDigitado] = useState('');
  const [chavePix, setChavePix] = useState('');
  const [tipoChavePix, setTipoChavePix] = useState<TipoChavePix>('CPF');
  const [processando, setProcessando] = useState(false);
  const [erroModal, setErroModal] = useState<string | null>(null);
  const [linkPagamento, setLinkPagamento] = useState<string | null>(null);

  async function carregar() {
    setErro(null);
    try {
      const [saldoResp, extratoResp] = await Promise.all([meuSaldo(), meuExtrato()]);
      setSaldo(saldoResp.saldo);
      setExtrato(extratoResp);
    } catch {
      setErro('Não foi possível carregar sua carteira.');
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      carregar();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  function abrirModal(tipo: 'depositar' | 'sacar') {
    setModal(tipo);
    setValorDigitado('');
    setChavePix('');
    setTipoChavePix('CPF');
    setErroModal(null);
    setLinkPagamento(null);
  }

  function fecharModal() {
    setModal(null);
  }

  async function aoConfirmarDeposito() {
    const valor = Number(valorDigitado.replace(',', '.'));
    if (!valor || valor <= 0) return setErroModal('Informe um valor válido');

    setProcessando(true);
    setErroModal(null);
    try {
      const resultado = await depositar(valor);
      setLinkPagamento(resultado.invoiceUrl);
    } catch (erro: any) {
      setErroModal(erro.response?.data?.erro || 'Não foi possível gerar o depósito.');
    } finally {
      setProcessando(false);
    }
  }

  async function aoConfirmarSaque() {
    const valor = Number(valorDigitado.replace(',', '.'));
    if (!valor || valor <= 0) return setErroModal('Informe um valor válido');
    if (!chavePix.trim()) return setErroModal('Informe sua chave Pix');

    setProcessando(true);
    setErroModal(null);
    try {
      await sacar({ valor, chavePix: chavePix.trim(), tipoChavePix });
      fecharModal();
      setCarregando(true);
      carregar();
    } catch (erro: any) {
      setErroModal(erro.response?.data?.erro || 'Não foi possível processar o saque.');
    } finally {
      setProcessando(false);
    }
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={extrato}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.lista}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() => {
              setAtualizando(true);
              carregar();
            }}
          />
        }
        ListHeaderComponent={
          <>
            <Text style={styles.titulo}>Carteira</Text>
            {erro && <Text style={styles.erro}>{erro}</Text>}

            <View style={styles.cardSaldo}>
              <Text style={styles.rotuloSaldo}>Saldo disponível</Text>
              <Text style={styles.valorSaldo}>
                {carregando ? '...' : `R$ ${Number(saldo || 0).toFixed(2)}`}
              </Text>
              <View style={styles.botoesCard}>
                <TouchableOpacity style={styles.botaoPrimario} onPress={() => abrirModal('depositar')}>
                  <Text style={styles.botaoPrimarioTexto}>Adicionar dinheiro</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.botaoSecundario} onPress={() => abrirModal('sacar')}>
                  <Text style={styles.botaoSecundarioTexto}>Sacar</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.subtitulo}>Extrato</Text>
            {carregando && <ActivityIndicator color={colors.laranja} style={{ marginTop: spacing.lg }} />}
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.itemExtrato}>
            <View>
              <Text style={styles.itemTipo}>{ROTULOS_TIPO[item.tipo] || item.tipo}</Text>
              <Text style={styles.itemData}>
                {new Date(item.criado_em).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {item.status === 'pendente' ? ' · pendente' : ''}
              </Text>
            </View>
            <Text
              style={[
                styles.itemValor,
                { color: Number(item.valor) >= 0 ? colors.green : colors.textForte },
              ]}
            >
              {formatarValor(Number(item.valor))}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          !carregando ? <Text style={styles.vazio}>Nenhuma movimentação ainda.</Text> : null
        }
      />

      <Modal visible={modal !== null} transparent animationType="fade" onRequestClose={fecharModal}>
        <View style={styles.modalFundo}>
          <View style={styles.modalCard}>
            {modal === 'depositar' && !linkPagamento && (
              <>
                <Text style={styles.modalTitulo}>Adicionar dinheiro</Text>
                <Text style={styles.modalTexto}>
                  Gera uma cobrança Pix pra você pagar — o valor entra na carteira assim que o
                  pagamento for confirmado.
                </Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Valor (R$)"
                  placeholderTextColor={colors.muted}
                  value={valorDigitado}
                  onChangeText={setValorDigitado}
                  keyboardType="decimal-pad"
                  autoFocus
                />
                {erroModal && <Text style={styles.erroModal}>{erroModal}</Text>}
                <View style={styles.modalBotoes}>
                  <TouchableOpacity style={styles.botaoSecundarioModal} onPress={fecharModal}>
                    <Text style={styles.botaoSecundarioModalTexto}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.botaoPrimarioModal}
                    onPress={aoConfirmarDeposito}
                    disabled={processando}
                  >
                    <Text style={styles.botaoPrimarioModalTexto}>
                      {processando ? 'Gerando...' : 'Gerar cobrança Pix'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {modal === 'depositar' && linkPagamento && (
              <>
                <Text style={styles.modalTitulo}>Cobrança gerada</Text>
                <Text style={styles.modalTexto}>
                  Toque no botão abaixo pra abrir a página de pagamento (Pix, cartão ou boleto).
                  Assim que o pagamento for confirmado, o valor aparece na sua carteira.
                </Text>
                <TouchableOpacity
                  style={styles.botaoPrimarioModal}
                  onPress={() => Linking.openURL(linkPagamento)}
                >
                  <Text style={styles.botaoPrimarioModalTexto}>Pagar agora</Text>
                </TouchableOpacity>
                <View style={styles.modalBotoes}>
                  <TouchableOpacity
                    style={styles.botaoSecundarioModal}
                    onPress={() => {
                      fecharModal();
                      setCarregando(true);
                      carregar();
                    }}
                  >
                    <Text style={styles.botaoSecundarioModalTexto}>Fechar</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {modal === 'sacar' && (
              <>
                <Text style={styles.modalTitulo}>Sacar</Text>
                <Text style={styles.modalTexto}>O valor vai direto pra sua chave Pix.</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Valor (R$)"
                  placeholderTextColor={colors.muted}
                  value={valorDigitado}
                  onChangeText={setValorDigitado}
                  keyboardType="decimal-pad"
                  autoFocus
                />
                <View style={styles.chaveTipos}>
                  {TIPOS_CHAVE_PIX.map((t) => (
                    <TouchableOpacity
                      key={t.valor}
                      style={[styles.chaveTipo, tipoChavePix === t.valor && styles.chaveTipoAtivo]}
                      onPress={() => setTipoChavePix(t.valor)}
                    >
                      <Text
                        style={[
                          styles.chaveTipoTexto,
                          tipoChavePix === t.valor && styles.chaveTipoTextoAtivo,
                        ]}
                      >
                        {t.rotulo}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Sua chave Pix"
                  placeholderTextColor={colors.muted}
                  value={chavePix}
                  onChangeText={setChavePix}
                  autoCapitalize="none"
                />
                {erroModal && <Text style={styles.erroModal}>{erroModal}</Text>}
                <View style={styles.modalBotoes}>
                  <TouchableOpacity style={styles.botaoSecundarioModal} onPress={fecharModal}>
                    <Text style={styles.botaoSecundarioModalTexto}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.botaoPrimarioModal}
                    onPress={aoConfirmarSaque}
                    disabled={processando}
                  >
                    <Text style={styles.botaoPrimarioModalTexto}>
                      {processando ? 'Processando...' : 'Sacar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  lista: { padding: spacing.lg, paddingBottom: spacing.xxl },
  titulo: { fontSize: 22, fontWeight: '800', color: colors.textForte, marginBottom: spacing.md },
  erro: { color: colors.red, fontSize: 13, marginBottom: spacing.sm },
  cardSaldo: {
    backgroundColor: colors.laranja,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  rotuloSaldo: { color: '#fff', opacity: 0.85, fontWeight: '600', fontSize: 13 },
  valorSaldo: { color: '#fff', fontSize: 32, fontWeight: '800', marginTop: 2 },
  botoesCard: { flexDirection: 'row', gap: 10, marginTop: spacing.lg },
  botaoPrimario: {
    flex: 1,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoPrimarioTexto: { color: colors.laranjaEscuro, fontWeight: '700', fontSize: 13.5 },
  botaoSecundario: {
    flex: 1,
    height: 44,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoSecundarioTexto: { color: '#fff', fontWeight: '700', fontSize: 13.5 },
  subtitulo: { color: colors.textForte, fontSize: 16, fontWeight: '700', marginTop: spacing.xl, marginBottom: spacing.sm },
  vazio: { color: colors.muted, textAlign: 'center', marginTop: spacing.xl, fontSize: 13 },
  itemExtrato: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  itemTipo: { color: colors.textForte, fontWeight: '700', fontSize: 13.5 },
  itemData: { color: colors.muted, fontSize: 11.5, marginTop: 2, textTransform: 'capitalize' },
  itemValor: { fontWeight: '800', fontSize: 14 },
  modalFundo: {
    flex: 1,
    backgroundColor: 'rgba(28, 25, 23, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.bg2,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  modalTitulo: { color: colors.textForte, fontSize: 18, fontWeight: '800', marginBottom: 6 },
  modalTexto: { color: colors.muted, fontSize: 13, lineHeight: 19, marginBottom: spacing.md },
  modalInput: {
    height: 46,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg3,
    color: colors.textForte,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 10,
  },
  chaveTipos: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  chaveTipo: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg3,
  },
  chaveTipoAtivo: { backgroundColor: colors.laranja, borderColor: colors.laranja },
  chaveTipoTexto: { color: colors.text, fontSize: 12, fontWeight: '600' },
  chaveTipoTextoAtivo: { color: '#fff' },
  erroModal: { color: colors.red, fontSize: 13, marginBottom: 10 },
  modalBotoes: { flexDirection: 'row', gap: 8, marginTop: 4 },
  botaoPrimarioModal: {
    flex: 1,
    height: 46,
    borderRadius: radius.sm,
    backgroundColor: colors.laranja,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoPrimarioModalTexto: { color: '#fff', fontWeight: '700', fontSize: 14 },
  botaoSecundarioModal: {
    flex: 1,
    height: 46,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoSecundarioModalTexto: { color: colors.textForte, fontWeight: '700', fontSize: 14 },
});
