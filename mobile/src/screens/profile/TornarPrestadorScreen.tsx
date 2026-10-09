import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { colors, radius, spacing } from '@/theme/tokens';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SubPaginaHeader } from '@/components/common/SubPaginaHeader';
import { useCategoryStore } from '@/store/categoryStore';
import { useAuthStore } from '@/store/authStore';
import { ModeloCobranca, tornarPrestador } from '@/services/authService';

type Props = NativeStackScreenProps<RootStackParamList, 'TornarPrestador'>;

// Cliente que também quer trabalhar: não cria conta nova nem pede
// senha de novo — reaproveita nome/e-mail/telefone/CPF/senha de quem
// já é cliente. Só pergunta o que é específico de ser prestador.
// Depois de enviar, a sessão já entra no "modo prestador".
export function TornarPrestadorScreen({ navigation }: Props) {
  const categorias = useCategoryStore((s) => s.categorias);
  const definirSessao = useAuthStore((s) => s.definirSessao);

  const [segmento, setSegmento] = useState<string | null>(null);
  const [valorServico, setValorServico] = useState('');
  const [modeloCobranca, setModeloCobranca] = useState<ModeloCobranca>('percentual');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function aoEnviar() {
    if (!segmento) return setErro('Informe o serviço que você vai oferecer');

    setEnviando(true);
    setErro(null);
    try {
      const { token, usuario } = await tornarPrestador({
        segmento,
        valorServico: valorServico ? Number(valorServico.replace(',', '.')) : undefined,
        modeloCobranca,
      });
      definirSessao({ token, usuario });
      navigation.goBack();
    } catch (erro: any) {
      setErro(erro.response?.data?.erro || 'Não foi possível ativar seu perfil de prestador agora.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SubPaginaHeader titulo="Quero também trabalhar" />

      <ScrollView contentContainerStyle={styles.corpo}>
        <Text style={styles.ajuda}>
          Seus dados de cadastro (nome, e-mail, telefone, CPF) são reaproveitados — você não cria
          uma conta nova nem precisa de outra senha. Só falta dizer o que você vai oferecer.
        </Text>

        <Text style={styles.rotulo}>O que você vai oferecer</Text>
        <View style={styles.categorias}>
          {categorias.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.chip, segmento === cat.nome && styles.chipAtivo]}
              onPress={() => setSegmento(cat.nome)}
            >
              <Text style={[styles.chipTexto, segmento === cat.nome && styles.chipTextoAtivo]}>
                {cat.icone ? `${cat.icone} ` : ''}
                {cat.nome}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.rotulo}>Valor do seu serviço (R$, opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Negociável no chat"
          placeholderTextColor={colors.muted}
          value={valorServico}
          onChangeText={setValorServico}
          keyboardType="decimal-pad"
        />

        <Text style={styles.rotulo}>Como prefere pagar a taxa da plataforma?</Text>
        <View style={styles.abas}>
          <TouchableOpacity
            style={[styles.aba, modeloCobranca === 'percentual' && styles.abaAtiva]}
            onPress={() => setModeloCobranca('percentual')}
          >
            <Text style={[styles.abaTexto, modeloCobranca === 'percentual' && styles.abaTextoAtiva]}>
              5% por serviço concluído
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.aba, modeloCobranca === 'fixo_mensal' && styles.abaAtiva]}
            onPress={() => setModeloCobranca('fixo_mensal')}
          >
            <Text style={[styles.abaTexto, modeloCobranca === 'fixo_mensal' && styles.abaTextoAtiva]}>
              R$ 25,00 fixo por mês
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.explicacao}>
          {modeloCobranca === 'percentual'
            ? 'Você não paga nada enquanto não trabalha. A cada serviço concluído, cobramos 5% do valor combinado.'
            : 'Cobramos R$ 25,00 uma vez por mês, independente de quantos serviços você fizer — compensa se você trabalha bastante.'}
        </Text>

        {erro && <Text style={styles.erro}>{erro}</Text>}

        <PrimaryButton
          label={enviando ? 'Ativando...' : 'Começar a trabalhar'}
          onPress={aoEnviar}
          loading={enviando}
          style={styles.botao}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  corpo: { padding: spacing.lg, paddingBottom: spacing.xxl },
  ajuda: { color: colors.muted, fontSize: 12.5, lineHeight: 18, marginBottom: spacing.lg },
  rotulo: { color: colors.textForte, fontSize: 13, fontWeight: '700', marginBottom: spacing.sm, marginTop: spacing.sm },
  categorias: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipAtivo: { backgroundColor: colors.laranja, borderColor: colors.laranja },
  chipTexto: { color: colors.text, fontSize: 12, fontWeight: '600' },
  chipTextoAtivo: { color: '#fff' },
  input: {
    height: 48,
    backgroundColor: colors.bg2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    color: colors.textForte,
  },
  abas: { flexDirection: 'row', gap: 8 },
  aba: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg2,
    alignItems: 'center',
  },
  abaAtiva: { backgroundColor: colors.laranja, borderColor: colors.laranja },
  abaTexto: { color: colors.text, fontSize: 12.5, fontWeight: '700', textAlign: 'center' },
  abaTextoAtiva: { color: '#fff' },
  explicacao: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: spacing.xs },
  erro: { color: colors.red, fontSize: 13, marginTop: spacing.md },
  botao: { marginTop: spacing.lg },
});
