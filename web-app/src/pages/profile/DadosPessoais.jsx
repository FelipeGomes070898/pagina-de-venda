import { useEffect, useState } from 'react';
import { SubPaginaHeader } from '../../components/SubPaginaHeader';
import { meuPerfil } from '../../services/authService';
import { mascararCPF, mascararTelefoneBR } from '../../utils/masks';
import { mensagemErro } from '../../utils/erro';

export function DadosPessoais() {
  const [perfil, setPerfil] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    meuPerfil()
      .then(setPerfil)
      .catch((erro) => setErro(mensagemErro(erro, 'Não foi possível carregar seus dados.')));
  }, []);

  return (
    <div style={styles.pagina}>
      <SubPaginaHeader titulo="Dados pessoais" />
      <div style={styles.container}>
        {erro && <p style={styles.erro}>{erro}</p>}
        {!perfil && !erro ? (
          <p style={styles.info}>Carregando...</p>
        ) : (
          perfil && (
            <div style={styles.secao}>
              <Campo label="Nome" valor={perfil.nome} />
              <Campo label="E-mail" valor={perfil.email} />
              <Campo label="Telefone" valor={perfil.telefone ? mascararTelefoneBR(perfil.telefone) : '—'} />
              <Campo label="CPF" valor={perfil.cpf ? mascararCPF(perfil.cpf) : '—'} />
              <Campo label="Cidade" valor={perfil.cidade || '—'} />
              <Campo label="Estado" valor={perfil.estado || '—'} />
            </div>
          )
        )}
      </div>
    </div>
  );
}

function Campo({ label, valor }) {
  return (
    <div style={styles.campo}>
      <span style={styles.campoLabel}>{label}</span>
      <span style={styles.campoValor}>{valor}</span>
    </div>
  );
}

const styles = {
  pagina: { minHeight: '100vh' },
  container: { maxWidth: 480, margin: '0 auto', padding: '20px 24px 48px' },
  info: { color: 'var(--konectaja-muted)', fontSize: 13, textAlign: 'center', marginTop: 24 },
  erro: { color: 'var(--konectaja-red)', fontSize: 13, textAlign: 'center', marginBottom: 12 },
  secao: {
    background: 'var(--konectaja-bg2)',
    border: '1px solid var(--konectaja-border)',
    borderRadius: 14,
    padding: 16,
  },
  campo: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid var(--konectaja-border)',
    fontSize: 13,
  },
  campoLabel: { color: 'var(--konectaja-muted)' },
  campoValor: { color: 'var(--konectaja-text-forte)', fontWeight: 600, textAlign: 'right' },
};
