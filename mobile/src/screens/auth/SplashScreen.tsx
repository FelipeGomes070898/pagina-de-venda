import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { KonectaLogo } from '@/components/common/KonectaLogo';
import { colors } from '@/theme/tokens';

// Só a animação de abertura — quem decide pra onde ir (Home, Login ou
// Onboarding) é o AppNavigator, que também reage a mudanças de sessão
// (ex.: logout) depois que o app já abriu.
export function SplashScreen() {
  const { t } = useTranslation();
  const opacidade = useRef(new Animated.Value(0)).current;
  const escala = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacidade, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(escala, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacidade, escala]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: opacidade, transform: [{ scale: escala }] }}>
        <KonectaLogo size="lg" />
        <Text style={styles.slogan}>{t('splash.slogan')}</Text>
      </Animated.View>
      <View style={styles.barraBase} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slogan: {
    marginTop: 16,
    color: colors.text,
    fontSize: 14,
    textAlign: 'center',
  },
  barraBase: {
    position: 'absolute',
    bottom: 64,
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.laranja,
  },
});
