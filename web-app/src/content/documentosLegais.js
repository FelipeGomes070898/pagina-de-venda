// Rascunho dos documentos legais do Konecta Já — Termos de Uso, Política
// de Privacidade (LGPD) e Política de Cancelamento/Reembolso.
//
// IMPORTANTE: isto é um rascunho técnico, escrito para refletir
// exatamente como o app funciona hoje (comissão de 5% ou R$25 fixo,
// pagamento direto Pix/dinheiro entre cliente e prestador, etc.) — não é
// assessoria jurídica. Precisa ser revisado por um advogado antes do
// lançamento comercial (ver Fase 7 do manual de implantação), que vai
// ajustar linguagem, base legal exata e cláusulas conforme a estrutura
// societária e o regime tributário definidos com o contador.

const ATUALIZADO_EM = '2026-10-08';

export const DOCUMENTOS = {
  termos: {
    titulo: 'Termos de Uso',
    secoes: [
      {
        titulo: '1. O que é o Konecta Já',
        paragrafos: [
          'O Konecta Já é uma plataforma digital que conecta pessoas que precisam de serviços ("clientes") a profissionais e empresas capazes de realizá-los ("prestadores"), permitindo solicitação, contratação, acompanhamento, pagamento e avaliação dos serviços por meio do aplicativo.',
          'O Konecta Já faz a conexão entre as partes e administra a plataforma — não é parte do serviço contratado, não executa os serviços anunciados e não é responsável pela qualidade da execução, que é de responsabilidade exclusiva do prestador.',
        ],
      },
      {
        titulo: '2. Cadastro',
        paragrafos: [
          'Para usar o Konecta Já, cliente e prestador devem se cadastrar informando nome completo, e-mail, telefone e CPF verdadeiros e atualizados.',
          'É proibido criar contas falsas, usar dados de terceiros sem autorização ou ter mais de uma conta ativa do mesmo tipo.',
          'O prestador declara ter capacidade técnica e, quando exigido por lei, a habilitação necessária para prestar o serviço anunciado.',
        ],
      },
      {
        titulo: '3. Como funciona a cobrança',
        paragrafos: [
          'O cliente paga o prestador diretamente (Pix ou dinheiro) pelo valor combinado do serviço — o Konecta Já não processa esse pagamento nem fica com o dinheiro em nenhum momento.',
          'O prestador escolhe, no cadastro, um entre dois modelos de cobrança da plataforma: (a) comissão de 5% sobre cada serviço marcado como concluído, ou (b) mensalidade fixa de R$ 25,00, independente da quantidade de serviços realizados no mês.',
          'Pedidos marcados como "urgentes" podem incluir uma taxa de urgência adicional, informada ao cliente antes da confirmação. Cupons de desconto, quando aplicáveis, são descontados do valor informado ao prestador antes da cobrança da comissão.',
          'O não pagamento da comissão ou da mensalidade pode suspender temporariamente o acesso do prestador a novos pedidos até a regularização.',
        ],
      },
      {
        titulo: '4. Cancelamento e reembolso',
        paragrafos: [
          'Veja a Política de Cancelamento e Reembolso (documento próprio) para as regras detalhadas sobre cancelamento de pedidos e devolução de valores.',
        ],
      },
      {
        titulo: '5. Avaliações',
        paragrafos: [
          'Depois de cada serviço, cliente e prestador podem avaliar um ao outro. As avaliações devem ser verdadeiras e respeitosas — avaliações falsas, ofensivas ou que exponham dados pessoais de terceiros podem ser removidas.',
        ],
      },
      {
        titulo: '6. Suspensão e exclusão de contas',
        paragrafos: [
          'O Konecta Já pode suspender ou excluir contas que violem estes Termos, pratiquem fraude, assediem outros usuários, ou coloquem em risco a segurança da plataforma ou de outros usuários.',
          'O usuário pode excluir a própria conta a qualquer momento, pela tela "Meu perfil" no app ou site. Ver a Política de Privacidade para o que acontece com os dados após a exclusão.',
        ],
      },
      {
        titulo: '7. Limitação de responsabilidade',
        paragrafos: [
          'O Konecta Já é um intermediário tecnológico. Não garante a disponibilidade, qualidade, pontualidade ou legalidade dos serviços anunciados pelos prestadores, nem se responsabiliza por danos decorrentes da execução (ou não execução) do serviço contratado entre cliente e prestador.',
          'Disputas sobre a qualidade do serviço prestado devem ser resolvidas prioritariamente entre cliente e prestador; o suporte do Konecta Já pode intermediar a conversa, mas não substitui vias legais cabíveis.',
        ],
      },
      {
        titulo: '8. Alterações destes Termos',
        paragrafos: [
          'Estes Termos podem ser atualizados para refletir mudanças no funcionamento da plataforma. Alterações relevantes serão comunicadas dentro do app.',
        ],
      },
      {
        titulo: '9. Legislação aplicável',
        paragrafos: [
          'Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro do domicílio do usuário para dirimir eventuais controvérsias, salvo disposição legal em contrário.',
        ],
      },
    ],
  },

  privacidade: {
    titulo: 'Política de Privacidade',
    secoes: [
      {
        titulo: '1. Quais dados coletamos',
        paragrafos: [
          'Dados de cadastro: nome, e-mail, telefone, CPF, senha (armazenada de forma criptografada, nunca em texto puro).',
          'Dados de endereço e localização: cidade, estado e, quando autorizado pelo navegador/app, coordenadas de latitude e longitude — usados para mostrar prestadores próximos e calcular distância.',
          'Fotos: foto de perfil e, para prestadores, fotos de trabalhos realizados (álbum).',
          'Dados de uso da plataforma: pedidos, mensagens de chat entre cliente e prestador, avaliações, tickets de suporte.',
          'Dados relacionados a pagamentos: histórico de confirmação de pagamento (quando e como o cliente diz ter pago) — o Konecta Já não armazena dados de cartão de crédito.',
        ],
      },
      {
        titulo: '2. Por que coletamos',
        paragrafos: [
          'Para viabilizar o funcionamento da plataforma: criar a conta, conectar cliente e prestador, calcular distância e proximidade, processar avaliações, dar suporte e cumprir obrigações legais e fiscais.',
          'Nunca vendemos dados pessoais a terceiros. Dados podem ser compartilhados com prestadores de serviço técnico estritamente necessários para operar a plataforma (ex.: hospedagem em nuvem, envio de notificações push), sob obrigação contratual de confidencialidade.',
        ],
      },
      {
        titulo: '3. Onde armazenamos e por quanto tempo',
        paragrafos: [
          'Os dados ficam armazenados em banco de dados na nuvem, protegido por senha e acesso restrito à equipe técnica.',
          'Mantemos os dados enquanto a conta estiver ativa. Após a exclusão da conta (ver seção 5), os dados pessoais são anonimizados — deixam de identificar a pessoa, mas o histórico de pedidos é preservado de forma anônima para manter a integridade dos registros da outra parte envolvida (ex.: o prestador que atendeu aquele pedido).',
        ],
      },
      {
        titulo: '4. Seus direitos (Lei Geral de Proteção de Dados — LGPD)',
        paragrafos: [
          'Você tem direito a: confirmar se tratamos seus dados; acessar seus dados; corrigir dados incompletos ou desatualizados; solicitar a anonimização ou exclusão de dados desnecessários; solicitar a portabilidade dos seus dados; e revogar o consentimento dado no cadastro (o que implica a exclusão da conta).',
          'Para acessar ou baixar seus dados, use a opção "Baixar meus dados" em "Meu perfil". Para excluir sua conta, use a opção "Excluir minha conta" na mesma tela — a exclusão é imediata e pode ser feita por você mesmo, sem precisar contatar o suporte.',
        ],
      },
      {
        titulo: '5. O que acontece quando você exclui sua conta',
        paragrafos: [
          'Nome, e-mail, telefone, CPF e foto de perfil são apagados/anonimizados. A senha é invalidada, então não é mais possível entrar na conta.',
          'Pedidos e mensagens já existentes não são apagados por completo, porque pertencem também à outra parte envolvida (o cliente ou prestador do outro lado daquele pedido) — eles permanecem associados a um registro anônimo ("Usuário removido"), sem te identificar.',
        ],
      },
      {
        titulo: '6. Segurança',
        paragrafos: [
          'Senhas são armazenadas com hash criptográfico (nunca em texto puro). O acesso de administradores à plataforma é controlado por login próprio, com níveis de permissão por cargo.',
        ],
      },
      {
        titulo: '7. Contato',
        paragrafos: [
          'Dúvidas sobre esta Política podem ser enviadas pelo canal de suporte dentro do próprio app ("Ajuda" → "Falar com um atendente").',
        ],
      },
    ],
  },

  cancelamento: {
    titulo: 'Política de Cancelamento e Reembolso',
    secoes: [
      {
        titulo: '1. Cancelamento antes do início do serviço',
        paragrafos: [
          'Cliente ou prestador podem cancelar um pedido enquanto ele ainda não foi marcado como "em andamento". Como o pagamento do serviço em si é feito diretamente entre cliente e prestador (Pix ou dinheiro, fora do app), não há valor retido pelo Konecta Já para devolver nessa etapa — o cancelamento apenas encerra a solicitação dentro da plataforma.',
        ],
      },
      {
        titulo: '2. Taxa de urgência',
        paragrafos: [
          'Quando o cliente marca um pedido como urgente e esse pedido é cancelado antes do prestador aceitar, nenhuma taxa é cobrada. Se o pedido já foi aceito, a cobrança da taxa de urgência segue as mesmas regras da comissão (seção 3 dos Termos de Uso) — negociações de reembolso nesse caso devem ser resolvidas com o suporte.',
        ],
      },
      {
        titulo: '3. Cupons de desconto',
        paragrafos: [
          'Cupons aplicados a um pedido cancelado antes da execução do serviço voltam a ficar disponíveis para uso em um novo pedido, salvo quando o próprio cupom tiver validade expirada.',
        ],
      },
      {
        titulo: '4. Serviço não realizado como contratado',
        paragrafos: [
          'Se o serviço não for realizado como combinado, cliente e prestador devem buscar primeiro um acordo direto. Caso não cheguem a um acordo, qualquer uma das partes pode abrir um chamado de suporte ("Ajuda" → "Falar com um atendente") para o Konecta Já intermediar a situação.',
          'Como o pagamento do serviço é feito diretamente entre as partes, eventuais reembolsos desse valor dependem do prestador devolver o valor ao cliente — o Konecta Já pode suspender a conta do prestador em caso de reincidência comprovada, mas não garante o reembolso financeiro em si, por não ser parte na transação.',
        ],
      },
      {
        titulo: '5. Cobrança da plataforma (comissão/mensalidade)',
        paragrafos: [
          'A comissão de 5% só é cobrada sobre serviços efetivamente marcados como concluídos. Serviços cancelados não geram comissão. A mensalidade fixa, quando esse for o modelo escolhido pelo prestador, não é reembolsável proporcionalmente em caso de poucos serviços realizados no mês, pois cobre o acesso à plataforma, não o volume de pedidos.',
        ],
      },
    ],
  },
};

export const ATUALIZADO_EM_LABEL = new Date(ATUALIZADO_EM + 'T00:00:00').toLocaleDateString(
  'pt-BR',
  { day: '2-digit', month: 'long', year: 'numeric' },
);
