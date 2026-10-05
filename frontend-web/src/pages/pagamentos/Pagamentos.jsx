import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { estilosPagina as styles, formatarData, formatarMoeda } from '../../styles/paginaAdmin';

const ROTULOS_STATUS = { pendente: 'Pendente', pago: 'Pago', vencido: 'Vencido' };
const ROTULOS_TIPO = { taxa_servico: 'Taxa de serviço (5%)', assinatura_mensal: 'Assinatura mensal' };

export function Pagamentos() {
  const [pagamentos, setPagamentos] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [status, setStatus] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const { data } = await api.get('/admin/pagamentos', {
        params: { status: status || undefined, page: pagina },
      });
      setPagamentos(data.pagamentos);
      setTotal(data.total);
    } catch {
      setErro('Não foi possível carregar os pagamentos');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina, status]);

  const totalPaginas = Math.max(1, Math.ceil(total / 20));

  return (
    <div style={styles.container}>
      <h1 style={styles.titulo}>Pagamentos</h1>
      <p style={styles.subtitulo}>{total} pagamento(s) no total</p>

      <form style={styles.filtros} onSubmit={(e) => e.preventDefault()}>
        <select
          style={styles.input}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPagina(1);
          }}
        >
          <option value="">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="pago">Pago</option>
          <option value="vencido">Vencido</option>
        </select>
      </form>

      {erro && <p style={styles.erro}>{erro}</p>}

      {carregando ? (
        <p style={styles.info}>Carregando...</p>
      ) : (
        <>
          <table style={styles.tabela}>
            <thead>
              <tr>
                <th style={styles.th}>Prestador</th>
                <th style={styles.th}>Tipo</th>
                <th style={styles.th}>Valor</th>
                <th style={styles.th}>Método</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Vencimento</th>
                <th style={styles.th}>Pago em</th>
              </tr>
            </thead>
            <tbody>
              {pagamentos.map((p) => (
                <tr key={p.id}>
                  <td style={styles.td}>
                    {p.prestador_nome}
                    <div style={{ color: 'var(--konectaja-muted)', fontSize: 11 }}>
                      {p.prestador_email}
                    </div>
                  </td>
                  <td style={styles.td}>{ROTULOS_TIPO[p.tipo] || p.tipo}</td>
                  <td style={styles.td}>{formatarMoeda(p.valor)}</td>
                  <td style={styles.td}>{p.metodo || '—'}</td>
                  <td style={styles.td}>{ROTULOS_STATUS[p.status] || p.status}</td>
                  <td style={styles.td}>{formatarData(p.vencimento)}</td>
                  <td style={styles.td}>{formatarData(p.pago_em)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={styles.paginacao}>
            <button
              style={styles.linkBotao}
              disabled={pagina <= 1}
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
            >
              Anterior
            </button>
            <span style={styles.info}>
              Página {pagina} de {totalPaginas}
            </span>
            <button
              style={styles.linkBotao}
              disabled={pagina >= totalPaginas}
              onClick={() => setPagina((p) => p + 1)}
            >
              Próxima
            </button>
          </div>
        </>
      )}
    </div>
  );
}
