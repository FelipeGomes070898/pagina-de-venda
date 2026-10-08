import { useEffect, useState } from 'react';
import { KonectaLogo } from './KonectaLogo';

const DURACAO_VISIVEL_MS = 1500;
const DURACAO_SAIDA_MS = 350;

// Vinheta de abertura do web-app — toca uma vez a cada carregamento da
// página (F5/primeira visita), antes das rotas montarem. Puramente
// visual (não depende de login/dados carregarem) para nunca travar o
// app caso a API esteja lenta.
export function Splash({ onFinish }) {
  const [saindo, setSaindo] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setSaindo(true), DURACAO_VISIVEL_MS);
    const t2 = setTimeout(() => onFinish?.(), DURACAO_VISIVEL_MS + DURACAO_SAIDA_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onFinish]);

  return (
    <div className={`konecta-splash${saindo ? ' konecta-splash--saindo' : ''}`}>
      <div className="konecta-splash__marca">
        <KonectaLogo size={88} showWordmark={false} animated />
        <span className="konecta-splash__wordmark">
          Konecta<span className="konecta-splash__wordmark-destaque">Já</span>
        </span>
      </div>
      <p className="konecta-splash__slogan">Serviços de confiança, na hora.</p>
      <div className="konecta-splash__trilha">
        <div className="konecta-splash__barra" />
      </div>
    </div>
  );
}
