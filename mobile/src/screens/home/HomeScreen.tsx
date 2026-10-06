import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import { MainTabParamList, RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/store/authStore';
import { ClienteHomeScreen } from './ClienteHomeScreen';
import { PrestadorHomeScreen } from './PrestadorHomeScreen';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'MarketplaceTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

// Cliente e prestador têm necessidades bem diferentes na aba "Início":
// cliente navega o marketplace de prestadores, prestador quer ver o
// próprio desempenho e os pedidos que pode responder. Antes, os dois
// caíam na mesma tela (a do cliente) — um prestador logado via até a si
// mesmo na lista, com um botão "Contato" sem nenhum sentido.
export function HomeScreen(props: Props) {
  const tipo = useAuthStore((s) => s.usuario?.tipo);
  return tipo === 'prestador' ? <PrestadorHomeScreen {...props} /> : <ClienteHomeScreen {...props} />;
}
