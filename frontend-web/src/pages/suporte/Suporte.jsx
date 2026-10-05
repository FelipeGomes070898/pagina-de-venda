import { estilosPagina as styles } from '../../styles/paginaAdmin';

// Ainda não existe um sistema de tickets no banco — por enquanto, o
// atendimento ao prestador/cliente acontece pelo chat do próprio app
// (src/models/Mensagem.js). Esta tela reúne os canais e contatos úteis
// até que um módulo de suporte dedicado (fila de tickets) seja construído.
export function Suporte() {
  return (
    <div style={styles.container}>
      <h1 style={styles.titulo}>Suporte</h1>
      <p style={styles.subtitulo}>
        Ainda não existe uma fila de tickets dedicada — o atendimento a prestadores e clientes
        acontece hoje pelo chat do próprio app.
      </p>

      <div style={styles.cards}>
        <div style={styles.card}>
          <div style={styles.cardLabel}>Onde ver as conversas</div>
          <p style={{ color: 'var(--konectaja-text)', fontSize: 13, marginTop: 8 }}>
            Toda negociação entre cliente e prestador (incluindo problemas relatados) fica
            registrada no chat dentro do pedido, no app. Peça o ID do pedido pra localizar a
            conversa.
          </p>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>Ações disponíveis agora</div>
          <p style={{ color: 'var(--konectaja-text)', fontSize: 13, marginTop: 8 }}>
            Em <strong>Prestadores</strong> você pode bloquear/reativar uma conta em caso de
            denúncia ou fraude. Em <strong>Pagamentos</strong> você vê o histórico de cobranças de
            um prestador específico.
          </p>
        </div>
      </div>

      <p style={styles.info}>
        Próxima etapa planejada: uma fila de tickets própria (abertos pelo app, com status e
        histórico) em vez de depender só do chat do pedido.
      </p>
    </div>
  );
}
