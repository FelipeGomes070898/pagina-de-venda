import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '@/i18n';
import { AppNavigator } from '@/navigation/AppNavigator';
import { colors } from '@/theme/tokens';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
