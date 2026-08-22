import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

// dono pode criar rh/gerente/atendimento; rh pode criar gerente/atendimento
const CARGOS_CRIAVEIS = {
  dono: ['rh', 'gerente', 'atendimento'],
  rh: ['gerente', 'atendimento'],
};

const ROTULOS_CARGO = {
  dono: 'Dono',
  rh: 'RH',
  gerente: 'Gerente',
  atendimento: 'Atendimento',
};

export function Equipe() {
  const admin = useAuthStore((s) => s.admin);
  const cargosDisponiveis = CARGOS_CRIAVEIS[admin.cargo] || [];

  const [equipe, setEquipe] = useState([]);
  const [divisoes, setDivisoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    cargo: cargosDisponiveis[0] || '',
    divisaoId: '',
  });

  async function carregar() {
    setCarregando(true);
    try {
      const [{ data: adminsData }, { data: divisoesData }] = await Promise.all([
        api.get('/admin/equipe'),
        api.get('/admin/divisoes'),
      ]);
      setEquipe(adminsData);
      setDivisoes(divisoesData);
    } catch {
      setErro('Não foi possível carregar a equipe');
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
      await api.post('/admin/equipe', {
        ...form,
        divisaoId: form.cargo === 'gerente' ? form.divisaoId : null,
      });
      setForm({ nome: '', email: '', senha: '', cargo: cargosDisponiveis[0] || '', divisaoId: '' });
      await carregar();
    } catch (e2) {
      setErro(e2.response?.data?.erro || 'Não foi possível criar o membro da equipe');
    } finally {
      setSalvando(false);
    }
  }

  async function alternarStatus(membro) {
    try {
      await api.patch(`/admin/equipe/${membro.id}/status`, { ativo: !membro.ativo });
      await carregar();
    } catch (e2) {
      setErro(e2.response?.data?.erro || 'Não foi possível alterar o status');
    }
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.titulo}>Equipe</h1>
      <p style={styles.subtitulo}>
        Gestão hierárquica: dono cadastra RH, gerentes e atendimento; RH cadastra gerentes e
        atendimento.
      </p>

      {cargosDisponiveis.length > 0 && (
        <form style={styles.form} onSubmit={aoCriar}>
          <input
            style={styles.input}
            placeholder="Nome"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            required
          />
          <input
            style={styles.input}
            type="email"
            placeholder="E-mail"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Senha provisória"
            value={form.senha}
            onChange={(e) => setForm({ ...form, senha: e.target.value })}
            required
          />
          <select
            style={styles.input}
            value={form.cargo}
            onChange={(e) => setForm({ ...form, cargo: e.target.value })}
          >
            {cargosDisponiveis.map((cargo) => (
              <option key={cargo} value={cargo}>
                {ROTULOS_CARGO[cargo]}
              </option>
            ))}
          </select>
          {form.cargo === 'gerente' && (
            <select
              style={styles.input}
              value={form.divisaoId}
              onChange={(e) => setForm({ ...form, divisaoId: e.target.value })}
              required
            >
              <option value="">Selecione a divisão</option>
              {divisoes.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome}
                </option>
              ))}
            </select>
          )}
          <button style={styles.botao} type="submit" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Adicionar à equipe'}
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
              <th style={styles.th}>Nome</th>
              <th style={styles.th}>E-mail</th>
              <th style={styles.th}>Cargo</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {equipe.map((membro) => (
              <tr key={membro.id}>
                <td style={styles.td}>{membro.nome}</td>
                <td style={styles.td}>{membro.email}</td>
                <td style={styles.td}>{ROTULOS_CARGO[membro.cargo] || membro.cargo}</td>
                <td style={styles.td}>{membro.ativo ? 'Ativo' : 'Inativo'}</td>
                <td style={styles.td}>
                  {membro.cargo !== 'dono' && membro.id !== admin.id && (
                    <button style={styles.linkBotao} onClick={() => alternarStatus(membro)}>
                      {membro.ativo ? 'Desativar' : 'Reativar'}
                    </button>
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

const styles = {
  container: { padding: 32 },
  titulo: { color: '#fff', fontSize: 22, margin: 0 },
  subtitulo: { color: 'var(--vexo-muted)', fontSize: 13, marginTop: 4, marginBottom: 24 },
  form: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 12,
    background: 'var(--vexo-bg2)',
    border: '1px solid var(--vexo-border)',
    borderRadius: 14,
    padding: 20,
    marginBottom: 24,
    alignItems: 'end',
  },
  input: {
    height: 42,
    borderRadius: 8,
    border: '1px solid var(--vexo-border)',
    background: 'var(--vexo-bg3)',
    color: '#fff',
    padding: '0 10px',
    fontSize: 13,
  },
  botao: {
    height: 42,
    borderRadius: 8,
    border: 'none',
    background: 'var(--vexo-roxo)',
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
  },
  erro: { color: 'var(--vexo-red)', fontSize: 13 },
  info: { color: 'var(--vexo-muted)' },
  tabela: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left',
    color: 'var(--vexo-muted)',
    fontSize: 12,
    padding: '8px 12px',
    borderBottom: '1px solid var(--vexo-border)',
  },
  td: {
    color: 'var(--vexo-text)',
    fontSize: 13,
    padding: '10px 12px',
    borderBottom: '1px solid var(--vexo-border)',
  },
  linkBotao: {
    background: 'transparent',
    border: 'none',
    color: 'var(--vexo-laranja)',
    cursor: 'pointer',
    fontSize: 13,
    padding: 0,
  },
};
