import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { estilosPagina as styles } from '../../styles/paginaAdmin';

const VAZIO = { titulo: '', imagemUrl: '', linkUrl: '', ordem: '' };

export function Banners() {
  const admin = useAuthStore((s) => s.admin);
  const podeGerenciar = ['dono', 'rh', 'gerente'].includes(admin.cargo);

  const [banners, setBanners] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState(VAZIO);

  async function carregar() {
    setCarregando(true);
    try {
      const { data } = await api.get('/admin/banners');
      setBanners(data);
    } catch {
      setErro('Não foi possível carregar os banners');
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
      await api.post('/admin/banners', { ...form, ordem: form.ordem ? Number(form.ordem) : 0 });
      setForm(VAZIO);
      await carregar();
    } catch (e2) {
      setErro(e2.response?.data?.erro || 'Não foi possível criar o banner');
    } finally {
      setSalvando(false);
    }
  }

  async function alternarStatus(banner) {
    try {
      await api.patch(`/admin/banners/${banner.id}/status`, { ativo: !banner.ativo });
      await carregar();
    } catch (e2) {
      setErro(e2.response?.data?.erro || 'Não foi possível alterar o status');
    }
  }

  async function remover(banner) {
    if (!window.confirm('Remover este banner?')) return;
    try {
      await api.delete(`/admin/banners/${banner.id}`);
      await carregar();
    } catch (e2) {
      setErro(e2.response?.data?.erro || 'Não foi possível remover o banner');
    }
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.titulo}>Banners</h1>
      <p style={styles.subtitulo}>Exibidos no topo do marketplace (app e site), em ordem crescente.</p>

      {podeGerenciar && (
        <form style={formStyles.form} onSubmit={aoCriar}>
          <input
            style={styles.input}
            placeholder="Título (opcional)"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          />
          <input
            style={{ ...styles.input, minWidth: 280 }}
            placeholder="URL da imagem"
            value={form.imagemUrl}
            onChange={(e) => setForm({ ...form, imagemUrl: e.target.value })}
            required
          />
          <input
            style={styles.input}
            placeholder="URL de destino (opcional)"
            value={form.linkUrl}
            onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
          />
          <input
            style={styles.input}
            type="number"
            placeholder="Ordem"
            value={form.ordem}
            onChange={(e) => setForm({ ...form, ordem: e.target.value })}
          />
          <button style={styles.botao} type="submit" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Criar banner'}
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
              <th style={styles.th}>Preview</th>
              <th style={styles.th}>Título</th>
              <th style={styles.th}>Ordem</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {banners.map((b) => (
              <tr key={b.id}>
                <td style={styles.td}>
                  <img src={b.imagem_url} alt={b.titulo || ''} style={{ width: 120, height: 48, objectFit: 'cover', borderRadius: 6 }} />
                </td>
                <td style={styles.td}>{b.titulo || '—'}</td>
                <td style={styles.td}>{b.ordem}</td>
                <td style={styles.td}>{b.ativo ? 'Ativo' : 'Inativo'}</td>
                <td style={{ ...styles.td, display: 'flex', gap: 12 }}>
                  {podeGerenciar && (
                    <>
                      <button style={styles.linkBotao} onClick={() => alternarStatus(b)}>
                        {b.ativo ? 'Desativar' : 'Reativar'}
                      </button>
                      <button style={styles.linkBotao} onClick={() => remover(b)}>
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
