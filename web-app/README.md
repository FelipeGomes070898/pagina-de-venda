# Vexo — App Web (cliente / prestador)

Versão web do Vexo para quem prefere acessar pelo navegador em vez de
baixar o app na Play Store. É um projeto **separado** do app mobile
(`mobile/`) e do painel administrativo (`frontend-web/`) — os três
consomem a mesma API (`backend/`), mas cada um é sua própria interface.

## Por que um projeto separado em vez de compartilhar código com o mobile?

O app mobile foi criado como projeto React Native "bare" (não Expo), o
que tornaria migrar para React Native Web um trabalho arriscado e difícil
de validar neste ambiente. Um site em React + Vite é o padrão que apps
como Uber e InDrive também usam: aplicativo nativo e site são interfaces
diferentes, consumindo a mesma API — não a mesma build.

## Rodando localmente

```bash
cd web-app
npm install
cp .env.example .env   # ajuste VITE_API_URL se o backend não estiver em localhost:3333
npm run dev
```

Abre em `http://localhost:5174`. Testado de ponta a ponta neste projeto:
cadastro de cliente, cadastro de prestador, marketplace mostrando o
prestador cadastrado, e "Entrar em contato" criando o pedido de verdade.

## Etapa atual

- `src/pages/auth/Login.jsx` — login por celular, e-mail ou CPF + senha.
- `src/pages/auth/Register.jsx` — cadastro de cliente ou prestador
  (categoria, preço e modelo de cobrança para prestador).
- `src/pages/marketplace/Marketplace.jsx` — lista de prestadores por
  categoria, ordenados por proximidade via `navigator.geolocation` do
  próprio navegador (mais simples que no mobile: não precisa de
  permissão configurada em manifesto nativo, o navegador já pergunta).
  Também tem a aba "Preciso de um serviço" pro cliente publicar um
  pedido em aberto.
- "Entrar em contato" cria o pedido de verdade
  (`POST /api/pedidos`) e leva pra uma tela de confirmação — o chat
  completo (negociação, aceite, endereço) já existe no app mobile e é o
  próximo passo a portar pra cá.

## Próximos passos

- Chat (mensagens + proposta de valor + aceite) — já existe em
  `mobile/src/screens/chat/ChatScreen.tsx`, portar a mesma lógica.
- Perfil do prestador (fotos, avaliações) — mesma ideia do
  `mobile/src/screens/profile/ProProfileScreen.tsx`.
- Avaliação pós-serviço.
- Deploy: qualquer host de site estático (Vercel, Netlify, etc.) depois
  de `npm run build` — só precisa apontar `VITE_API_URL` pro backend em
  produção.
