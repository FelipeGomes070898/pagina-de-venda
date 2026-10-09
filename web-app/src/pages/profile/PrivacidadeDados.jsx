import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SubPaginaHeader } from '../../components/SubPaginaHeader';
import { useAuthStore } from '../../store/authStore';
import { exportarDados, excluirConta } from '../../services/authService';
import { mensagemErro } from '../../utils/erro';

export function PrivacidadeDados() {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const [erro, setErro] = useState(null);
  const [mostrarExcluir, setMostrarExcluir] = useState(false);
  const [senhaExcluir, setSenhaExcluir] = useState('');
  const [excluindo, setExcluindo] = useState(false);
  const [erroExcluir, setErroExcluir] = useState(null);

  // LGPD "portabilidade" — baixa um .json com os dados cadastrais.
  async function aoBaixarDados() {
    try {
      const resultado = await exportarDados();
      const blob = new Blob([JSON.stringify(resultado, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'konectaja-meus-dados.json';
      link.click();
      URL.revokeObjectURL(url);
    } catch (erro) {
      setErro(mensagemErro(erro, 'Não foi possível baixar seus dados.'));
    }
  }

  // LGPD "direito ao esquecimento" — exige a senha atual antes de
  // anonimizar a conta (ver backend/src/controllers/authController.js).
  async function aoConfirmarExclusao(e) {
    e.preventDefault();
    if (!senhaExcluir) return;

    setExcluindo(true);
    setErroExcluir(null);
    try {
      await excluirConta(senhaExcluir);
      logout();
      navigate('/login');
    } catch (erro) {
      setErroExcluir(mensagemErro(erro, 'Não foi possível excluir sua conta.'));
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <div style={styles.pagina}>
      <SubPaginaHeader titulo="Privacidade e dados" />
      <div style={styles.container}>
        {erro && <p style={styles.erro}>{erro}</p>}

        <div style={styles.secao}>
          <h2 style={styles.secaoTitulo}>Seus dados (LGPD)</h2>
          <Link style={styles.linkPrivacidade} to="/legal/privacidade">
            Ver Política de Privacidade
          </Link>
          <Link style={styles.linkPrivacidade} to="/legal/termos">
            Ver Termos de Uso
          </Link>
          <button type="button" style={styles.botaoSecundario} onClick={aoBaixarDados}>
            Baixar meus dados
          </button>
        </div>

        <button type="button" style={styles.botaoExcluir} onClick={() => setMostrarExcluir(true)}>
          Excluir minha conta
        </button>
      </div>

      {mostrarExcluir && (
        <div style={styles.modalFundo} onClick={() => !excluindo && setMostrarExcluir(false)}>
          <form style={styles.modalCard} onClick={(e) => e.stopPropagation()} onSubmit={aoConfirmarExclusao}>
            <h2 style={styles.modalTitulo}>Excluir sua conta</h2>
            <p style={styles.modalTexto}>
              Isso remove seus dados pessoais (nome, e-mail, telefone, CPF, foto) do Konecta Já e bloqueia o
              acesso à conta imediatamente. Pedidos já feitos continuam existindo pra outra parte envolvida,
              mas sem te identificar. Essa ação não pode ser desfeita.
            </p>
            <input
              type="password"
              style={styles.modalInput}
              placeholder="Confirme sua senha"
              value={senhaExcluir}
              onChange={(e) => setSenhaExcluir(e.target.value)}
              autoFocus
            />
            {erroExcluir && <p style={styles.erro}>{erroExcluir}</p>}
            <div style={styles.modalBotoes}>
              <button
                type="button"
                style={styles.botaoSecundario}
                onClick={() => setMostrarExcluir(false)}
                disabled={excluindo}
              >
                Cancelar
              </button>
              <button type="submit" style={styles.botaoExcluirConfirmar} disabled={excluindo}>
                {excluindo ? 'Excluindo...' : 'Excluir conta'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const styles = {
  pagina: { minHeight: '100vh' },
  container: { maxWidth: 480, margin: '0 auto', padding: '20px 24px 48px' },
  erro: { color: 'var(--konectaja-red)', fontSize: 13, marginBottom: 12 },
  secao: {
    background: 'var(--konectaja-bg2)',
    border: '1px solid var(--konectaja-border)',
    borderRadius: 14,
    padding: 16,
  },
  secaoTitulo: { color: 'var(--konectaja-text-forte)', fontSize: 14, fontWeight: 700, marginBottom: 12, marginTop: 0 },
  linkPrivacidade: {
    display: 'block',
    color: 'var(--konectaja-azul)',
    fontSize: 13,
    fontWeight: 600,
    textDecoration: 'none',
    marginBottom: 10,
  },
  botaoSecundario: {
    height: 40,
    borderRadius: 10,
    border: '1px solid var(--konectaja-border)',
    background: 'var(--konectaja-bg3)',
    color: 'var(--konectaja-text-forte)',
    fontWeight: 600,
    fontSize: 13,
    padding: '0 16px',
  },
  botaoExcluir: {
    width: '100%',
    height: 40,
    borderRadius: 12,
    border: 'none',
    background: 'transparent',
    color: 'var(--konectaja-red)',
    fontWeight: 600,
    fontSize: 13,
    marginTop: 20,
  },
  modalFundo: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(28, 25, 23, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 1000,
  },
  modalCard: {
    width: 380,
    maxWidth: '100%',
    background: 'var(--konectaja-bg2)',
    borderRadius: 18,
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    boxShadow: 'var(--konectaja-shadow-lg)',
  },
  modalTitulo: { color: 'var(--konectaja-text-forte)', fontSize: 18, margin: 0 },
  modalTexto: { color: 'var(--konectaja-muted)', fontSize: 13, lineHeight: 1.6, margin: 0 },
  modalInput: {
    height: 44,
    borderRadius: 10,
    border: '1px solid var(--konectaja-border)',
    background: 'var(--konectaja-bg3)',
    color: 'var(--konectaja-text-forte)',
    padding: '0 12px',
    fontSize: 14,
  },
  modalBotoes: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 },
  botaoExcluirConfirmar: {
    height: 40,
    borderRadius: 10,
    border: 'none',
    background: 'var(--konectaja-red)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 13,
    padding: '0 16px',
  },
};
