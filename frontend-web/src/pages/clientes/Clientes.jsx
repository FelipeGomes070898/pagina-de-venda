import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { estilosPagina as styles, formatarData } from '../../styles/paginaAdmin';

export function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const { data } = await api.get('/admin/clientes', {
        params: { busca: busca || undefined, page: pagina },
      });
      setClientes(data.clientes);
      setTotal(data.total);
    } catch {
      setErro('Não foi possível carregar os clientes');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina]);

  function aoBuscar(e) {
    e.preventDefault();
    setPagina(1);
    carregar();
  }

  // Resolve login travado/senha esquecida sem precisar excluir a conta:
  // gera uma senha nova e mostra uma vez só, pro admin passar pro
  // cliente por telefone/WhatsApp.
  async function redefinirSenha(cliente) {
    if (!window.confirm(`Gerar uma nova senha temporária para ${cliente.nome}?`)) return;
    try {
      const { data } = await api.post(`/admin/clientes/${cliente.id}/redefinir-senha`);
      window.alert(
        `Senha temporária de ${cliente.nome}:\n\n${data.senhaTemporaria}\n\nPasse esse código pra ele por telefone ou WhatsApp — essa senha não aparece de novo.`,
      );
    } catch (e2) {
      setErro(e2.response?.data?.erro || 'Não foi possível redefinir a senha');
    }
  }

  const totalPaginas = Math.max(1, Math.ceil(total / 20));

  return (
    <div style={styles.container}>
      <h1 style={styles.titulo}>Clientes</h1>
      <p style={styles.subtitulo}>{total} cliente(s) cadastrado(s)</p>

      <form style={styles.filtros} onSubmit={aoBuscar}>
        <input
          style={styles.input}
          placeholder="Buscar por nome, e-mail ou CPF"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
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
                <th style={styles.th}>Cidade</th>
                <th style={styles.th}>Cadastrado em</th>
                <th style={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id}>
                  <td style={styles.td}>{c.nome}</td>
                  <td style={styles.td}>{c.email}</td>
                  <td style={styles.td}>{c.telefone}</td>
                  <td style={styles.td}>{c.cidade || '—'}</td>
                  <td style={styles.td}>{formatarData(c.criado_em)}</td>
                  <td style={styles.td}>
                    <button style={styles.linkBotao} onClick={() => redefinirSenha(c)}>
                      Redefinir senha
                    </button>
                  </td>
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
