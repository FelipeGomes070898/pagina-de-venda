import { useEffect, useRef, useState } from 'react';
import { carregarGoogleIdentity, renderizarBotaoGoogle } from '../services/googleAuthService';

// Some silenciosamente (não renderiza nada) se VITE_GOOGLE_CLIENT_ID não
// estiver configurado — não quebra o login normal por telefone/e-mail/CPF.
export function GoogleLoginButton({ onCredential }) {
  const elementId = useRef(`google-btn-${Math.random().toString(36).slice(2)}`).current;
  const [disponivel, setDisponivel] = useState(true);

  useEffect(() => {
    let ativo = true;
    carregarGoogleIdentity().then((carregou) => {
      if (!ativo || !carregou) {
        if (ativo) setDisponivel(false);
        return;
      }
      const renderizou = renderizarBotaoGoogle(elementId, onCredential);
      setDisponivel(renderizou);
    });
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elementId]);

  if (!disponivel) return null;

  return (
    <div style={styles.wrapper}>
      <div style={styles.separador}>
        <span style={styles.linha} />
        <span style={styles.ou}>ou</span>
        <span style={styles.linha} />
      </div>
      <div id={elementId} style={styles.botao} />
    </div>
  );
}

const styles = {
  wrapper: { display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' },
  separador: { display: 'flex', alignItems: 'center', width: '100%', gap: 10 },
  linha: { flex: 1, height: 1, background: 'var(--vexo-border)' },
  ou: { color: 'var(--vexo-muted)', fontSize: 12 },
  botao: { display: 'flex', justifyContent: 'center', width: '100%' },
};
