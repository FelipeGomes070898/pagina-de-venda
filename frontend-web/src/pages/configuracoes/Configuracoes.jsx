import { useState } from 'react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { estilosPagina as styles } from '../../styles/paginaAdmin';
import { PasswordInput } from '../../components/common/PasswordInput';

export function Configuracoes() {
  const admin = useAuthStore((s) => s.admin);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [senhaNova, setSenhaNova] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(false);

  async function aoSalvar(e) {
    e.preventDefault();
    setErro(null);
    setSucesso(false);

    if (senhaNova !== confirmacao) {
      setErro('A confirmação não bate com a nova senha');
      return;
    }

    setSalvando(true);
    try {
      await api.patch('/admin/me/senha', { senhaAtual, senhaNova });
      setSenhaAtual('');
      setSenhaNova('');
      setConfirmacao('');
      setSucesso(true);
    } catch (e2) {
      setErro(e2.response?.data?.erro || 'Não foi possível trocar a senha');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.titulo}>Configurações</h1>
      <p style={styles.subtitulo}>Conta de {admin.nome}</p>

      <h2 style={{ ...styles.titulo, fontSize: 16, marginBottom: 12 }}>Trocar senha</h2>

      <form
        style={{ ...styles.card, maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 12 }}
        onSubmit={aoSalvar}
      >
        <PasswordInput
          style={styles.input}
          placeholder="Senha atual"
          value={senhaAtual}
          onChange={(e) => setSenhaAtual(e.target.value)}
          required
        />
        <PasswordInput
          style={styles.input}
          placeholder="Nova senha (mín. 8 caracteres)"
          value={senhaNova}
          onChange={(e) => setSenhaNova(e.target.value)}
          minLength={8}
          required
        />
        <PasswordInput
          style={styles.input}
          placeholder="Confirmar nova senha"
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
          minLength={8}
          required
        />

        {erro && <p style={styles.erro}>{erro}</p>}
        {sucesso && <p style={styles.sucesso}>Senha alterada com sucesso.</p>}

        <button style={styles.botao} type="submit" disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar nova senha'}
        </button>
      </form>
    </div>
  );
}
