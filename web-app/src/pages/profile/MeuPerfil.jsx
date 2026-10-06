import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { NavHeader } from '../../components/NavHeader';
import { meuPerfil } from '../../services/authService';
import { mascararCPF, mascararTelefoneBR } from '../../utils/masks';

const ROTULOS_TIPO = { cliente: 'Cliente', prestador: 'Prestador de serviço' };
const ROTULOS_COBRANCA = {
  percentual: '5% por serviço concluído',
  fixo_mensal: 'R$ 25,00 fixo por mês',
};

export function MeuPerfil() {
  const logout = useAuthStore((s) => s.logout);

  const [perfil, setPerfil] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    meuPerfil()
      .then(setPerfil)
      .catch(() => setErro('Não foi possível carregar seus dados.'))
      .finally(() => setCarregando(false));
  }, []);

  if (carregando) {
    return (
      <div style={styles.pagina}>
        <NavHeader />
        <div style={styles.centro}>Carregando...</div>
      </div>
    );
  }
  if (erro || !perfil) {
    return (
      <div style={styles.pagina}>
        <NavHeader />
        <div style={styles.centro}>{erro || 'Perfil não encontrado.'}</div>
      </div>
    );
  }

  return (
    <div style={styles.pagina}>
      <NavHeader />

      <div style={styles.container}>
        <div style={styles.avatar}>{perfil.nome.charAt(0).toUpperCase()}</div>
        <h1 style={styles.nome}>{perfil.nome}</h1>
        <p style={styles.tipo}>{ROTULOS_TIPO[perfil.tipo] || perfil.tipo}</p>

        <div style={styles.secao}>
          <h2 style={styles.secaoTitulo}>Dados de cadastro</h2>
          <Campo label="E-mail" valor={perfil.email} />
          <Campo label="Telefone" valor={perfil.telefone ? mascararTelefoneBR(perfil.telefone) : '—'} />
          <Campo label="CPF" valor={perfil.cpf ? mascararCPF(perfil.cpf) : '—'} />
          <Campo label="Cidade" valor={perfil.cidade || '—'} />
          <Campo label="Estado" valor={perfil.estado || '—'} />
        </div>

        {perfil.tipo === 'prestador' && (
          <div style={styles.secao}>
            <h2 style={styles.secaoTitulo}>Dados de prestador</h2>
            <Campo label="Serviço oferecido" valor={perfil.segmento || '—'} />
            <Campo
              label="Valor do serviço"
              valor={perfil.valor_servico != null ? `R$ ${Number(perfil.valor_servico).toFixed(2)}` : '—'}
            />
            <Campo label="Cobrança da plataforma" valor={ROTULOS_COBRANCA[perfil.modelo_cobranca] || '—'} />
            <Campo
              label="Avaliação"
              valor={`⭐ ${Number(perfil.avaliacao ?? 5).toFixed(1)} (${perfil.total_avaliacoes} avaliações)`}
            />
            <Campo label="Serviços concluídos" valor={String(perfil.total_servicos)} />
          </div>
        )}

        <button style={styles.botaoSair} onClick={logout}>
          Sair da conta
        </button>
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
  centro: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    color: 'var(--konectaja-muted)',
  },
  container: { maxWidth: 480, margin: '0 auto', padding: '0 24px 32px' },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    background: 'var(--konectaja-laranja)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 36,
    margin: '0 auto 16px',
  },
  nome: { color: 'var(--konectaja-text-forte)', fontSize: 20, textAlign: 'center', margin: 0 },
  tipo: { color: 'var(--konectaja-muted)', fontSize: 14, textAlign: 'center', marginTop: 4 },
  secao: {
    marginTop: 28,
    background: 'var(--konectaja-bg2)',
    border: '1px solid var(--konectaja-border)',
    borderRadius: 14,
    padding: 16,
  },
  secaoTitulo: {
    color: 'var(--konectaja-text-forte)',
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 12,
    marginTop: 0,
  },
  campo: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid var(--konectaja-border)',
    fontSize: 13,
  },
  campoLabel: { color: 'var(--konectaja-muted)' },
  campoValor: { color: 'var(--konectaja-text-forte)', fontWeight: 600, textAlign: 'right' },
  botaoSair: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    border: '1px solid var(--konectaja-red)',
    background: 'transparent',
    color: 'var(--konectaja-red)',
    fontWeight: 700,
    fontSize: 14,
    marginTop: 28,
  },
};
