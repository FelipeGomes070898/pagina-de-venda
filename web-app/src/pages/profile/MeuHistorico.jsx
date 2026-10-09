import { useEffect, useState } from 'react';
import { SubPaginaHeader } from '../../components/SubPaginaHeader';
import { meuPerfil } from '../../services/authService';
import { mensagemErro } from '../../utils/erro';

export function MeuHistorico() {
  const [perfil, setPerfil] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    meuPerfil()
      .then(setPerfil)
      .catch((erro) => setErro(mensagemErro(erro, 'Não foi possível carregar seus dados.')));
  }, []);

  return (
    <div style={styles.pagina}>
      <SubPaginaHeader titulo="Meu histórico" />
      <div style={styles.container}>
        {erro && <p style={styles.erro}>{erro}</p>}
        {!perfil && !erro ? (
          <p style={styles.info}>Carregando...</p>
        ) : (
          perfil && (
            <div style={styles.secao}>
              <Campo label="Serviços contratados" valor={String(perfil.total_servicos ?? 0)} />
              <Campo
                label="Avaliação dos prestadores"
                valor={
                  perfil.total_avaliacoes
                    ? `★ ${Number(perfil.avaliacao ?? 5).toFixed(1)} (${perfil.total_avaliacoes} avaliações)`
                    : 'Ainda sem avaliações'
                }
              />
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
