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

Abre em `http://localhost:5174`. Testado de ponta a ponta neste projeto,
com duas sessões de navegador simultâneas (uma como cliente, outra como
prestador) e dados reais no Postgres: cadastro → marketplace → perfil →
contato → chat → proposta → aceite → endereço → marcar concluído →
avaliação. Ver `docs/vexo-regras-de-negocio.md` na raiz do repositório
para os bugs reais que esse teste encontrou (e já corrigidos).

## Etapa atual

- `src/pages/auth/Login.jsx` — login por celular, e-mail, CPF ou Google.
- `src/pages/auth/Register.jsx` — cadastro de cliente ou prestador
  (categoria, preço, modelo de cobrança, endereço com Google Maps
  Autocomplete quando `VITE_GOOGLE_MAPS_API_KEY` está configurada).
- `src/pages/marketplace/Marketplace.jsx` — lista de prestadores por
  categoria, ordenados por proximidade via `navigator.geolocation` do
  próprio navegador. Aba "Preciso de um serviço" pro cliente publicar
  um pedido em aberto.
- `src/pages/profile/ProfessionalProfile.jsx` — perfil do prestador
  (fotos de trabalhos, bio, avaliações, botão "Entrar em contato").
- `src/pages/chat/Chat.jsx` — chat completo: mensagens, proposta de
  valor (qualquer uma das partes pode propor), aceitar/recusar (só quem
  recebe, nunca quem propôs), marcar serviço como concluído, endereço
  liberado após fechar (com Google Maps Autocomplete).
- `src/pages/review/Review.jsx` — avaliação pós-serviço (estrelas, tags,
  comentário), acessível pelo cliente depois que o pedido é concluído.

## Próximos passos

- Deploy: qualquer host de site estático (Vercel, Netlify, etc.) depois
  de `npm run build` — só precisa apontar `VITE_API_URL` pro backend em
  produção, e configurar `VITE_GOOGLE_CLIENT_ID`/`VITE_GOOGLE_MAPS_API_KEY`
  se quiser login com Google e endereço com autocomplete.
- Tempo real no chat (hoje atualiza por polling a cada 5s, igual o
  mobile) — WebSocket/socket.io é upgrade de infraestrutura pra depois.
