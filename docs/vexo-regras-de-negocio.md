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

> Observação: isso substitui o modelo anterior de trial de 7 dias + R$50/mês
> fixo descrito na skill original. Ajustar `backend/src/services/trialService.js`
> e a tabela `pagamentos` (novo campo `modelo_cobranca`: `percentual` |
> `fixo_mensal`) quando o backend for retomado.

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
   categoria. Falta plugar geolocalização real do dispositivo (hoje a
   API já aceita `lat`/`lng` e ordena por distância via Haversine, mas o
   app ainda não captura o GPS do cliente — precisa de
   `react-native-geolocation` e permissão, que exigem projeto nativo
   gerado localmente).
3. Perfil do prestador (fotos, avaliação, tags de avaliação — falta a
   tela dedicada; hoje `GET /api/prestadores/:id` já retorna fotos e
   avaliações, falta só a UI).
4. ~~Chat + proposta de valor + fechamento do pedido + envio de
   endereço.~~ 🟡 parcial: "Entrar em contato" já cria o `pedido`
   (`POST /api/pedidos`) e abre uma tela de chat (hoje só um resumo,
   `mobile/src/screens/chat/ChatScreen.tsx`). Falta mensagens de
   verdade, proposta de valor dentro do chat, aceite e o botão de
   enviar endereço (`PUT /api/pedidos/:id/endereco`, já existe no
   backend).
5. Tela de avaliação pós-serviço.
6. ~~Configuração da cobrança do prestador (escolha 5%/serviço ou
   R$25/mês)~~ ✅ campo `modelo_cobranca` já existe no cadastro; falta a
   integração real com Asaas (cobrar de fato).
7. ~~Backend: endpoint de login unificado~~ ✅ feito — `POST /api/auth/login`
   (app, aceita celular/e-mail/CPF) e `POST /api/auth/admin/login`
   (painel, hierarquia interna) são rotas separadas.

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
