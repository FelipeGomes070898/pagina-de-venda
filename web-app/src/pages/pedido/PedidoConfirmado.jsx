import { useParams, useLocation, Link } from 'react-router-dom';

// Etapa atual: confirma que o pedido foi criado. O chat completo (que já
// existe no app mobile) é a próxima etapa a portar pra cá.
export function PedidoConfirmado() {
  const { pedidoId } = useParams();
  const location = useLocation();
  const prestadorNome = location.state?.prestadorNome || 'o prestador';

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.titulo}>Pedido enviado!</h1>
        <p style={styles.texto}>
          Sua solicitação para <strong>{prestadorNome}</strong> foi criada. Em breve o chat
          completo (negociação de valor, aceite e envio de endereço) estará disponível aqui —
          por enquanto essa etapa já funciona no app mobile.
        </p>
        <p style={styles.pedidoId}>Pedido #{pedidoId}</p>
        <Link style={styles.link} to="/">
          Voltar ao marketplace
        </Link>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: {
    width: 420,
    maxWidth: '100%',
    background: 'var(--vexo-bg2)',
    border: '1px solid var(--vexo-border)',
    borderRadius: 18,
    padding: 32,
    textAlign: 'center',
  },
  titulo: { color: '#fff', fontSize: 22, margin: '0 0 12px' },
  texto: { color: 'var(--vexo-text)', fontSize: 14, lineHeight: 1.5 },
  pedidoId: { color: 'var(--vexo-muted)', fontSize: 12, marginTop: 16 },
  link: { color: 'var(--vexo-laranja)', fontWeight: 600, textDecoration: 'none', display: 'inline-block', marginTop: 16 },
};
