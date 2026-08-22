# Vexo — Regras de negócio (marketplace + equipe interna)

Documento de referência para as próximas etapas de construção do app.
Etapa 1 (splash, intro, login) já implementada em `mobile/`.
Base da equipe interna (hierarquia de admins) implementada em `backend/`
e `frontend-web/`.

## Hierarquia da equipe interna (painel admin)

Estrutura organizacional, do topo para a base:

- **Dono** — dono/fundador da empresa. Acesso total: financeiro,
  pagamentos, configurações, e pode cadastrar RH, gerentes e atendimento.
  Não é criado pelo painel (é o registro inicial, feito direto no banco/
  script de setup por segurança).
- **RH** — cadastra e desativa **gerentes** e **atendimento**. Não vê
  financeiro/pagamentos/configurações, e não pode mexer em outro RH nem
  no dono.
- **Gerente** — vinculado a uma **divisão** (`divisao_id`, ex.: uma região
  ou área de atuação). Vê e atua apenas sobre o que é da sua divisão.
  Não cadastra outros admins.
- **Atendimento** — suporte/denúncias. Sem acesso a financeiro, equipe ou
  configurações.

Regra de criação (quem pode cadastrar quem), já implementada no backend
(`Admin.CARGOS_QUE_PODEM_CRIAR`):

| Quem cria    | Pode criar                  |
|--------------|------------------------------|
| dono         | rh, gerente, atendimento     |
| rh           | gerente, atendimento         |
| gerente      | ninguém                      |
| atendimento  | ninguém                      |

Tabelas: `admins` (cargo, divisao_id, criado_por, ativo) e `divisoes`
(nome, descrição). Ver `backend/src/utils/migrations.sql`.

### Visibilidade no painel (`frontend-web/src/components/layout/Sidebar.jsx`)

| Seção          | dono | rh | gerente | atendimento |
|----------------|:---:|:--:|:-------:|:-----------:|
| Dashboard      | ✅  | ✅ | ✅      | ✅          |
| Prestadores    | ✅  | ✅ | ✅ (só divisão) | ✅  |
| Clientes       | ✅  | ✅ | ✅ (só divisão) | ✅  |
| Financeiro     | ✅  | ❌ | ❌      | ❌          |
| Pagamentos     | ✅  | ❌ | ❌      | ❌          |
| Equipe         | ✅  | ✅ | ❌      | ❌          |
| Suporte        | ✅  | ✅ | ✅      | ✅          |
| Configurações  | ✅  | ❌ | ❌      | ❌          |

> Pendente para a próxima fase: aplicar o filtro por `divisao_id` nas
> listagens de prestadores/clientes/suporte quando `cargo === 'gerente'`
> (o middleware `restringirPorDivisao` já existe em
> `backend/src/middlewares/auth.js`, falta plugar nas rotas de
> prestadores/clientes quando essas rotas forem criadas).

## Marketplace de serviços

- Lista pessoas oferecendo serviços de qualquer modalidade: pedreiro, ajudante
  de pedreiro, diarista, trabalho doméstico, babá, roçador de quintal,
  encanador, etc. (categorias fixas + personalizadas, como já previsto no
  schema `categorias`).
- **Preço definido pelo prestador.** Cada prestador cadastra o valor do seu
  serviço; esse valor aparece no card dele no marketplace.
- **Cliente também pode publicar pedido no marketplace**, dizendo que
  precisa de um serviço e sugerindo um valor (oferta reversa).
- **Ranking por proximidade:** usando a localização cadastrada por cliente e
  prestador, quem está mais perto aparece mais acima na lista.

## Contato e negociação

1. Cliente encontra o prestador (ex.: "Senhor Francisco", roçador, R$150).
2. Cliente toca em "Entrar em contato" → abre chat dentro do app.
3. Prestador recebe notificação da mensagem.
4. Negociação acontece no chat (aceitar valor anunciado ou negociar outro).
5. Ao fechar o serviço, o app libera a opção de **enviar o endereço** do
   cliente para o prestador.
6. Isso já está mapeado no schema atual: tabelas `pedidos`, `mensagens` e
   `propostas` (proposta = valor negociado dentro do chat).

## Cobrança do prestador (mensalidade da plataforma)

O prestador escolhe **um dos dois modelos** para manter a conta ativa:

- **5% sobre cada serviço concluído**, cobrado automaticamente via Asaas
  quando o pedido muda para `concluido`; ou
- **Taxa fixa de R$ 25,00/mês**, cobrada como assinatura recorrente.

Isso substitui o modelo anterior de trial de 7 dias + R$50/mês fixo da
skill original — não há mais período de trial, o prestador já entra
cobrável no modelo que escolheu no cadastro. ✅ Integração real feita:

- `backend/src/services/asaasService.js` — cria o cliente no Asaas no
  cadastro do prestador; se `modelo_cobranca = 'fixo_mensal'`, já cria a
  assinatura recorrente (primeira cobrança em 7 dias, como carência);
  se `'percentual'`, cobra 5% via Pix quando o pedido é marcado
  `concluido` (gatilho em `pedidoController.atualizarStatus`).
- `POST /api/pagamentos/webhook` — recebe `PAYMENT_CONFIRMED` /
  `PAYMENT_RECEIVED` (marca pago, reativa o prestador se estava
  inadimplente) e `PAYMENT_OVERDUE` (marca vencido, prestador vira
  `inadimplente` e some do feed — `listarAtivos` só mostra `status =
  'ativo'`). Protegido por um token simples (`ASAAS_WEBHOOK_TOKEN`),
  configurado como query string na URL do webhook cadastrada no painel
  do Asaas.
- `GET /api/pagamentos/meus` — histórico do prestador logado.
- Tudo é *best-effort*: sem `ASAAS_API_KEY` no `.env`, nada quebra — só
  fica registrado em `pagamentos` sem `asaas_id`, pendente até a chave
  real ser configurada.

## Avaliação e confiança

- Prestador ganha estrelas conforme avaliação dos clientes após serviço
  `concluido` (já previsto: tabela `avaliacoes`, nota 1–5, tags, comentário).
- Perfil também é fortalecido pela **quantidade de fotos de trabalhos
  anteriores** cadastradas (tabela `fotos_trabalhos`) — quanto mais fotos,
  mais completo/confiável o perfil aparece. O número mínimo/gatilho exato
  fica como regra interna, não exposta ao usuário.

## Escopo nacional

- Fase 1: app 100% em português, focado no Brasil (login por celular, e-mail
  ou CPF; endereços e telefone no formato BR).
- Internacionalização (i18n multi-idioma) fica para uma fase posterior —
  a estrutura de `src/i18n` já foi montada para comportar isso.

## Próximas etapas sugeridas

1. ~~Telas de cadastro (cliente e prestador, incluindo CPF, cidade, foto).~~
   ✅ feito (`mobile/src/screens/auth/RegisterScreen.tsx` + endpoint
   `POST /api/auth/cadastro`; upload de foto fica para quando a rota de
   perfil do prestador existir).
2. ~~Tela de Marketplace (lista de prestadores por proximidade +
   categorias).~~ ✅ feito — `mobile/src/screens/home/HomeScreen.tsx`,
   com abas "Prestadores" / "Preciso de um serviço" e filtro por
   categoria. ✅ Geolocalização real também feita:
   `mobile/src/services/locationService.ts`
   (`@react-native-community/geolocation`) pede permissão e captura
   lat/lng do cliente ao abrir o marketplace; a Home já manda isso pro
   `GET /api/prestadores`. Só falta uma coisa que eu não consigo fazer
   por aqui: adicionar a permissão no `AndroidManifest.xml`/`Info.plist`
   depois que você gerar as pastas nativas — passo a passo em
   `mobile/README.md`. Sem a permissão concedida, cai de volta pra
   ordenação por data (comportamento seguro, não quebra nada).
3. ~~Perfil do prestador~~ ✅ feito —
   `mobile/src/screens/profile/ProProfileScreen.tsx` (fotos de
   trabalhos, bio, lista de avaliações, botão "Entrar em contato").
   Abre ao tocar no corpo do card no marketplace (o botão "Contato"
   continua contatando direto, sem precisar abrir o perfil).
4. ~~Chat + proposta de valor + fechamento do pedido + envio de
   endereço.~~ ✅ feito — `mobile/src/screens/chat/ChatScreen.tsx` tem
   mensagens de texto, proposta de valor (qualquer uma das partes pode
   propor), aceitar/recusar (só quem recebe a proposta, nunca quem
   enviou) e, quando aceita, o pedido fecha (`status = 'andamento'`,
   `valor` atualizado) e libera o campo de endereço para o cliente
   enviar. Endpoints: `GET/POST /api/chat/:pedidoId`,
   `POST /api/chat/:pedidoId/proposta`,
   `PATCH /api/chat/:pedidoId/proposta/:propostaId`.
   > Limitação atual: chat atualiza por polling (a cada 5s), não é
   > tempo real via WebSocket/socket.io — isso é upgrade de
   > infraestrutura para uma próxima fase, não afeta a lógica de
   > negócio.
5. ~~Tela de avaliação pós-serviço.~~ ✅ feito —
   `mobile/src/screens/orders/ReviewScreen.tsx` (estrelas, tags e
   comentário). No `ChatScreen`, qualquer uma das partes marca
   "serviço concluído" (`PUT /api/pedidos/:id/status`); uma vez
   concluído, só o cliente vê o botão "Avaliar prestador". Backend:
   `POST /api/avaliacoes` (bloqueia se o pedido não estiver concluído
   ou já tiver sido avaliado) e `GET /api/avaliacoes/:prestadorId`
   (pública). A nota do prestador (`prestadores.avaliacao`) é
   recalculada automaticamente a cada avaliação nova.
6. ~~Configuração da cobrança do prestador (escolha 5%/serviço ou
   R$25/mês)~~ ✅ feito, com integração real Asaas — ver seção
   "Cobrança do prestador" acima.
7. ~~Backend: endpoint de login unificado~~ ✅ feito — `POST /api/auth/login`
   (app, aceita celular/e-mail/CPF) e `POST /api/auth/admin/login`
   (painel, hierarquia interna) são rotas separadas.

### Primeiro acesso ao painel (conta do dono)

Não existe endpoint HTTP para criar o dono (de propósito — ninguém deveria
virar dono clicando num botão). Depois de `npm run migrate`, rode
`npm run criar-dono` em `backend/` (script `src/config/criarDono.js`):
pede nome/e-mail/senha (ou lê `DONO_NOME`/`DONO_EMAIL`/`DONO_SENHA` do
ambiente, útil em deploy automatizado) e recusa criar um segundo dono se
já existir um. A partir daí, o dono usa o painel (`frontend-web`) para
cadastrar RH, que por sua vez cadastra gerentes e atendimento.

### Login/cadastro do app — como ficou

- `POST /api/auth/cadastro` — body `{ tipo: 'cliente'|'prestador', nome,
  email, telefone, cpf, senha, cidade?, segmento?, valorServico?,
  modeloCobranca? }`. Telefone e CPF vão sem máscara (só dígitos); o app
  já cuida disso antes de enviar.
- `POST /api/auth/login` — body `{ identificador, tipoIdentificador:
  'telefone'|'email'|'cpf', senha }`. Busca primeiro em `clientes`, depois
  em `prestadores`.
- `POST /api/auth/admin/login` — separado de propósito do login do app,
  usado só pelo painel web (`frontend-web`), autentica contra a tabela
  `admins` (hierarquia dono/rh/gerente/atendimento).
