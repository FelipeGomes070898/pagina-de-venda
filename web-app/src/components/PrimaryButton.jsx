export function PrimaryButton({ label, loading, variant = 'primary', style, ...props }) {
  const isOutline = variant === 'outline';
  return (
    <button
      style={{
        height: 48,
        borderRadius: 14,
        border: isOutline ? '1.5px solid var(--konectaja-border)' : 'none',
        background: isOutline
          ? 'var(--konectaja-bg2)'
          : 'linear-gradient(180deg, var(--konectaja-laranja), var(--konectaja-laranja-escuro))',
        color: isOutline ? 'var(--konectaja-text)' : '#fff',
        fontWeight: 700,
        fontSize: 15,
        boxShadow: isOutline ? 'var(--konectaja-shadow-sm)' : 'var(--konectaja-shadow-md)',
        opacity: props.disabled || loading ? 0.6 : 1,
        width: '100%',
        ...style,
      }}
      disabled={props.disabled || loading}
      {...props}
    >
      {loading ? 'Carregando...' : label}
    </button>
  );
}
