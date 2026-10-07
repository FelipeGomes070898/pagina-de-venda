import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { colors, radius, spacing } from '@/theme/tokens';
import { useAuthStore } from '@/store/authStore';
import {
  Conversa,
  Mensagem,
  Proposta,
  confirmarPagamento,
  enviarEndereco,
  enviarMensagem,
  enviarProposta,
  listarConversa,
  responderProposta,
} from '@/services/chatService';
import { atualizarStatusPedido } from '@/services/marketplaceService';
import { AddressAutocompleteInput } from '@/components/common/AddressAutocompleteInput';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

const INTERVALO_ATUALIZACAO_MS = 5000;

type ItemLinhaDoTempo =
  | { tipoItem: 'mensagem'; id: string; criadoEm: string; dado: Mensagem }
  | { tipoItem: 'proposta'; id: string; criadoEm: string; dado: Proposta };

function montarLinhaDoTempo(conversa: Conversa): ItemLinhaDoTempo[] {
  const itens: ItemLinhaDoTempo[] = [
    ...conversa.mensagens.map((m) => ({
      tipoItem: 'mensagem' as const,
      id: `m-${m.id}`,
      criadoEm: m.criado_em,
      dado: m,
    })),
    ...conversa.propostas.map((p) => ({
      tipoItem: 'proposta' as const,
      id: `p-${p.id}`,
      criadoEm: p.criado_em,
      dado: p,
    })),
  ];
  return itens.sort((a, b) => a.criadoEm.localeCompare(b.criadoEm));
}

export function ChatScreen({ route, navigation }: Props) {
  const { pedidoId, prestadorNome } = route.params;
  const meuTipo = useAuthStore((s) => s.usuario?.tipo);

  const [conversa, setConversa] = useState<Conversa | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [finalizando, setFinalizando] = useState(false);

  const [mostrarFormProposta, setMostrarFormProposta] = useState(false);
  const [valorProposta, setValorProposta] = useState('');

  const [endereco, setEndereco] = useState<{ texto: string; lat?: number; lng?: number }>({
    texto: '',
  });
  const [enviandoEndereco, setEnviandoEndereco] = useState(false);
  const [confirmandoPagamento, setConfirmandoPagamento] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState<'app' | 'pix_direto' | null>(null);
  const [cancelando, setCancelando] = useState(false);

  const listaRef = useRef<FlatList>(null);

  const carregar = useCallback(async () => {
    try {
      const dados = await listarConversa(pedidoId);
      setConversa(dados);
    } catch {
      setErro('Não foi possível carregar a conversa.');
    } finally {
      setCarregando(false);
    }
  }, [pedidoId]);

  useEffect(() => {
    carregar();
    const intervalo = setInterval(carregar, INTERVALO_ATUALIZACAO_MS);
    return () => clearInterval(intervalo);
  }, [carregar]);

  async function aoEnviarMensagem() {
    if (!texto.trim()) return;
    setEnviando(true);
    try {
      await enviarMensagem(pedidoId, texto.trim());
      setTexto('');
      await carregar();
      listaRef.current?.scrollToEnd({ animated: true });
    } catch {
      setErro('Não foi possível enviar a mensagem.');
    } finally {
      setEnviando(false);
    }
  }

  async function aoEnviarProposta() {
    const valor = Number(valorProposta.replace(',', '.'));
    if (!valor || valor <= 0) return;
    setEnviando(true);
    try {
      await enviarProposta(pedidoId, { valor });
      setValorProposta('');
      setMostrarFormProposta(false);
      await carregar();
    } catch {
      setErro('Não foi possível enviar a proposta.');
    } finally {
      setEnviando(false);
    }
  }

  async function aoResponderProposta(proposta: Proposta, acao: 'aceitar' | 'recusar') {
    try {
      await responderProposta(pedidoId, proposta.id, acao);
      await carregar();
    } catch {
      setErro('Não foi possível responder a proposta.');
    }
  }

  async function aoEnviarEndereco() {
    if (!endereco.texto.trim()) return;
    setEnviandoEndereco(true);
    try {
      await enviarEndereco(pedidoId, {
        endereco: endereco.texto.trim(),
        lat: endereco.lat,
        lng: endereco.lng,
      });
      await carregar();
    } catch {
      setErro('Não foi possível enviar o endereço.');
    } finally {
      setEnviandoEndereco(false);
    }
  }

  async function aoMarcarConcluido() {
    setFinalizando(true);
    try {
      await atualizarStatusPedido(pedidoId, 'concluido');
      await carregar();
    } catch {
      setErro('Não foi possível marcar o serviço como concluído.');
    } finally {
      setFinalizando(false);
    }
  }

  async function aoConfirmarPagamento(quando: 'antecipado' | 'apos') {
    setConfirmandoPagamento(true);
    try {
      await confirmarPagamento(pedidoId, { quando, forma: formaPagamento });
      await carregar();
    } catch {
      setErro('Não foi possível confirmar o pagamento.');
    } finally {
      setConfirmandoPagamento(false);
    }
  }

  function aoCancelarPedido() {
    Alert.alert('Cancelar pedido', 'Tem certeza que deseja cancelar este pedido? Essa ação não pode ser desfeita.', [
      { text: 'Voltar', style: 'cancel' },
      {
        text: 'Cancelar pedido',
        style: 'destructive',
        onPress: async () => {
          setCancelando(true);
          try {
            await atualizarStatusPedido(pedidoId, 'cancelado');
            await carregar();
          } catch {
            setErro('Não foi possível cancelar o pedido.');
          } finally {
            setCancelando(false);
          }
        },
      },
    ]);
  }

  if (carregando || !conversa) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator color={colors.laranja} />
      </View>
    );
  }

  const pedidoFechado = conversa.pedido.status === 'andamento';
  const pedidoConcluido = conversa.pedido.status === 'concluido';
  const pedidoCancelado = conversa.pedido.status === 'cancelado';
  const podeCancelar = !pedidoConcluido && !pedidoCancelado;
  const podeReceberEndereco = meuTipo === 'cliente' && pedidoFechado && !conversa.pedido.endereco;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitulo}>{prestadorNome}</Text>
        <Text style={styles.headerStatus}>{rotuloStatus(conversa.pedido.status)}</Text>
      </View>

      <FlatList
        ref={listaRef}
        data={montarLinhaDoTempo(conversa)}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.lista}
        renderItem={({ item }) =>
          item.tipoItem === 'mensagem' ? (
            <BalaoMensagem mensagem={item.dado} meuTipo={meuTipo} />
          ) : (
            <CartaoProposta
              proposta={item.dado}
              meuTipo={meuTipo}
              podeResponder={!pedidoConcluido && !pedidoCancelado}
              onResponder={(acao) => aoResponderProposta(item.dado, acao)}
            />
          )
        }
      />

      {erro && <Text style={styles.erro}>{erro}</Text>}

      {podeReceberEndereco && (
        <View style={styles.enderecoWrapper}>
          <Text style={styles.enderecoRotulo}>Pedido fechado! Envie o endereço:</Text>
          <View style={styles.linhaEnvio}>
            <AddressAutocompleteInput
              placeholder="Rua, número, bairro..."
              value={endereco.texto}
              onChangeText={(texto) => setEndereco({ texto })}
              onSelecionar={(dados) =>
                setEndereco({ texto: dados.enderecoCompleto, lat: dados.lat, lng: dados.lng })
              }
              wrapperStyle={styles.enderecoAutocompleteWrapper}
              inputStyle={styles.inputFlex}
            />
            <TouchableOpacity
              style={styles.botaoEnviar}
              onPress={aoEnviarEndereco}
              disabled={enviandoEndereco}
            >
              <Text style={styles.botaoEnviarTexto}>{enviandoEndereco ? '...' : 'Enviar'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {conversa.pedido.endereco && (
        <Text style={styles.enderecoConfirmado}>📍 Endereço enviado: {conversa.pedido.endereco}</Text>
      )}

      {meuTipo === 'cliente' && (pedidoFechado || pedidoConcluido) && (
        <View style={styles.enderecoWrapper}>
          {conversa.pedido.pagamento_confirmado_em ? (
            <Text style={styles.enderecoConfirmado}>
              💳 Pagamento confirmado por você (
              {conversa.pedido.pagamento_forma === 'app' ? 'pelo app' : 'Pix direto pro prestador'},{' '}
              {conversa.pedido.pagamento_quando === 'antecipado' ? 'antes do serviço' : 'depois do serviço'})
            </Text>
          ) : !formaPagamento ? (
            <>
              <Text style={styles.enderecoRotulo}>Como você pagou (ou vai pagar) o prestador?</Text>
              <View style={styles.linhaEnvio}>
                <TouchableOpacity style={styles.botaoPagamento} onPress={() => setFormaPagamento('pix_direto')}>
                  <Text style={styles.botaoPagamentoTexto}>Pix direto</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.botaoPagamento} onPress={() => setFormaPagamento('app')}>
                  <Text style={styles.botaoPagamentoTexto}>Pelo app</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.enderecoRotulo}>Pagou antes do serviço ou depois?</Text>
              <View style={styles.linhaEnvio}>
                <TouchableOpacity
                  style={styles.botaoPagamento}
                  onPress={() => aoConfirmarPagamento('antecipado')}
                  disabled={confirmandoPagamento}
                >
                  <Text style={styles.botaoPagamentoTexto}>Paguei antes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.botaoPagamento}
                  onPress={() => aoConfirmarPagamento('apos')}
                  disabled={confirmandoPagamento}
                >
                  <Text style={styles.botaoPagamentoTexto}>Paguei depois</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => setFormaPagamento(null)}>
                <Text style={styles.botaoVoltarPagamento}>← Voltar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {pedidoFechado && (
        <TouchableOpacity
          style={styles.botaoConcluir}
          onPress={aoMarcarConcluido}
          disabled={finalizando}
        >
          <Text style={styles.botaoConcluirTexto}>
            {finalizando ? 'Marcando...' : 'Marcar serviço como concluído'}
          </Text>
        </TouchableOpacity>
      )}

      {pedidoConcluido && meuTipo === 'cliente' && (
        <TouchableOpacity
          style={styles.botaoConcluir}
          onPress={() => navigation.navigate('Review', { pedidoId, prestadorNome })}
        >
          <Text style={styles.botaoConcluirTexto}>⭐ Avaliar prestador</Text>
        </TouchableOpacity>
      )}
      {pedidoConcluido && meuTipo === 'prestador' && (
        <TouchableOpacity
          style={styles.botaoConcluir}
          onPress={() => navigation.navigate('ReviewCliente', { pedidoId, clienteNome: prestadorNome })}
        >
          <Text style={styles.botaoConcluirTexto}>⭐ Avaliar cliente</Text>
        </TouchableOpacity>
      )}

      {pedidoCancelado && <Text style={styles.pedidoCanceladoAviso}>Este pedido foi cancelado.</Text>}

      {podeCancelar && (
        <TouchableOpacity style={styles.botaoCancelar} onPress={aoCancelarPedido} disabled={cancelando}>
          <Text style={styles.botaoCancelarTexto}>{cancelando ? 'Cancelando...' : 'Cancelar pedido'}</Text>
        </TouchableOpacity>
      )}

      {!pedidoConcluido && !pedidoCancelado && mostrarFormProposta && (
        <View style={styles.linhaEnvio}>
          <TextInput
            style={styles.inputFlex}
            placeholder="Valor da proposta (R$)"
            placeholderTextColor={colors.muted}
            value={valorProposta}
            onChangeText={setValorProposta}
            keyboardType="decimal-pad"
          />
          <TouchableOpacity style={styles.botaoEnviar} onPress={aoEnviarProposta} disabled={enviando}>
            <Text style={styles.botaoEnviarTexto}>Propor</Text>
          </TouchableOpacity>
        </View>
      )}

      {!pedidoCancelado && (
        <View style={styles.rodape}>
          <TouchableOpacity
            style={styles.botaoProposta}
            onPress={() => setMostrarFormProposta((v) => !v)}
          >
            <Text style={styles.botaoPropostaTexto}>R$</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.inputMensagem}
            placeholder="Escreva uma mensagem..."
            placeholderTextColor={colors.muted}
            value={texto}
            onChangeText={setTexto}
          />
          <TouchableOpacity style={styles.botaoEnviar} onPress={aoEnviarMensagem} disabled={enviando}>
            <Text style={styles.botaoEnviarTexto}>Enviar</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function BalaoMensagem({
  mensagem,
  meuTipo,
}: {
  mensagem: Mensagem;
  meuTipo?: string;
}) {
  if (mensagem.remetente_tipo === 'sistema') {
    return <Text style={styles.mensagemSistema}>{mensagem.conteudo}</Text>;
  }

  const minhaMensagem = mensagem.remetente_tipo === meuTipo;
  return (
    <View style={[styles.balaoWrapper, minhaMensagem && styles.balaoWrapperMeu]}>
      <View style={[styles.balao, minhaMensagem && styles.balaoMeu]}>
        <Text style={[styles.balaoTexto, minhaMensagem && styles.balaoTextoMeu]}>
          {mensagem.conteudo}
        </Text>
      </View>
    </View>
  );
}

function CartaoProposta({
  proposta,
  meuTipo,
  podeResponder,
  onResponder,
}: {
  proposta: Proposta;
  meuTipo?: string;
  podeResponder: boolean;
  onResponder: (acao: 'aceitar' | 'recusar') => void;
}) {
  const minhaProposta = proposta.remetente_tipo === meuTipo;

  return (
    <View style={styles.cartaoProposta}>
      <Text style={styles.cartaoPropostaValor}>R$ {Number(proposta.valor).toFixed(2)}</Text>
      {proposta.status === 'pendente' && !minhaProposta && podeResponder && (
        <View style={styles.cartaoPropostaAcoes}>
          <TouchableOpacity style={styles.botaoAceitar} onPress={() => onResponder('aceitar')}>
            <Text style={styles.botaoAceitarTexto}>Aceitar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.botaoRecusar} onPress={() => onResponder('recusar')}>
            <Text style={styles.botaoRecusarTexto}>Recusar</Text>
          </TouchableOpacity>
        </View>
      )}
      {proposta.status === 'pendente' && (minhaProposta || !podeResponder) && (
        <Text style={styles.cartaoPropostaStatus}>
          {podeResponder ? 'Aguardando resposta...' : 'Pedido já finalizado'}
        </Text>
      )}
      {proposta.status !== 'pendente' && (
        <Text style={styles.cartaoPropostaStatus}>
          {proposta.status === 'aceita' ? 'Aceita ✅' : 'Recusada'}
        </Text>
      )}
    </View>
  );
}

function rotuloStatus(status: string): string {
  const rotulos: Record<string, string> = {
    pendente: 'Negociando',
    andamento: 'Fechado — em andamento',
    concluido: 'Concluído',
    cancelado: 'Cancelado',
  };
  return rotulos[status] || status;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  centro: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  header: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitulo: { color: colors.textForte, fontSize: 16, fontWeight: '700' },
  headerStatus: { color: colors.muted, fontSize: 12, marginTop: 2 },
  lista: { padding: spacing.lg },
  mensagemSistema: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
    marginVertical: spacing.sm,
  },
  balaoWrapper: { alignItems: 'flex-start', marginBottom: spacing.sm },
  balaoWrapperMeu: { alignItems: 'flex-end' },
  balao: {
    maxWidth: '80%',
    backgroundColor: colors.bg2,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  balaoMeu: { backgroundColor: colors.laranja, borderColor: colors.laranja },
  balaoTexto: { color: colors.textForte, fontSize: 14 },
  balaoTextoMeu: { color: '#fff' },
  cartaoProposta: {
    alignSelf: 'center',
    backgroundColor: colors.bg2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.laranja,
    padding: spacing.md,
    marginBottom: spacing.sm,
    minWidth: 200,
    alignItems: 'center',
  },
  cartaoPropostaValor: { color: colors.laranja, fontWeight: '800', fontSize: 18 },
  cartaoPropostaStatus: { color: colors.muted, fontSize: 12, marginTop: 4 },
  cartaoPropostaAcoes: { flexDirection: 'row', gap: 8, marginTop: spacing.sm },
  botaoAceitar: {
    backgroundColor: colors.green,
    borderRadius: radius.sm,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  botaoAceitarTexto: { color: '#0a0a0a', fontWeight: '700', fontSize: 12 },
  botaoRecusar: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.red,
    borderRadius: radius.sm,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  botaoRecusarTexto: { color: colors.red, fontWeight: '700', fontSize: 12 },
  erro: { color: colors.red, fontSize: 12, textAlign: 'center', marginBottom: spacing.sm },
  enderecoWrapper: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  enderecoRotulo: { color: colors.green, fontSize: 12, fontWeight: '600', marginBottom: 6 },
  enderecoConfirmado: {
    color: colors.muted,
    fontSize: 12,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    textAlign: 'center',
  },
  botaoConcluir: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.green,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  botaoConcluirTexto: { color: colors.green, fontWeight: '700', fontSize: 13 },
  botaoCancelar: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.red,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  botaoCancelarTexto: { color: colors.red, fontWeight: '700', fontSize: 13 },
  pedidoCanceladoAviso: {
    color: colors.red,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  botaoPagamento: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.laranja,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  botaoPagamentoTexto: { color: colors.laranja, fontWeight: '700', fontSize: 12 },
  botaoVoltarPagamento: { color: colors.muted, fontSize: 11, paddingVertical: 4 },
  linhaEnvio: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: 8,
  },
  enderecoAutocompleteWrapper: { flex: 1, marginBottom: 0 },
  inputFlex: {
    flex: 1,
    height: 44,
    backgroundColor: colors.bg2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    color: colors.textForte,
  },
  rodape: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  botaoProposta: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.laranja,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoPropostaTexto: { color: colors.laranja, fontWeight: '800', fontSize: 12 },
  inputMensagem: {
    flex: 1,
    height: 44,
    backgroundColor: colors.bg2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    color: colors.textForte,
  },
  botaoEnviar: {
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.laranja,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  botaoEnviarTexto: { color: colors.textForte, fontWeight: '700', fontSize: 12 },
});
