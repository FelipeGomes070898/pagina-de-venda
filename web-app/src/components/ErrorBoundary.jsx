import { Component } from 'react';

// Sem isso, qualquer exceção de render em qualquer lugar da árvore vira
// tela cinza/branca sem aviso nenhum (bug de classe já documentado em
// backend/src/config/database.js) — não tem como saber se travou por
// rede, por um campo inesperado da API, ou por um bug de verdade. Esse
// componente pega esses erros e mostra algo recarregável em vez de nada.
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { temErro: false };
  }

  static getDerivedStateFromError() {
    return { temErro: true };
  }

  componentDidCatch(erro, info) {
    // eslint-disable-next-line no-console
    console.error('Erro não tratado na interface:', erro, info?.componentStack);
  }

  render() {
    if (!this.state.temErro) return this.props.children;

    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.titulo}>Algo deu errado</h1>
          <p style={styles.texto}>
            Essa tela encontrou um problema inesperado. Tente recarregar — se continuar
            acontecendo, fale com o suporte pela aba de Ajuda.
          </p>
          <button style={styles.botao} onClick={() => window.location.reload()}>
            Recarregar
          </button>
        </div>
      </div>
    );
  }
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    maxWidth: 360,
    textAlign: 'center',
    background: 'var(--konectaja-bg2)',
    border: '1px solid var(--konectaja-border)',
    borderRadius: 18,
    padding: 32,
  },
  titulo: { color: 'var(--konectaja-text-forte)', fontSize: 18, margin: '0 0 10px' },
  texto: { color: 'var(--konectaja-muted)', fontSize: 13.5, lineHeight: 1.6, margin: '0 0 20px' },
  botao: {
    height: 44,
    padding: '0 22px',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(180deg, var(--konectaja-laranja), var(--konectaja-laranja-escuro))',
    color: '#fff',
    fontWeight: 700,
    fontSize: 14,
  },
};
