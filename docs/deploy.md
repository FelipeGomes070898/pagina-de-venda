# Vexo — Guia de deploy em produção

Este documento cobre as 4 peças do projeto. Nenhuma delas eu consigo
publicar por você — todas exigem contas/credenciais suas (hospedagem,
Google Play, Google Cloud, Asaas). O que dá pra fazer aqui já foi feito
(código pronto, testado localmente, Dockerfile validado); o resto é
você seguir o passo a passo abaixo com suas próprias contas.

---

## 1. Backend + banco de dados

O `backend/` é uma API Express comum + PostgreSQL — roda em qualquer
lugar que aceite Node ou Docker.

### Opção A — Railway (mais simples, recomendado)

1. Crie um projeto no [Railway](https://railway.app), adicione um
   serviço **PostgreSQL** (ele já vem com `DATABASE_URL` pronto — ajuste
   `backend/src/config/database.js` pra usar essa variável, ou copie os
   valores individuais pras variáveis `DB_HOST`/`DB_PORT`/etc.).
2. Adicione um serviço apontando pra pasta `backend/` deste repositório
   (Railway detecta o `package.json` e roda `npm install && npm start`
   sozinho).
3. Configure as variáveis de ambiente do serviço (ver checklist no
   final deste documento).
4. Depois do primeiro deploy, rode uma vez (Railway tem um "Shell" no
   próprio painel, ou rode local apontando pro banco de produção):
   ```bash
   npm run migrate
   npm run criar-dono
   ```
5. Pegue a URL pública que o Railway gera (ex.:
   `https://vexo-api.up.railway.app`) — é o `VITE_API_URL` /
   `API_URL` que os outros três projetos vão usar.

### Opção B — Docker (Render, Fly.io, DigitalOcean, ou uma VPS qualquer)

Já existe `backend/Dockerfile` e um `docker-compose.yml` na raiz do
repositório (sobe API + Postgres juntos). Localmente:

```bash
docker compose up -d --build
```

> Não consegui rodar isso de ponta a ponta *aqui* — este ambiente de
> sandbox não suporta containers aninhados (o daemon Docker não inicia).
> Validei o que dava pra validar sem o daemon: a sintaxe do
> `docker-compose.yml` (`docker compose config`) e que a dependência
> nativa mais arriscada da imagem (`bcrypt`) tem binário pré-compilado
> pra Alpine Linux, então o build não deveria quebrar. Mas vale rodar
> `docker compose up --build` numa máquina de verdade antes de confiar
> nisso em produção.

Pra usar em produção num host que já tem Postgres gerenciado (Render,
Railway, etc.), suba só o serviço `backend` (Dockerfile), sem o `db` do
compose, apontando as variáveis de ambiente pro Postgres gerenciado.

### Depois de qualquer uma das duas opções

- Rode `npm run criar-dono` (uma vez só) pra ter o primeiro acesso ao
  painel administrativo — ver `docs/vexo-regras-de-negocio.md`.
- Configure o webhook do Asaas (se for usar) apontando pra
  `https://SEU_BACKEND/api/pagamentos/webhook?token=SEU_ASAAS_WEBHOOK_TOKEN`.

---

## 2. Painel administrativo (`frontend-web/`) e app web (`web-app/`)

Os dois são SPAs React + Vite comuns — build estático, sem servidor
próprio. Vercel ou Netlify são as opções mais simples (grátis pra
começar):

1. Crie um projeto apontando pra este repositório, com **Root
   Directory** = `frontend-web` (repita o processo com `web-app` como
   um segundo projeto/site).
2. Build command: `npm run build` · Output directory: `dist`.
3. Variáveis de ambiente (Vercel/Netlify têm uma seção própria pra
   isso — não precisa de arquivo `.env` commitado):
   - `frontend-web`: `VITE_API_URL` (sem ela, cai no fallback
     `http://localhost:3333/api` — não serve em produção).
   - `web-app`: `VITE_API_URL` (obrigatória), `VITE_GOOGLE_CLIENT_ID` e
     `VITE_GOOGLE_MAPS_API_KEY` (opcionais — sem elas o botão do Google
     some e o endereço vira texto livre, ver `web-app/README.md`).
4. Configure DNS/domínio próprio direto no painel da Vercel/Netlify se
   quiser (ex.: `app.suaempresa.com` pro `web-app`,
   `admin.suaempresa.com` pro `frontend-web`).
5. Volte no backend e configure `CORS_ORIGINS` com as duas URLs finais
   (`https://app.suaempresa.com,https://admin.suaempresa.com`) — sem
   isso, o backend aceita requisição de qualquer origem, o que é
   conveniente em dev mas não deveria ficar assim em produção.

---

## 3. App mobile — publicar na Play Store

Isso só pode ser feito por você: exige sua conta de desenvolvedor
Google (pagamento único de US$ 25) e assinatura digital do app.

1. **Gerar o projeto nativo** (ainda não existe neste repositório —
   ver `mobile/README.md`): `npx react-native init` ou configurar Expo,
   copiando `android/` pra dentro deste projeto.
2. **Apontar pro backend de produção**: configure a URL final da API
   em `mobile/src/services/api.ts` (hoje aponta pra
   `https://api.vexo.app`, um placeholder).
3. **Gerar a keystore de release** (assinatura do app — guarde esse
   arquivo com muito cuidado, perdê-lo significa não poder mais
   atualizar o app publicado):
   ```bash
   keytool -genkeypair -v -storetype PKCS12 -keystore vexo-release.keystore -alias vexo -keyalg RSA -keysize 2048 -validity 10000
   ```
4. **Gerar o AAB assinado**:
   ```bash
   cd android && ./gradlew bundleRelease
   ```
5. **Conta no [Google Play Console](https://play.google.com/console)**
   — criar o app, preencher: descrição, capturas de tela, ícone,
   política de privacidade (obrigatória — precisa de uma URL pública;
   dado que o app coleta CPF/telefone/localização, isso é indispensável
   pra aprovação), classificação indicativa, categoria.
6. Subir o `.aab` gerado no passo 4, preencher as notas de versão, e
   enviar pra revisão. A Google costuma levar de algumas horas a alguns
   dias pra aprovar a primeira versão.
7. Se for usar login com Google no app: criar o Client ID **Android**
   no Google Cloud Console com o SHA-1 dessa mesma keystore de release
   (e outro Client ID de debug pra desenvolvimento) — ver
   `mobile/README.md`.

---

## Checklist de variáveis de ambiente (produção)

| Variável | Onde | Trocar antes de produção? |
|---|---|---|
| `JWT_SECRET` | backend | **Sim, sempre** — gere um valor aleatório longo |
| `DB_PASSWORD` | backend | **Sim** — nunca use a senha de dev |
| `CORS_ORIGINS` | backend | **Sim** — restrinja às URLs reais do painel e do app web |
| `GOOGLE_CLIENT_ID` | backend | Só se for usar login com Google |
| `ASAAS_API_KEY` / `ASAAS_ENV=producao` | backend | Só se for cobrar de verdade (troque de sandbox pra produção) |
| `ASAAS_WEBHOOK_TOKEN` | backend | Se usar Asaas — gere um valor aleatório |
| `VITE_API_URL` | web-app, frontend-web | **Sim** — aponte pro backend de produção |
| `VITE_GOOGLE_CLIENT_ID` / `VITE_GOOGLE_MAPS_API_KEY` | web-app | Só se for usar Google |
| Keystore de release | mobile | Gerar uma vez, guardar com segurança (backup) |

Depois de configurar tudo isso, rode `npm run criar-dono` no backend de
produção **antes** de divulgar qualquer link — sem isso, ninguém
consegue acessar o painel administrativo.
