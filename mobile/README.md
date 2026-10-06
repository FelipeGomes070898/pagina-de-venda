# Konecta Já — App Mobile

App estilo Uber, mas para conexão de serviços locais (pedreiro, diarista,
encanador, babá, roçador de quintal, etc.) entre clientes e prestadores
autônomos.

## Telas

- `src/screens/auth/SplashScreen.tsx` — logo animado, decide a próxima tela
  (Onboarding na primeira vez, Login ou Home nas seguintes).
- `src/screens/auth/OnboardingScreen.tsx` — vinheta de abertura em 3 slides.
- `src/screens/auth/LoginScreen.tsx` / `RegisterScreen.tsx` — login e cadastro
  nacional (BR) por celular, e-mail ou CPF + senha (ou Google), com opção
  "salvar login".
- `src/navigation/MainTabsNavigator.tsx` — navegação principal por abas depois
  do login: **Início** (marketplace), **Busca**, **Chats** e **Perfil**.
- `src/screens/home/HomeScreen.tsx` — marketplace: lista de prestadores
  (ordenada por proximidade) ou pedidos em aberto, com busca e categorias.
- `src/screens/busca/BuscaScreen.tsx` — busca dedicada por nome/serviço.
- `src/screens/chat/ChatsListScreen.tsx` — lista das conversas/negociações do
  usuário; `ChatScreen.tsx` é a conversa individual (mensagens + proposta).
- `src/screens/profile/PerfilScreen.tsx` — perfil do usuário logado (dados da
  conta, sair). `ProProfileScreen.tsx` é o perfil público de um prestador.

## Baixar um APK pronto pra testar (sem instalar nada)

Toda vez que algo muda em `mobile/`, o GitHub Actions
(`.github/workflows/mobile-apk.yml`) builda um APK automaticamente.
Pra baixar o mais recente:

1. Abra a aba **Actions** do repositório no GitHub.
2. Clique no workflow mais recente de **"Mobile APK"** com um ✅.
3. Na seção **Artifacts**, baixe `konectaja-apk` (é um .zip contendo o
   `app-release.apk`).
4. Transfira o `.apk` pro celular Android (link do GitHub, WhatsApp Web,
   cabo USB, o que for mais fácil) e abra o arquivo nele.
5. O Android vai pedir pra habilitar **"Instalar apps de fontes
   desconhecidas"** pra esse app que está enviando o arquivo (navegador,
   WhatsApp etc.) — é esperado, porque esse APK não veio da Play Store.

É um build **release** (empacota o JS Hermes dentro do APK, por isso roda
standalone sem precisar de Metro por perto), mas assinado com a
`debug.keystore` padrão do React Native, não com uma chave de loja de
verdade — serve pra testar a conexão cliente/prestador agora, não é a
versão final de publicação (pra isso precisa gerar uma keystore própria,
ver https://reactnative.dev/docs/signed-apk-android).

## Rodando o projeto localmente

`android/` já está neste repositório (gerado a partir do template oficial
da versão 0.73.6 do React Native) — não precisa gerar de novo. `ios/`
continua precisando ser gerado localmente numa máquina com Xcode, pois
exige um Mac (não dá pra gerar/testar aqui no Linux):

```bash
cd mobile
npm install
npx react-native run-android   # precisa de um emulador rodando ou celular com depuração USB
```

Pra iOS, numa máquina com Xcode:

```bash
npx react-native init TempKonectaJa --version 0.73.6   # gera ios/ de referência
# copie a pasta ios/ gerada para dentro deste projeto
npx react-native run-ios
```

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

**iOS** — em `ios/konectaja/Info.plist`, adicione:
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>A Konecta Já usa sua localização para mostrar os prestadores mais próximos de você.</string>
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

### Notificações push (nova mensagem, proposta, avaliação)

Usa `@react-native-firebase/messaging`. Some sozinho se não estiver
configurado — não pede permissão, não registra token, não quebra o
login nem nenhuma outra tela. Pra ativar:

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
   (gratuito, plano Spark já cobre isso).
2. Dentro do projeto, adicione um app Android com o `applicationId`
   `com.konectaja.app` (ver `android/app/build.gradle` → `namespace`) e
   baixe o `google-services.json` gerado.
3. Coloque esse arquivo em `android/app/google-services.json` — o
   `android/app/build.gradle` já está preparado pra só aplicar o plugin
   do Google Services quando o arquivo existir (sem ele, o build
   continua normal, igual hoje).
4. No CI (GitHub Actions), em vez de commitar o arquivo (ele tem um
   identificador do projeto, mas nenhum segredo "secreto" de verdade —
   ainda assim, mais seguro manter fora do repositório): cole o
   conteúdo do `google-services.json` como secret
   `GOOGLE_SERVICES_JSON` em Settings > Secrets and variables > Actions,
   e adicione um passo no workflow (`.github/workflows/mobile-apk.yml`)
   que escreve esse secret no arquivo antes do `./gradlew assembleRelease`.
5. No backend (Vercel), gere uma chave de conta de serviço em
   Firebase Console > Configurações do projeto > Contas de serviço >
   Gerar nova chave privada, e cole o conteúdo do JSON gerado na
   variável de ambiente `FIREBASE_SERVICE_ACCOUNT_JSON` (ver
   `backend/src/config/firebase.js`).

Sem os passos 2–4, `notificationService.ts` detecta que o módulo nativo
não está disponível (`disponivel()` retorna `false`) e não faz nada. Sem
o passo 5, o backend loga um aviso e não envia a notificação, mas nenhuma
requisição falha por causa disso (mesmo padrão do `asaasService.js`).

## Stack

React Native 0.73 + TypeScript, React Navigation (native-stack + bottom-tabs),
Zustand (com persistência via AsyncStorage para "salvar login"), i18next, Axios.

## Próximos passos

Ver `docs/konectaja-regras-de-negocio.md` na raiz do repositório para o plano
completo do marketplace, chat, cobrança do prestador e avaliações.
