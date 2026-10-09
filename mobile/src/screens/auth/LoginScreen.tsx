import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
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
import { PasswordInput } from '@/components/common/PasswordInput';
import { colors, radius, sombra, spacing } from '@/theme/tokens';
import { useAuthStore } from '@/store/authStore';
import { TipoIdentificador, validarIdentificador } from '@/utils/validators';
import { mascararCPF, mascararTelefoneBR, somenteDigitos } from '@/utils/masks';
import { loginComGoogle } from '@/services/authService';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const ABAS: { tipo: TipoIdentificador; chaveLabel: string; chavePlaceholder: string }[] = [
  { tipo: 'telefone', chaveLabel: 'login.tab_phone', chavePlaceholder: 'login.phone_placeholder' },
  { tipo: 'email', chaveLabel: 'login.tab_email', chavePlaceholder: 'login.email_placeholder' },
  { tipo: 'cpf', chaveLabel: 'login.tab_cpf', chavePlaceholder: 'login.cpf_placeholder' },
];

export function LoginScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { login, lembrarLogin, setLembrarLogin, carregando, definirSessao } = useAuthStore();

  const [aba, setAba] = useState<TipoIdentificador>('telefone');
  const [identificador, setIdentificador] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const abaAtual = ABAS.find((a) => a.tipo === aba)!;

  function trocarAba(tipo: TipoIdentificador) {
    setAba(tipo);
    setIdentificador('');
    setErro(null);
  }

  function aoDigitarIdentificador(valor: string) {
    if (aba === 'telefone') setIdentificador(mascararTelefoneBR(valor));
    else if (aba === 'cpf') setIdentificador(mascararCPF(valor));
    else setIdentificador(valor);
  }

  async function aoSubmeter() {
    setErro(null);

    if (!validarIdentificador(aba, identificador)) {
      setErro(t('login.error_invalid_identifier'));
      return;
    }
    if (!senha) {
      setErro(t('login.error_password_required'));
      return;
    }

    const valorLimpo = aba === 'email' ? identificador.trim() : somenteDigitos(identificador);

    try {
      // Sem navigation.replace aqui: o login grava o token no estado
      // global, e é essa mudança que faz o AppNavigator trocar
      // sozinho pra pilha autenticada (ele reage ao estado, não dá pra
      // navegar direto pra uma tela que só existe do outro lado).
      await login({ identificador: valorLimpo, tipoIdentificador: aba, senha });
    } catch {
      setErro(t('login.error_login_failed'));
    }
  }

  async function aoReceberIdTokenGoogle(idToken: string) {
    setErro(null);
    try {
      const resultado = await loginComGoogle(idToken);
      if ('novoCadastro' in resultado && resultado.novoCadastro) {
        navigation.navigate('Register', { perfilGoogle: resultado.perfilGoogle });
      } else {
        definirSessao(resultado);
      }
    } catch {
      setErro('Não foi possível entrar com o Google.');
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.marca}>{t('login.title')}</Text>
          <Text style={styles.subtitulo}>{t('login.subtitle')}</Text>

          <View style={styles.abas}>
            {ABAS.map((item) => (
              <TouchableOpacity
                key={item.tipo}
                style={[styles.aba, aba === item.tipo && styles.abaAtiva]}
                onPress={() => trocarAba(item.tipo)}
              >
                <Text style={[styles.abaTexto, aba === item.tipo && styles.abaTextoAtivo]}>
                  {t(item.chaveLabel)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder={t(abaAtual.chavePlaceholder)}
            placeholderTextColor={colors.muted}
            value={identificador}
            onChangeText={aoDigitarIdentificador}
            keyboardType={aba === 'email' ? 'email-address' : 'number-pad'}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <PasswordInput
            placeholder={t('login.password_placeholder')}
            value={senha}
            onChangeText={setSenha}
          />

          {erro && <Text style={styles.erro}>{erro}</Text>}

          <TouchableOpacity
            style={styles.esqueciSenha}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.link}>{t('login.forgot_password')}</Text>
          </TouchableOpacity>

          <View style={styles.lembrarWrapper}>
            <Switch
              value={lembrarLogin}
              onValueChange={setLembrarLogin}
              trackColor={{ true: colors.laranja, false: colors.border }}
              thumbColor={colors.textForte}
            />
            <Text style={styles.lembrarTexto}>{t('login.remember_me')}</Text>
          </View>

          <PrimaryButton label={t('login.submit')} onPress={aoSubmeter} loading={carregando} />

          <GoogleLoginButton onIdToken={aoReceberIdTokenGoogle} />
        </View>

        <View style={styles.rodape}>
          <Text style={styles.rodapeTexto}>{t('login.no_account')} </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>{t('login.create_account')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, padding: spacing.lg, justifyContent: 'center', alignItems: 'center' },
  marca: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.laranjaEscuro,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitulo: { fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 2, marginBottom: spacing.md },
  card: {
    width: '100%',
    backgroundColor: colors.bg2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    ...sombra,
  },
  abas: {
    flexDirection: 'row',
    backgroundColor: colors.bg3,
    borderRadius: radius.md,
    padding: 4,
    width: '100%',
    marginBottom: spacing.md,
  },
  aba: { flex: 1, paddingVertical: 10, borderRadius: radius.sm, alignItems: 'center' },
  abaAtiva: { backgroundColor: colors.laranja },
  abaTexto: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  abaTextoAtivo: { color: '#fff' },
  input: {
    width: '100%',
    height: 52,
    backgroundColor: colors.bg3,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    color: colors.textForte,
    marginBottom: spacing.md,
  },
  erro: { color: colors.red, fontSize: 13, alignSelf: 'flex-start', marginBottom: spacing.sm },
  esqueciSenha: { width: '100%', alignItems: 'flex-end', marginBottom: spacing.sm },
  lembrarWrapper: { width: '100%', flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  lembrarTexto: { color: colors.text, fontSize: 13, marginLeft: spacing.xs },
  link: { color: colors.azul, fontSize: 13, fontWeight: '600' },
  rodape: { flexDirection: 'row', marginTop: spacing.lg },
  rodapeTexto: { color: colors.muted, fontSize: 13 },
});
