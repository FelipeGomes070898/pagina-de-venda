export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  Home: undefined;
  ProProfile: { prestadorId: string; prestadorNome: string };
  Chat: { pedidoId: string; prestadorNome: string };
  Review: { pedidoId: string; prestadorNome: string };
};
