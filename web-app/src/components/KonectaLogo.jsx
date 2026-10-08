import { useRef } from 'react';

// Marca "elo" — dois arcos brancos entrelaçados sobre um selo em
// degradê âmbar, simbolizando a conexão cliente↔prestador, com um
// brilho no canto representando o "Já" (resposta na hora). `animated`
// liga o pulso do brilho e a leve rotação do elo de trás — usado na
// vinheta de abertura (Splash.jsx); em outros lugares (ex.: cabeçalhos)
// fica estático.
export function KonectaLogo({ size = 48, showWordmark = true, animated = false }) {
  const gradId = useRef(`kjGrad-${Math.random().toString(36).slice(2)}`).current;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.22 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Konecta Já"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#f59e0b" />
            <stop offset="1" stopColor="#b45309" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="18" fill={`url(#${gradId})`} />
        <g transform="translate(32,34)">
          <rect
            x="-17"
            y="-7"
            width="26"
            height="14"
            rx="7"
            transform="rotate(35)"
            fill="none"
            stroke="#fff"
            strokeWidth="5"
            opacity="0.6"
            className={animated ? 'kj-logo-elo-tras' : undefined}
          />
          <rect
            x="-9"
            y="-7"
            width="26"
            height="14"
            rx="7"
            transform="rotate(-35)"
            fill="none"
            stroke="#fff"
            strokeWidth="5"
            className={animated ? 'kj-logo-elo-frente' : undefined}
          />
        </g>
        <circle
          cx="47"
          cy="17"
          r="4.5"
          fill="#fde9d0"
          className={animated ? 'kj-logo-spark' : undefined}
        />
      </svg>

      {showWordmark && (
        <span
          style={{
            fontWeight: 800,
            fontSize: size * 0.38,
            letterSpacing: -0.3,
            color: 'var(--konectaja-text-forte)',
            whiteSpace: 'nowrap',
          }}
        >
          Konecta<span style={{ color: 'var(--konectaja-laranja)' }}>Já</span>
        </span>
      )}
    </div>
  );
}
