import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { SplashScreen } from '@/screens/auth/SplashScreen';
import { OnboardingScreen } from '@/screens/auth/OnboardingScreen';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { RegisterScreen } from '@/screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '@/screens/auth/ForgotPasswordScreen';
import { MainTabsNavigator } from './MainTabsNavigator';
import { ProProfileScreen } from '@/screens/profile/ProProfileScreen';
import { ChatScreen } from '@/screens/chat/ChatScreen';
import { ReviewScreen } from '@/screens/orders/ReviewScreen';
import { useAuthStore } from '@/store/authStore';

const Stack = createNativeStackNavigator<RootStackParamList>();
const CHAVE_ONBOARDING_VISTO = '@konectaja/onboarding_visto';
const DURACAO_MINIMA_SPLASH = 1800;

// Padrão "auth flow" do React Navigation: o conjunto de telas
// registradas muda conforme o estado de login, em vez de ficar tudo
// numa pilha só. É isso que faz o logout voltar pra tela de Login
// sozinho — antes, limpar o estado não movia a navegação, a pessoa
// ficava parada numa tela autenticada sem token nenhum.
export function AppNavigator() {
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const autenticado = useAuthStore((s) => !!s.token);

  const [onboardingVisto, setOnboardingVisto] = useState<boolean | null>(null);
  const [tempoMinimoPassou, setTempoMinimoPassou] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(CHAVE_ONBOARDING_VISTO).then((valor) => setOnboardingVisto(!!valor));
    const temporizador = setTimeout(() => setTempoMinimoPassou(true), DURACAO_MINIMA_SPLASH);
    return () => clearTimeout(temporizador);
  }, []);

  const pronto = hasHydrated && onboardingVisto !== null && tempoMinimoPassou;

  const initialRouteName = !pronto
    ? 'Splash'
    : autenticado
      ? 'Home'
      : onboardingVisto
        ? 'Login'
        : 'Onboarding';

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        {!pronto && <Stack.Screen name="Splash" component={SplashScreen} />}

        {pronto && autenticado && (
          <>
            <Stack.Screen name="Home" component={MainTabsNavigator} />
            <Stack.Screen name="ProProfile" component={ProProfileScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="Review" component={ReviewScreen} />
          </>
        )}

        {pronto && !autenticado && (
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
