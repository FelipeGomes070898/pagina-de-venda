import { useState } from 'react';

// Campo de senha com botão de mostrar/ocultar — evita duplicar o toggle
// em Login, Equipe e Configurações.
export function PasswordInput({ style, ...inputProps }) {
  const [mostrar, setMostrar] = useState(false);

  return (
    <div style={{ ...styles.wrapper, ...style }}>
      <input {...inputProps} type={mostrar ? 'text' : 'password'} style={styles.input} />
      <button
        type="button"
        onClick={() => setMostrar((v) => !v)}
        style={styles.toggle}
        tabIndex={-1}
        aria-label={mostrar ? 'Ocultar senha' : 'Mostrar senha'}
      >
        {mostrar ? '🙈' : '👁️'}
      </button>
    </div>
  );
}

const styles = {
  wrapper: {
    height: 42,
    borderRadius: 8,
    border: '1px solid var(--konectaja-border)',
    background: 'var(--konectaja-bg3)',
    display: 'flex',
    alignItems: 'center',
    paddingRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    border: 'none',
    background: 'transparent',
    color: 'var(--konectaja-text-forte)',
    padding: '0 10px',
    fontSize: 13,
    outline: 'none',
  },
  toggle: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    padding: 2,
  },
};
