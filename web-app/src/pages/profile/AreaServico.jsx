import { useEffect, useState } from 'react';
import { SubPaginaHeader } from '../../components/SubPaginaHeader';
import { meuPerfil } from '../../services/authService';
import { adicionarServico, removerServico } from '../../services/servicoPrestadorService';
import { CATEGORIAS } from '../../constants/categorias';
import { mensagemErro } from '../../utils/erro';

export function AreaServico() {
  const [servicos, setServicos] = useState(null);
  const [erro, setErro] = useState(null);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [novoValor, setNovoValor] = useState('');
  const [adicionando, setAdicionando] = useState(false);

  useEffect(() => {
    meuPerfil()
      .then((p) => setServicos(p.servicos ?? []))
      .catch((erro) => setErro(mensagemErro(erro, 'Não foi possível carregar seus dados.')));
  }, []);

  async function aoAdicionar(e) {
    e.preventDefault();
    if (!novaCategoria.trim()) return;

    setAdicionando(true);
    setErro(null);
    try {
      const servico = await adicionarServico({
        categoria: novaCategoria.trim(),
        valor: novoValor ? Number(novoValor.replace(',', '.')) : undefined,
      });
      setServicos((lista) => [...(lista ?? []), servico]);
      setNovaCategoria('');
      setNovoValor('');
    } catch (erro) {
      setErro(mensagemErro(erro, 'Não foi possível adicionar esse serviço.'));
    } finally {
      setAdicionando(false);
    }
  }

  async function aoRemover(servicoId) {
    try {
      await removerServico(servicoId);
      setServicos((lista) => lista.filter((s) => s.id !== servicoId));
    } catch (erro) {
      setErro(mensagemErro(erro, 'Não foi possível remover esse serviço.'));
    }
  }

  return (
    <div style={styles.pagina}>
      <SubPaginaHeader titulo="Área de serviço" />
      <div style={styles.container}>
        <p style={styles.ajuda}>
          Outros trabalhos que você também faz, além do seu serviço principal — aparecem no marketplace pros
          clientes (e outros prestadores) encontrarem, cada um com sua própria diária.
        </p>

        {erro && <p style={styles.erro}>{erro}</p>}

        {servicos === null ? (
          <p style={styles.info}>Carregando...</p>
        ) : (
          <>
            {servicos.length > 0 && (
              <div style={styles.listaServicos}>
                {servicos.map((servico) => (
                  <div key={servico.id} style={styles.itemServico}>
                    <div>
                      <div style={styles.itemServicoCategoria}>{servico.categoria}</div>
                      {servico.valor != null && (
                        <div style={styles.itemServicoValor}>R$ {Number(servico.valor).toFixed(2)}</div>
                      )}
                    </div>
                    <button style={styles.itemServicoRemover} onClick={() => aoRemover(servico.id)}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form style={styles.formServico} onSubmit={aoAdicionar}>
              <input
                style={styles.inputServicoCategoria}
                placeholder="Ex.: Encanador, Diarista..."
                list="categorias-sugestao"
                value={novaCategoria}
                onChange={(e) => setNovaCategoria(e.target.value)}
              />
              <datalist id="categorias-sugestao">
                {CATEGORIAS.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
              <input
                style={styles.inputServicoValor}
                placeholder="Diária (R$)"
                value={novoValor}
                onChange={(e) => setNovoValor(e.target.value)}
              />
              <button style={styles.botaoAdicionarServico} type="submit" disabled={adicionando}>
                {adicionando ? '...' : '+ Adicionar'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  pagina: { minHeight: '100vh' },
  container: { maxWidth: 480, margin: '0 auto', padding: '20px 24px 48px' },
  ajuda: { color: 'var(--konectaja-muted)', fontSize: 12.5, marginTop: 0, marginBottom: 16 },
  info: { color: 'var(--konectaja-muted)', fontSize: 13, textAlign: 'center', marginTop: 24 },
  erro: { color: 'var(--konectaja-red)', fontSize: 13, marginBottom: 12 },
  listaServicos: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 },
  itemServico: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'var(--konectaja-bg3)',
    borderRadius: 10,
    padding: '8px 12px',
  },
  itemServicoCategoria: { color: 'var(--konectaja-text-forte)', fontWeight: 600, fontSize: 13 },
  itemServicoValor: { color: 'var(--konectaja-laranja)', fontWeight: 700, fontSize: 12, marginTop: 2 },
  itemServicoRemover: {
    width: 24,
    height: 24,
    borderRadius: 12,
    border: 'none',
    background: 'transparent',
    color: 'var(--konectaja-muted)',
    fontSize: 13,
  },
  formServico: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  inputServicoCategoria: {
    flex: '1 1 160px',
    height: 44,
    borderRadius: 12,
    border: '1px solid var(--konectaja-border)',
    background: 'var(--konectaja-bg2)',
    color: 'var(--konectaja-text-forte)',
    padding: '0 14px',
    fontSize: 13,
  },
  inputServicoValor: {
    flex: '1 1 100px',
    height: 44,
    borderRadius: 12,
    border: '1px solid var(--konectaja-border)',
    background: 'var(--konectaja-bg2)',
    color: 'var(--konectaja-text-forte)',
    padding: '0 14px',
    fontSize: 13,
  },
  botaoAdicionarServico: {
    flex: '1 1 100%',
    height: 44,
    borderRadius: 12,
    border: 'none',
    background: 'var(--konectaja-laranja)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 13,
  },
};
