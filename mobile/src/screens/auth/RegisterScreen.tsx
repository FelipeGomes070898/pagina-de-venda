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
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { GoogleLoginButton } from '@/components/common/GoogleLoginButton';
import { AddressAutocompleteInput } from '@/components/common/AddressAutocompleteInput';
import { colors, radius, spacing } from '@/theme/tokens';
import { useAuthStore } from '@/store/authStore';
import { useCategoryStore } from '@/store/categoryStore';
import { TipoConta, ModeloCobranca, loginComGoogle } from '@/services/authService';
import { EnderecoDetalhado } from '@/services/mapsService';
import { validarCPF, validarEmail, validarTelefoneBR } from '@/utils/validators';
import { mascararCPF, mascararTelefoneBR, somenteDigitos } from '@/utils/masks';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export function RegisterScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { cadastrar, carregando, definirSessao } = useAuthStore();
  const categorias = useCategoryStore((s) => s.categorias);
  const perfilGoogle = route.params?.perfilGoogle;

  const [tipo, setTipo] = useState<TipoConta>('cliente');
  const [nome, setNome] = useState(perfilGoogle?.nome || '');
  const [email, setEmail] = useState(perfilGoogle?.email || '');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  const [endereco, setEndereco] = useState<{ texto: string } & Partial<EnderecoDetalhado>>({
    texto: '',
  });
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [segmento, setSegmento] = useState<string | null>(null);
  const [valorServico, setValorServico] = useState('');
  const [modeloCobranca, setModeloCobranca] = useState<ModeloCobranca>('percentual');
  const [erro, setErro] = useState<string | null>(null);

  async function aoSubmeter() {
    setErro(null);

    if (!nome.trim()) return setErro(t('register.error_name_required'));
    if (!validarEmail(email)) return setErro(t('register.error_email_invalid'));
    if (!validarTelefoneBR(telefone)) return setErro(t('register.error_phone_invalid'));
    if (!validarCPF(cpf)) return setErro(t('register.error_cpf_invalid'));
    if (senha.length < 6) return setErro(t('register.error_password_short'));
    if (senha !== confirmarSenha) return setErro(t('register.error_password_mismatch'));
    if (tipo === 'prestador' && !segmento) return setErro(t('register.error_segment_required'));

    try {
      await cadastrar({
        tipo,
        nome: nome.trim(),
        email: email.trim(),
        telefone: somenteDigitos(telefone),
        cpf: somenteDigitos(cpf),
        senha,
        cidade: endereco.cidade || endereco.texto.trim() || undefined,
        estado: endereco.estado || undefined,
        lat: endereco.lat,
        lng: endereco.lng,
        segmento: tipo === 'prestador' ? segmento ?? undefined : undefined,
        valorServico:
          tipo === 'prestador' && valorServico ? Number(valorServico.replace(',', '.')) : undefined,
        modeloCobranca: tipo === 'prestador' ? modeloCobranca : undefined,
        googleId: perfilGoogle?.googleId,
      });
      navigation.replace('Home');
    } catch {
      setErro(t('register.error_register_failed'));
    }
  }

  async function aoReceberIdTokenGoogle(idToken: string) {
    setErro(null);
    try {
      const resultado = await loginComGoogle(idToken);
      if ('novoCadastro' in resultado && resultado.novoCadastro) {
        setNome(resultado.perfilGoogle.nome || '');
        setEmail(resultado.perfilGoogle.email || '');
        navigation.setParams({ perfilGoogle: resultado.perfilGoogle });
      } else {
        definirSessao(resultado);
        navigation.replace('Home');
      }
    } catch {
      setErro('Não foi possível continuar com o Google.');
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.titulo}>{t('register.title')}</Text>
        <Text style={styles.subtitulo}>{t('register.subtitle')}</Text>

        {perfilGoogle && (
          <Text style={styles.avisoGoogle}>
            Continuando com a conta Google de {perfilGoogle.email}. Falta só completar os dados
            abaixo (exigidos para o cadastro nacional).
          </Text>
        )}

        <View style={styles.tipoWrapper}>
          <TouchableOpacity
            style={[styles.tipoBotao, tipo === 'cliente' && styles.tipoBotaoAtivo]}
            onPress={() => setTipo('cliente')}
          >
            <Text style={[styles.tipoTexto, tipo === 'cliente' && styles.tipoTextoAtivo]}>
              {t('register.type_client')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tipoBotao, tipo === 'prestador' && styles.tipoBotaoAtivo]}
            onPress={() => setTipo('prestador')}
          >
            <Text style={[styles.tipoTexto, tipo === 'prestador' && styles.tipoTextoAtivo]}>
              {t('register.type_provider')}
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder={t('register.name_placeholder')}
          placeholderTextColor={colors.muted}
          value={nome}
          onChangeText={setNome}
          editable={!perfilGoogle}
        />
        <TextInput
          style={styles.input}
          placeholder={t('register.email_placeholder')}
          placeholderTextColor={colors.muted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!perfilGoogle}
        />
        <TextInput
          style={styles.input}
          placeholder={t('register.phone_placeholder')}
          placeholderTextColor={colors.muted}
          value={telefone}
          onChangeText={(v) => setTelefone(mascararTelefoneBR(v))}
          keyboardType="number-pad"
        />
        <TextInput
          style={styles.input}
          placeholder={t('register.cpf_placeholder')}
          placeholderTextColor={colors.muted}
          value={cpf}
          onChangeText={(v) => setCpf(mascararCPF(v))}
          keyboardType="number-pad"
        />
        <AddressAutocompleteInput
          placeholder={t('register.city_placeholder')}
          value={endereco.texto}
          onChangeText={(texto) => setEndereco({ texto })}
          onSelecionar={(dados) => setEndereco({ texto: dados.enderecoCompleto, ...dados })}
        />
        <TextInput
          style={styles.input}
          placeholder={t('register.password_placeholder')}
          placeholderTextColor={colors.muted}
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder={t('register.confirm_password_placeholder')}
          placeholderTextColor={colors.muted}
          value={confirmarSenha}
          onChangeText={setConfirmarSenha}
          secureTextEntry
        />

        {tipo === 'prestador' && (
          <>
            <Text style={styles.rotulo}>{t('register.segment_label')}</Text>
            <View style={styles.categorias}>
              {categorias.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.chip, segmento === cat.nome && styles.chipAtivo]}
                  onPress={() => setSegmento(cat.nome)}
                >
                  <Text style={styles.chipTexto}>
                    {cat.icone} {cat.nome}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder={t('register.price_placeholder')}
              placeholderTextColor={colors.muted}
              value={valorServico}
              onChangeText={setValorServico}
              keyboardType="decimal-pad"
            />

            <Text style={styles.rotulo}>{t('register.billing_label')}</Text>
            <View style={styles.tipoWrapper}>
              <TouchableOpacity
                style={[styles.tipoBotao, modeloCobranca === 'percentual' && styles.tipoBotaoAtivo]}
                onPress={() => setModeloCobranca('percentual')}
              >
                <Text
                  style={[
                    styles.tipoTexto,
                    modeloCobranca === 'percentual' && styles.tipoTextoAtivo,
                  ]}
                >
                  {t('register.billing_percent')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tipoBotao, modeloCobranca === 'fixo_mensal' && styles.tipoBotaoAtivo]}
                onPress={() => setModeloCobranca('fixo_mensal')}
              >
                <Text
                  style={[
                    styles.tipoTexto,
                    modeloCobranca === 'fixo_mensal' && styles.tipoTextoAtivo,
                  ]}
                >
                  {t('register.billing_fixed')}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {erro && <Text style={styles.erro}>{erro}</Text>}

        <PrimaryButton label={t('register.submit')} onPress={aoSubmeter} loading={carregando} />

        {!perfilGoogle && <GoogleLoginButton onIdToken={aoReceberIdTokenGoogle} />}

        <View style={styles.rodape}>
          <Text style={styles.rodapeTexto}>{t('register.already_account')} </Text>
          <TouchableOpacity onPress={() => navigation.replace('Login')}>
            <Text style={styles.link}>{t('register.do_login')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, padding: spacing.xl, paddingTop: spacing.xxl },
  titulo: { fontSize: 24, fontWeight: '800', color: colors.textForte },
  subtitulo: { fontSize: 14, color: colors.muted, marginBottom: spacing.lg },
  avisoGoogle: {
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    color: colors.text,
    fontSize: 12,
    marginBottom: spacing.md,
  },
  tipoWrapper: {
    flexDirection: 'row',
    backgroundColor: colors.bg2,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.md,
  },
  tipoBotao: { flex: 1, paddingVertical: 10, borderRadius: radius.sm, alignItems: 'center' },
  tipoBotaoAtivo: { backgroundColor: colors.roxo },
  tipoTexto: { color: colors.muted, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  tipoTextoAtivo: { color: colors.textForte },
  input: {
    width: '100%',
    height: 52,
    backgroundColor: colors.bg2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    color: colors.textForte,
    marginBottom: spacing.md,
  },
  rotulo: { color: colors.text, fontSize: 13, fontWeight: '600', marginBottom: spacing.sm },
  categorias: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipAtivo: { backgroundColor: colors.roxo, borderColor: colors.roxo },
  chipTexto: { color: colors.text, fontSize: 12 },
  erro: { color: colors.red, fontSize: 13, marginBottom: spacing.sm },
  rodape: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  rodapeTexto: { color: colors.muted, fontSize: 13 },
  link: { color: colors.laranja, fontSize: 13, fontWeight: '600' },
});
