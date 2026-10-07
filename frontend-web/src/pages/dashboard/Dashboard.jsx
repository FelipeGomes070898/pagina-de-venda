import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { estilosPagina as styles } from '../../styles/paginaAdmin';

export function Dashboard() {
  const admin = useAuthStore((s) => s.admin);
  const [resumo, setResumo] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    api
      .get('/admin/dashboard/resumo')
      .then(({ data }) => setResumo(data))
      .catch(() => setErro('Não foi possível carregar o resumo'));
  }, []);

  const porStatus = Object.fromEntries(
    (resumo?.prestadoresPorStatus || []).map((s) => [s.status, Number(s.quantidade)]),
  );
  const totalPrestadores = Object.values(porStatus).reduce((soma, n) => soma + n, 0);

  const pedidosPorStatus = Object.fromEntries(
    (resumo?.pedidosPorStatus || []).map((s) => [s.status, Number(s.quantidade)]),
  );
  const totalPedidos = Object.values(pedidosPorStatus).reduce((soma, n) => soma + n, 0);

  return (
    <div style={styles.container}>
      <h1 style={styles.titulo}>Olá, {admin.nome}</h1>
      <p style={styles.subtitulo}>Visão geral da plataforma</p>

      {erro && <p style={styles.erro}>{erro}</p>}

      {resumo && (
        <div style={styles.cards}>
          <div style={styles.card}>
            <div style={styles.cardLabel}>Prestadores</div>
            <div style={styles.cardValor}>{totalPrestadores}</div>
            <div style={styles.cardLabel}>
              {porStatus.ativo || 0} ativo(s) · {porStatus.inadimplente || 0} inadimplente(s) ·{' '}
              {porStatus.bloqueado || 0} bloqueado(s)
            </div>
          </div>
          <div style={styles.card}>
            <div style={styles.cardLabel}>Clientes</div>
            <div style={styles.cardValor}>{resumo.totalClientes}</div>
          </div>
          <div style={styles.card}>
            <div style={styles.cardLabel}>Pedidos</div>
            <div style={styles.cardValor}>{totalPedidos}</div>
            <div style={styles.cardLabel}>
              {pedidosPorStatus.concluido || 0} concluído(s) · {pedidosPorStatus.andamento || 0} em
              andamento · {pedidosPorStatus.pendente || 0} pendente(s)
            </div>
          </div>
          <div style={styles.card}>
            <div style={styles.cardLabel}>Cupons ativos</div>
            <div style={styles.cardValor}>{resumo.cuponsAtivos}</div>
          </div>
          <div style={styles.card}>
            <div style={styles.cardLabel}>Banners ativos</div>
            <div style={styles.cardValor}>{resumo.bannersAtivos}</div>
          </div>
        </div>
      )}
    </div>
  );
}
