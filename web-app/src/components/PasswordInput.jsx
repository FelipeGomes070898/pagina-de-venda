import { useState } from 'react';

const IconeOlho = ({ aberto }) =>
  aberto ? (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l18 18" /><path d="M10.6 5.2A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a14.6 14.6 0 0 1-3 3.9M6.3 6.3C3.6 8.1 2 12 2 12s3.5 7 10 7a9.8 9.8 0 0 0 4.2-.9" /><path d="M9.5 9.8a3 3 0 0 0 4.2 4.2" />
    </svg>
  );

// Campo de senha com botão de mostrar/ocultar — evita duplicar o toggle
// em Login, Cadastro e Esqueci minha senha.
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
        <IconeOlho aberto={mostrar} />
      </button>
    </div>
  );
}

const styles = {
  wrapper: {
    height: 48,
    borderRadius: 12,
    border: '1px solid var(--konectaja-border)',
    background: 'var(--konectaja-bg3)',
    display: 'flex',
    alignItems: 'center',
    paddingRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    border: 'none',
    background: 'transparent',
    color: 'var(--konectaja-text-forte)',
    padding: '0 14px',
    fontSize: 14,
    outline: 'none',
  },
  toggle: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--konectaja-muted)',
    display: 'flex',
    padding: 4,
  },
};
