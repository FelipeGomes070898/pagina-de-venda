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
import { KonectaLogo } from '@/components/common/KonectaLogo';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { PasswordInput } from '@/components/common/PasswordInput';
import { colors, radius, sombra, spacing } from '@/theme/tokens';
import { validarCPF, validarEmail, validarTelefoneBR } from '@/utils/validators';
import { mascararCPF, mascararTelefoneBR, somenteDigitos } from '@/utils/masks';
import { recuperarSenha } from '@/services/authService';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senhaNova, setSenhaNova] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function aoSubmeter() {
    setErro(null);
    setSucesso(false);

    if (!validarEmail(email)) return setErro(t('forgotPassword.error_email_invalid'));
    if (!validarCPF(cpf)) return setErro(t('forgotPassword.error_cpf_invalid'));
    if (!validarTelefoneBR(telefone)) return setErro(t('forgotPassword.error_phone_invalid'));
    if (senhaNova.length < 8) return setErro(t('forgotPassword.error_password_short'));
    if (senhaNova !== confirmacao) return setErro(t('forgotPassword.error_password_mismatch'));

    setCarregando(true);
    try {
      await recuperarSenha({
        email: email.trim(),
        cpf: somenteDigitos(cpf),
        telefone: somenteDigitos(telefone),
        senhaNova,
      });
      setSucesso(true);
      setTimeout(() => navigation.replace('Login'), 1500);
    } catch {
      setErro(t('forgotPassword.error_failed'));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.cabecalho}>
          <KonectaLogo size="sm" />
          <Text style={styles.titulo}>{t('forgotPassword.title')}</Text>
          <Text style={styles.subtitulo}>{t('forgotPassword.subtitle')}</Text>
        </View>

        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder={t('forgotPassword.email_placeholder')}
            placeholderTextColor={colors.muted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            placeholder={t('forgotPassword.cpf_placeholder')}
            placeholderTextColor={colors.muted}
            value={cpf}
            onChangeText={(v) => setCpf(mascararCPF(v))}
            keyboardType="number-pad"
          />
          <TextInput
            style={styles.input}
            placeholder={t('forgotPassword.phone_placeholder')}
            placeholderTextColor={colors.muted}
            value={telefone}
            onChangeText={(v) => setTelefone(mascararTelefoneBR(v))}
            keyboardType="number-pad"
          />
          <PasswordInput
            placeholder={t('forgotPassword.new_password_placeholder')}
            value={senhaNova}
            onChangeText={setSenhaNova}
          />
          <PasswordInput
            placeholder={t('forgotPassword.confirm_password_placeholder')}
            value={confirmacao}
            onChangeText={setConfirmacao}
          />

          {erro && <Text style={styles.erro}>{erro}</Text>}
          {sucesso && <Text style={styles.sucesso}>{t('forgotPassword.success')}</Text>}

          <PrimaryButton label={t('forgotPassword.submit')} onPress={aoSubmeter} loading={carregando} />

          <Text style={styles.ajuda}>{t('forgotPassword.support_hint')}</Text>
        </View>

        <TouchableOpacity style={styles.rodape} onPress={() => navigation.replace('Login')}>
          <Text style={styles.link}>{t('forgotPassword.back_to_login')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.xxl, alignItems: 'center' },
  cabecalho: { alignItems: 'center', marginBottom: spacing.lg },
  titulo: { fontSize: 22, fontWeight: '800', color: colors.textForte, marginTop: spacing.lg, textAlign: 'center' },
  subtitulo: { fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: spacing.xs },
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
  sucesso: { color: colors.green, fontSize: 13, alignSelf: 'flex-start', marginBottom: spacing.sm },
  ajuda: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: spacing.md },
  rodape: { marginTop: spacing.lg },
  link: { color: colors.azul, fontSize: 13, fontWeight: '600' },
});
