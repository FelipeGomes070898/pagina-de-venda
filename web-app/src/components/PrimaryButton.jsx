export function PrimaryButton({ label, loading, variant = 'primary', style, ...props }) {
  const isOutline = variant === 'outline';
  return (
    <button
      style={{
        height: 48,
        borderRadius: 12,
        border: isOutline ? '1px solid var(--konectaja-border)' : 'none',
        background: isOutline ? 'transparent' : 'var(--konectaja-laranja)',
        color: isOutline ? 'var(--konectaja-text)' : '#fff',
        fontWeight: 700,
        fontSize: 15,
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
