import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { BuscaScreen } from '@/screens/busca/BuscaScreen';
import { ChatsListScreen } from '@/screens/chat/ChatsListScreen';
import { CarteiraScreen } from '@/screens/carteira/CarteiraScreen';
import { PerfilScreen } from '@/screens/profile/PerfilScreen';
import { colors } from '@/theme/tokens';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONES: Record<keyof MainTabParamList, string> = {
  MarketplaceTab: '🏠',
  BuscaTab: '🔍',
  ChatsTab: '💬',
  CarteiraTab: '👛',
  PerfilTab: '👤',
};

export function MainTabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.laranja,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.bg2,
          borderTopColor: colors.border,
          height: 60,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color }) => (
          <Text style={{ fontSize: 20, color }}>{ICONES[route.name]}</Text>
        ),
      })}
    >
      <Tab.Screen name="MarketplaceTab" component={HomeScreen} options={{ tabBarLabel: 'Início' }} />
      <Tab.Screen name="BuscaTab" component={BuscaScreen} options={{ tabBarLabel: 'Busca' }} />
      <Tab.Screen name="ChatsTab" component={ChatsListScreen} options={{ tabBarLabel: 'Chats' }} />
      <Tab.Screen name="CarteiraTab" component={CarteiraScreen} options={{ tabBarLabel: 'Carteira' }} />
      <Tab.Screen name="PerfilTab" component={PerfilScreen} options={{ tabBarLabel: 'Perfil' }} />
    </Tab.Navigator>
  );
}
