import { Link } from 'react-router-dom';

// Página pública (sem precisar de login) pensada pra quem não tem
// prática com celular: letra grande, frases curtas, um botão só.
export function BaixarApp() {
  const urlDownload = `${import.meta.env.VITE_API_URL || 'http://localhost:3333'}/api/app/baixar-android`;

  return (
    <div style={styles.pagina}>
      <div style={styles.container}>
        <div style={styles.marca}>KONECTA JÁ</div>
        <h1 style={styles.titulo}>Baixar o aplicativo</h1>
        <p style={styles.subtitulo}>Pra usar no seu celular Android.</p>

        <a href={urlDownload} style={styles.botaoBaixar}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8, verticalAlign: '-4px' }}>
            <path d="M12 3v12m0 0-5-5m5 5 5-5" /><path d="M5 19h14" />
          </svg>
          Baixar agora
        </a>

        <div style={styles.passos}>
          <h2 style={styles.passosTitulo}>Como instalar</h2>

          <Passo numero="1" texto="Toque no botão “Baixar agora” acima." />
          <Passo
            numero="2"
            texto="Depois que baixar, toque no arquivo (geralmente aparece embaixo da tela, ou na pasta Downloads)."
          />
          <Passo
            numero="3"
            texto="O celular vai perguntar se pode instalar. Toque em “Instalar mesmo assim” ou “Configurações”, e depois permita."
          />
          <Passo numero="4" texto="Pronto! Agora é só abrir o app Konecta Já e entrar com seu celular ou e-mail." />
        </div>

        <p style={styles.ajuda}>
          Esse aviso de permissão aparece porque o app ainda não está na Play Store — é normal e
          seguro, o Android sempre avisa assim pra apps baixados fora dela.
        </p>

        <p style={styles.rodape}>
          Já tem o app instalado?{' '}
          <Link style={styles.link} to="/login">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}

function Passo({ numero, texto }) {
  return (
    <div style={styles.passo}>
      <div style={styles.passoNumero}>{numero}</div>
      <p style={styles.passoTexto}>{texto}</p>
    </div>
  );
}

const styles = {
  pagina: { minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: '32px 16px' },
  container: { maxWidth: 520, width: '100%' },
  marca: {
    fontSize: 24,
    fontWeight: 900,
    color: 'var(--konectaja-laranja-escuro)',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 24,
  },
  titulo: {
    color: 'var(--konectaja-text-forte)',
    fontSize: 30,
    textAlign: 'center',
    margin: 0,
  },
  subtitulo: {
    color: 'var(--konectaja-muted)',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  botaoBaixar: {
    display: 'block',
    textAlign: 'center',
    textDecoration: 'none',
    width: '100%',
    boxSizing: 'border-box',
    padding: '22px 24px',
    borderRadius: 18,
    background: 'linear-gradient(180deg, var(--konectaja-laranja), var(--konectaja-laranja-escuro))',
    color: '#fff',
    fontWeight: 800,
    fontSize: 22,
    boxShadow: 'var(--konectaja-shadow-md)',
  },
  passos: {
    marginTop: 40,
    background: 'var(--konectaja-bg2)',
    border: '1px solid var(--konectaja-border)',
    borderRadius: 20,
    padding: 24,
    boxShadow: 'var(--konectaja-shadow-sm)',
  },
  passosTitulo: {
    color: 'var(--konectaja-text-forte)',
    fontSize: 20,
    marginTop: 0,
    marginBottom: 20,
  },
  passo: { display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 },
  passoNumero: {
    flexShrink: 0,
    width: 36,
    height: 36,
    borderRadius: 999,
    background: 'linear-gradient(135deg, #F6AD3C, var(--konectaja-laranja-escuro))',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 16,
    boxShadow: '0 4px 10px rgba(180, 83, 9, 0.35)',
  },
  passoTexto: { color: 'var(--konectaja-text)', fontSize: 17, lineHeight: 1.5, margin: 0 },
  ajuda: {
    color: 'var(--konectaja-muted)',
    fontSize: 15,
    lineHeight: 1.5,
    textAlign: 'center',
    marginTop: 24,
  },
  rodape: { textAlign: 'center', fontSize: 16, color: 'var(--konectaja-muted)', marginTop: 32 },
  link: { color: 'var(--konectaja-azul)', fontWeight: 700, textDecoration: 'none' },
};
