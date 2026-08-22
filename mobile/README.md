# Vexo — App Mobile

App estilo Uber, mas para conexão de serviços locais (pedreiro, diarista,
encanador, babá, roçador de quintal, etc.) entre clientes e prestadores
autônomos.

## Etapa atual: Splash → Onboarding → Login

- `src/screens/auth/SplashScreen.tsx` — logo animado, decide a próxima tela
  (Onboarding na primeira vez, Login ou Home nas seguintes).
- `src/screens/auth/OnboardingScreen.tsx` — vinheta de abertura em 3 slides.
- `src/screens/auth/LoginScreen.tsx` — login nacional (BR) por celular,
  e-mail ou CPF + senha, com opção "salvar login".

## Rodando o projeto

Este repositório contém apenas o código-fonte JS/TS. As pastas nativas
`android/` e `ios/` **precisam ser geradas localmente**, pois são boilerplate
extenso gerado por ferramenta (não faz sentido versionar escrito à mão):

```bash
cd mobile
npm install
npx react-native init TempVexo --version 0.73.6   # gera android/ e ios/ de referência
# copie as pastas android/ e ios/ geradas para dentro deste projeto
npx react-native run-android   # ou run-ios
```

Alternativa mais simples: usar o [Expo](https://expo.dev) caso prefira não
lidar com projetos nativos manualmente (exigiria adaptar algumas libs).

## Stack

React Native 0.73 + TypeScript, React Navigation (native-stack), Zustand
(com persistência via AsyncStorage para "salvar login"), i18next, Axios.

## Próximos passos

Ver `docs/vexo-regras-de-negocio.md` na raiz do repositório para o plano
completo do marketplace, chat, cobrança do prestador e avaliações.
