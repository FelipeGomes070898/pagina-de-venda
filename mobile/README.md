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

### Permissão de localização (necessária para o marketplace por proximidade)

Depois de gerar `android/` e `ios/` (passo acima), adicione a permissão de
GPS em cada plataforma — sem isso, `@react-native-community/geolocation`
não funciona e o marketplace cai de volta pra ordenação por data:

**Android** — em `android/app/src/main/AndroidManifest.xml`, antes da tag
`<application>`:
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

**iOS** — em `ios/vexo/Info.plist`, adicione:
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>O Vexo usa sua localização para mostrar os prestadores mais próximos de você.</string>
```

### Login com Google

Some da tela sozinho se não estiver configurado — não quebra o login por
telefone/e-mail/CPF. Pra ativar:

1. No Google Cloud Console, crie um Client ID **Web application** (é ele
   que vai no `GOOGLE_CLIENT_ID` do backend) e um Client ID **Android**
   (precisa do SHA-1 do keystore de debug/release, que só existe depois
   de gerar `android/`) e/ou **iOS**.
2. Instale `@react-native-google-signin/google-signin` (já está no
   `package.json`) e siga o guia nativo da lib — no Android, precisa do
   `google-services.json` em `android/app/`; não tem como fazer isso
   aqui porque a pasta `android/` ainda não existe neste repositório.
3. Defina `GOOGLE_WEB_CLIENT_ID` no ambiente do build (via
   `react-native-config` ou similar — `process.env` puro não é
   inlinado pelo Metro por padrão).

Sem isso tudo configurado, `src/services/googleAuthService.ts` marca o
recurso como indisponível e o botão simplesmente não aparece.

### Endereço com Google Maps (cadastro do prestador e chat)

Usa a Places API via chamadas HTTP simples (`fetch`), sem SDK nativo —
por isso funciona mesmo sem `android/`/`ios/` gerados. Só precisa de
`GOOGLE_MAPS_API_KEY` no ambiente do build (mesma ressalva do
`react-native-config` acima). Sem a chave, os campos de endereço
(`src/components/common/AddressAutocompleteInput.tsx`, usado no
cadastro do prestador e no envio de endereço do chat) viram texto livre
— sem sugestões nem lat/lng, mas sem quebrar nada.

## Stack

React Native 0.73 + TypeScript, React Navigation (native-stack), Zustand
(com persistência via AsyncStorage para "salvar login"), i18next, Axios.

## Próximos passos

Ver `docs/vexo-regras-de-negocio.md` na raiz do repositório para o plano
completo do marketplace, chat, cobrança do prestador e avaliações.
