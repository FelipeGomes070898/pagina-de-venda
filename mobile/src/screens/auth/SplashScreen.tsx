import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { VexoLogo } from '@/components/common/VexoLogo';
import { colors } from '@/theme/tokens';
import { useAuthStore } from '@/store/authStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

const CHAVE_ONBOARDING_VISTO = '@vexo/onboarding_visto';

export function SplashScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const opacidade = useRef(new Animated.Value(0)).current;
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    Animated.timing(opacidade, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();

    const temporizador = setTimeout(async () => {
      if (isAuthenticated()) {
        navigation.replace('Home');
        return;
      }
      const jaViuOnboarding = await AsyncStorage.getItem(CHAVE_ONBOARDING_VISTO);
      navigation.replace(jaViuOnboarding ? 'Login' : 'Onboarding');
    }, 1800);

    return () => clearTimeout(temporizador);
  }, [navigation, opacidade, isAuthenticated]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: opacidade }}>
        <VexoLogo size="lg" />
        <Text style={styles.slogan}>{t('splash.slogan')}</Text>
      </Animated.View>
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
});
