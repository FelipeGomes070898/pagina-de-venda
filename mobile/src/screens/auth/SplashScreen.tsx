import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { KonectaLogo } from '@/components/common/KonectaLogo';
import { colors } from '@/theme/tokens';

// Só a animação de abertura — quem decide pra onde ir (Home, Login ou
// Onboarding) é o AppNavigator, que também reage a mudanças de sessão
// (ex.: logout) depois que o app já abriu. A barra de progresso só
// acompanha visualmente a duração mínima do splash (DURACAO_MINIMA_SPLASH
// no AppNavigator) — não há sincronização exata entre as duas.
export function SplashScreen() {
  const { t } = useTranslation();
  const opacidade = useRef(new Animated.Value(0)).current;
  const escala = useRef(new Animated.Value(0.9)).current;
  const progresso = useRef(new Animated.Value(0)).current;

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
      Animated.timing(progresso, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
      }),
    ]).start();
  }, [opacidade, escala, progresso]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: opacidade, transform: [{ scale: escala }] }}>
        <KonectaLogo size="lg" />
        <Text style={styles.slogan}>{t('splash.slogan')}</Text>
      </Animated.View>
      <View style={styles.trilhaBase}>
        <Animated.View
          style={[
            styles.barraBase,
            {
              width: progresso.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            },
          ]}
        />
      </View>
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
  trilhaBase: {
    position: 'absolute',
    bottom: 64,
    width: 96,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.bg3,
    overflow: 'hidden',
  },
  barraBase: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.laranja,
  },
});
