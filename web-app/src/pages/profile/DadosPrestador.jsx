import { useEffect, useState } from 'react';
import { SubPaginaHeader } from '../../components/SubPaginaHeader';
import { meuPerfil } from '../../services/authService';
import { mensagemErro } from '../../utils/erro';

const ROTULOS_COBRANCA = {
  percentual: '5% por serviço concluído',
  fixo_mensal: 'R$ 25,00 fixo por mês',
};

export function DadosPrestador() {
  const [perfil, setPerfil] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    meuPerfil()
      .then(setPerfil)
      .catch((erro) => setErro(mensagemErro(erro, 'Não foi possível carregar seus dados.')));
  }, []);

  return (
    <div style={styles.pagina}>
      <SubPaginaHeader titulo="Dados de prestador" />
      <div style={styles.container}>
        {erro && <p style={styles.erro}>{erro}</p>}
        {!perfil && !erro ? (
          <p style={styles.info}>Carregando...</p>
        ) : (
          perfil && (
            <div style={styles.secao}>
              <Campo label="Serviço oferecido" valor={perfil.segmento || '—'} />
              <Campo
                label="Valor do serviço"
                valor={perfil.valor_servico != null ? `R$ ${Number(perfil.valor_servico).toFixed(2)}` : '—'}
              />
              <Campo label="Cobrança da plataforma" valor={ROTULOS_COBRANCA[perfil.modelo_cobranca] || '—'} />
              <Campo
                label="Avaliação"
                valor={`★ ${Number(perfil.avaliacao ?? 5).toFixed(1)} (${perfil.total_avaliacoes ?? 0} avaliações)`}
              />
              <Campo label="Serviços concluídos" valor={String(perfil.total_servicos ?? 0)} />
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
