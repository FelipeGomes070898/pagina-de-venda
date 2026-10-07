import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { estilosPagina as styles, formatarMoeda } from '../../styles/paginaAdmin';

export function Financeiro() {
  const [resumo, setResumo] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    api
      .get('/admin/financeiro/resumo')
      .then(({ data }) => setResumo(data))
      .catch(() => setErro('Não foi possível carregar o resumo financeiro'))
      .finally(() => setCarregando(false));
  }, []);

  const porStatus = Object.fromEntries((resumo?.porStatus || []).map((s) => [s.status, s]));
  const totalRecebido = porStatus.pago?.total || 0;
  const totalPendente = porStatus.pendente?.total || 0;
  const totalVencido = porStatus.vencido?.total || 0;
  const negocio = resumo?.negocio || {};

  return (
    <div style={styles.container}>
      <h1 style={styles.titulo}>Financeiro</h1>
      <p style={styles.subtitulo}>Receita da plataforma (taxas de serviço e assinaturas)</p>

      {erro && <p style={styles.erro}>{erro}</p>}

      {carregando ? (
        <p style={styles.info}>Carregando...</p>
      ) : (
        <>
          <div style={styles.cards}>
            <div style={styles.card}>
              <div style={styles.cardLabel}>Recebido</div>
              <div style={{ ...styles.cardValor, color: 'var(--konectaja-verde)' }}>
                {formatarMoeda(totalRecebido)}
              </div>
              <div style={styles.cardLabel}>{porStatus.pago?.quantidade || 0} pagamento(s)</div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardLabel}>Pendente</div>
              <div style={styles.cardValor}>{formatarMoeda(totalPendente)}</div>
              <div style={styles.cardLabel}>{porStatus.pendente?.quantidade || 0} pagamento(s)</div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardLabel}>Vencido</div>
              <div style={{ ...styles.cardValor, color: 'var(--konectaja-red)' }}>
                {formatarMoeda(totalVencido)}
              </div>
              <div style={styles.cardLabel}>{porStatus.vencido?.quantidade || 0} pagamento(s)</div>
            </div>
          </div>

          <h2 style={{ ...styles.titulo, fontSize: 16, marginBottom: 12 }}>
            Negócio (pedidos concluídos)
          </h2>
          <div style={styles.cards}>
            <div style={styles.card}>
              <div style={styles.cardLabel}>GMV</div>
              <div style={styles.cardValor}>{formatarMoeda(negocio.gmv)}</div>
              <div style={styles.cardLabel}>{negocio.total_concluidos || 0} serviço(s) concluído(s)</div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardLabel}>Ticket médio</div>
              <div style={styles.cardValor}>{formatarMoeda(negocio.ticket_medio)}</div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardLabel}>Receita de urgência</div>
              <div style={{ ...styles.cardValor, color: 'var(--konectaja-verde)' }}>
                {formatarMoeda(negocio.receita_urgencia)}
              </div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardLabel}>Desconto dado em cupons</div>
              <div style={{ ...styles.cardValor, color: 'var(--konectaja-red)' }}>
                {formatarMoeda(negocio.desconto_cupons)}
              </div>
            </div>
          </div>

          <h2 style={{ ...styles.titulo, fontSize: 16, marginBottom: 12 }}>
            Receita recebida nos últimos 6 meses
          </h2>
          {resumo.porMes.length === 0 ? (
            <p style={styles.info}>Ainda não há pagamentos recebidos nesse período.</p>
          ) : (
            <table style={styles.tabela}>
              <thead>
                <tr>
                  <th style={styles.th}>Mês</th>
                  <th style={styles.th}>Total recebido</th>
                </tr>
              </thead>
              <tbody>
                {resumo.porMes.map((m) => (
                  <tr key={m.mes}>
                    <td style={styles.td}>{m.mes}</td>
                    <td style={styles.td}>{formatarMoeda(m.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}
