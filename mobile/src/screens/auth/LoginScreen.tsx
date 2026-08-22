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
import { VexoLogo } from '@/components/common/VexoLogo';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { colors, radius, spacing } from '@/theme/tokens';
import { useAuthStore } from '@/store/authStore';
import { TipoIdentificador, validarIdentificador } from '@/utils/validators';
import { mascararCPF, mascararTelefoneBR, somenteDigitos } from '@/utils/masks';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const ABAS: { tipo: TipoIdentificador; chaveLabel: string; chavePlaceholder: string }[] = [
  { tipo: 'telefone', chaveLabel: 'login.tab_phone', chavePlaceholder: 'login.phone_placeholder' },
  { tipo: 'email', chaveLabel: 'login.tab_email', chavePlaceholder: 'login.email_placeholder' },
  { tipo: 'cpf', chaveLabel: 'login.tab_cpf', chavePlaceholder: 'login.cpf_placeholder' },
];

export function LoginScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { login, lembrarLogin, setLembrarLogin, carregando } = useAuthStore();

  const [aba, setAba] = useState<TipoIdentificador>('telefone');
  const [identificador, setIdentificador] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
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
      await login({ identificador: valorLimpo, tipoIdentificador: aba, senha });
      navigation.replace('Home');
    } catch {
      setErro(t('login.error_login_failed'));
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <VexoLogo size="sm" />
        <Text style={styles.titulo}>{t('login.title')}</Text>
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

        <View style={styles.senhaWrapper}>
          <TextInput
            style={styles.senhaInput}
            placeholder={t('login.password_placeholder')}
            placeholderTextColor={colors.muted}
            value={senha}
            onChangeText={setSenha}
            secureTextEntry={!mostrarSenha}
          />
          <TouchableOpacity onPress={() => setMostrarSenha((v) => !v)}>
            <Text style={styles.senhaToggle}>{mostrarSenha ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        {erro && <Text style={styles.erro}>{erro}</Text>}

        <View style={styles.linhaOpcoes}>
          <View style={styles.lembrarWrapper}>
            <Switch
              value={lembrarLogin}
              onValueChange={setLembrarLogin}
              trackColor={{ true: colors.roxo, false: colors.border }}
              thumbColor={colors.textForte}
            />
            <Text style={styles.lembrarTexto}>{t('login.remember_me')}</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.link}>{t('login.forgot_password')}</Text>
          </TouchableOpacity>
        </View>

        <PrimaryButton label={t('login.submit')} onPress={aoSubmeter} loading={carregando} />

        <View style={styles.rodape}>
          <Text style={styles.rodapeTexto}>{t('login.no_account')} </Text>
          <TouchableOpacity>
            <Text style={styles.link}>{t('login.create_account')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, padding: spacing.xl, paddingTop: spacing.xxl, alignItems: 'center' },
  titulo: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textForte,
    marginTop: spacing.lg,
  },
  subtitulo: { fontSize: 14, color: colors.muted, marginBottom: spacing.xl },
  abas: {
    flexDirection: 'row',
    backgroundColor: colors.bg2,
    borderRadius: radius.md,
    padding: 4,
    width: '100%',
    marginBottom: spacing.md,
  },
  aba: { flex: 1, paddingVertical: 10, borderRadius: radius.sm, alignItems: 'center' },
  abaAtiva: { backgroundColor: colors.roxo },
  abaTexto: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  abaTextoAtivo: { color: colors.textForte },
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
  senhaWrapper: {
    width: '100%',
    height: 52,
    backgroundColor: colors.bg2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  senhaInput: { flex: 1, height: '100%', color: colors.textForte },
  senhaToggle: { fontSize: 18, marginLeft: spacing.sm },
  erro: { color: colors.red, fontSize: 13, alignSelf: 'flex-start', marginBottom: spacing.sm },
  linhaOpcoes: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  lembrarWrapper: { flexDirection: 'row', alignItems: 'center' },
  lembrarTexto: { color: colors.text, fontSize: 13, marginLeft: spacing.xs },
  link: { color: colors.laranja, fontSize: 13, fontWeight: '600' },
  rodape: { flexDirection: 'row', marginTop: spacing.lg },
  rodapeTexto: { color: colors.muted, fontSize: 13 },
});
