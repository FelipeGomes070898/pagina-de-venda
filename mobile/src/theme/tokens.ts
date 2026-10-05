// Design system Konecta Já — modo claro. "Brasileiro real, profissional mas
// acessível, trabalho honesto, dinâmico, confiável."
export const colors = {
  laranja: '#D97706', // laranja queimado — cor primária (botões, ações, destaque)
  laranjaEscuro: '#B45309', // hover/pressed da cor primária
  azul: '#1F2937', // azul profundo — secundária (texto forte, ícones de navegação)
  bg: '#FAFAFA',
  bg2: '#FFFFFF', // cards e superfícies elevadas
  bg3: '#F3F4F6', // chrome secundário (chips inativos, divisores)
  text: '#374151',
  textForte: '#111827',
  muted: '#6B7280',
  border: '#D1D5DB',
  green: '#10B981', // disponível / sucesso / avaliação
  red: '#DC2626',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
};

export const typography = {
  titulo: { fontSize: 28, fontWeight: '800' as const },
  subtitulo: { fontSize: 16, fontWeight: '400' as const },
  corpo: { fontSize: 15, fontWeight: '400' as const },
  legenda: { fontSize: 13, fontWeight: '500' as const },
};

// Sombra suave padrão (elevação discreta dos cards).
export const sombra = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};
