import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { estilosPagina as styles, formatarData } from '../../styles/paginaAdmin';

const VAZIO = { codigo: '', tipo: 'percentual', valor: '', descricao: '', validadeFim: '', limiteUso: '' };

export function Cupons() {
  const admin = useAuthStore((s) => s.admin);
  const podeGerenciar = ['dono', 'rh', 'gerente'].includes(admin.cargo);

  const [cupons, setCupons] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState(VAZIO);

  async function carregar() {
    setCarregando(true);
    try {
      const { data } = await api.get('/admin/cupons');
      setCupons(data);
    } catch {
      setErro('Não foi possível carregar os cupons');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function aoCriar(e) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    try {
      await api.post('/admin/cupons', {
        ...form,
        valor: Number(form.valor),
        limiteUso: form.limiteUso ? Number(form.limiteUso) : null,
        validadeFim: form.validadeFim || null,
      });
      setForm(VAZIO);
      await carregar();
    } catch (e2) {
      setErro(e2.response?.data?.erro || 'Não foi possível criar o cupom');
    } finally {
      setSalvando(false);
    }
  }

  async function alternarStatus(cupom) {
    try {
      await api.patch(`/admin/cupons/${cupom.id}/status`, { ativo: !cupom.ativo });
      await carregar();
    } catch (e2) {
      setErro(e2.response?.data?.erro || 'Não foi possível alterar o status');
    }
  }

  async function remover(cupom) {
    if (!window.confirm(`Remover o cupom ${cupom.codigo}?`)) return;
    try {
      await api.delete(`/admin/cupons/${cupom.id}`);
      await carregar();
    } catch (e2) {
      setErro(e2.response?.data?.erro || 'Não foi possível remover o cupom');
    }
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.titulo}>Cupons</h1>
      <p style={styles.subtitulo}>Desconto percentual ou fixo aplicado na criação do pedido.</p>

      {podeGerenciar && (
        <form style={formStyles.form} onSubmit={aoCriar}>
          <input
            style={styles.input}
            placeholder="Código (ex: BEMVINDO10)"
            value={form.codigo}
            onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
            required
          />
          <select
            style={styles.input}
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
          >
            <option value="percentual">Percentual (%)</option>
            <option value="fixo">Fixo (R$)</option>
          </select>
          <input
            style={styles.input}
            type="number"
            step="0.01"
            min="0"
            placeholder={form.tipo === 'percentual' ? 'Ex: 10' : 'Ex: 20.00'}
            value={form.valor}
            onChange={(e) => setForm({ ...form, valor: e.target.value })}
            required
          />
          <input
            style={styles.input}
            placeholder="Descrição (opcional)"
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          />
          <input
            style={styles.input}
            type="date"
            value={form.validadeFim}
            onChange={(e) => setForm({ ...form, validadeFim: e.target.value })}
          />
          <input
            style={styles.input}
            type="number"
            min="1"
            placeholder="Limite de usos (opcional)"
            value={form.limiteUso}
            onChange={(e) => setForm({ ...form, limiteUso: e.target.value })}
          />
          <button style={styles.botao} type="submit" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Criar cupom'}
          </button>
        </form>
      )}

      {erro && <p style={styles.erro}>{erro}</p>}

      {carregando ? (
        <p style={styles.info}>Carregando...</p>
      ) : (
        <table style={styles.tabela}>
          <thead>
            <tr>
              <th style={styles.th}>Código</th>
              <th style={styles.th}>Tipo</th>
              <th style={styles.th}>Valor</th>
              <th style={styles.th}>Validade</th>
              <th style={styles.th}>Usos</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {cupons.map((c) => (
              <tr key={c.id}>
                <td style={styles.td}>{c.codigo}</td>
                <td style={styles.td}>{c.tipo === 'percentual' ? 'Percentual' : 'Fixo'}</td>
                <td style={styles.td}>{c.tipo === 'percentual' ? `${c.valor}%` : `R$ ${c.valor}`}</td>
                <td style={styles.td}>{c.validade_fim ? formatarData(c.validade_fim) : 'Sem validade'}</td>
                <td style={styles.td}>
                  {c.usos}
                  {c.limite_uso ? ` / ${c.limite_uso}` : ''}
                </td>
                <td style={styles.td}>{c.ativo ? 'Ativo' : 'Inativo'}</td>
                <td style={{ ...styles.td, display: 'flex', gap: 12 }}>
                  {podeGerenciar && (
                    <>
                      <button style={styles.linkBotao} onClick={() => alternarStatus(c)}>
                        {c.ativo ? 'Desativar' : 'Reativar'}
                      </button>
                      <button style={styles.linkBotao} onClick={() => remover(c)}>
                        Remover
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const formStyles = {
  form: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 12,
    background: 'var(--konectaja-bg2)',
    border: '1px solid var(--konectaja-border)',
    borderRadius: 14,
    padding: 20,
    marginBottom: 24,
    alignItems: 'end',
  },
};
