import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { estilosPagina as styles } from '../../styles/paginaAdmin';

const ROTULOS_STATUS = {
  ativo: 'Ativo',
  inadimplente: 'Inadimplente',
  bloqueado: 'Bloqueado',
};

export function Prestadores() {
  const admin = useAuthStore((s) => s.admin);
  const podeAlterarStatus = ['dono', 'rh', 'gerente'].includes(admin.cargo);

  const [prestadores, setPrestadores] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const { data } = await api.get('/admin/prestadores', {
        params: { busca: busca || undefined, status: status || undefined, page: pagina },
      });
      setPrestadores(data.prestadores);
      setTotal(data.total);
    } catch {
      setErro('Não foi possível carregar os prestadores');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina, status]);

  function aoBuscar(e) {
    e.preventDefault();
    setPagina(1);
    carregar();
  }

  async function alterarStatus(prestador, novoStatus) {
    try {
      await api.patch(`/admin/prestadores/${prestador.id}/status`, { status: novoStatus });
      await carregar();
    } catch (e2) {
      setErro(e2.response?.data?.erro || 'Não foi possível alterar o status');
    }
  }

  const totalPaginas = Math.max(1, Math.ceil(total / 20));

  return (
    <div style={styles.container}>
      <h1 style={styles.titulo}>Prestadores</h1>
      <p style={styles.subtitulo}>{total} prestador(es) cadastrado(s)</p>

      <form style={styles.filtros} onSubmit={aoBuscar}>
        <input
          style={styles.input}
          placeholder="Buscar por nome, e-mail ou CPF"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <select
          style={styles.input}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPagina(1);
          }}
        >
          <option value="">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="inadimplente">Inadimplente</option>
          <option value="bloqueado">Bloqueado</option>
        </select>
        <button style={styles.botao} type="submit">
          Buscar
        </button>
      </form>

      {erro && <p style={styles.erro}>{erro}</p>}

      {carregando ? (
        <p style={styles.info}>Carregando...</p>
      ) : (
        <>
          <table style={styles.tabela}>
            <thead>
              <tr>
                <th style={styles.th}>Nome</th>
                <th style={styles.th}>E-mail</th>
                <th style={styles.th}>Telefone</th>
                <th style={styles.th}>Segmento</th>
                <th style={styles.th}>Cidade</th>
                <th style={styles.th}>Status</th>
                {podeAlterarStatus && <th style={styles.th}></th>}
              </tr>
            </thead>
            <tbody>
              {prestadores.map((p) => (
                <tr key={p.id}>
                  <td style={styles.td}>{p.nome}</td>
                  <td style={styles.td}>{p.email}</td>
                  <td style={styles.td}>{p.telefone}</td>
                  <td style={styles.td}>{p.segmento || '—'}</td>
                  <td style={styles.td}>{p.cidade || '—'}</td>
                  <td style={styles.td}>{ROTULOS_STATUS[p.status] || p.status}</td>
                  {podeAlterarStatus && (
                    <td style={styles.td}>
                      {p.status !== 'bloqueado' ? (
                        <button style={styles.linkBotao} onClick={() => alterarStatus(p, 'bloqueado')}>
                          Bloquear
                        </button>
                      ) : (
                        <button style={styles.linkBotao} onClick={() => alterarStatus(p, 'ativo')}>
                          Reativar
                        </button>
                      )}
                    </td>
                  )}
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
