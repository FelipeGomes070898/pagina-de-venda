// Design system Konecta Já — modo claro. "Brasileiro real, profissional mas
// acessível, trabalho honesto, dinâmico, confiável."
export const colors = {
  laranja: '#D97706', // laranja queimado — cor primária (botões, ações, destaque)
  laranjaEscuro: '#B45309', // hover/pressed da cor primária / fim do gradiente
  laranjaSoft: '#FDE9D0', // fundo suave da cor primária
  azul: '#1F2937', // azul profundo — secundária (texto forte, ícones de navegação)
  bg: '#FAF8F5', // off-white quente
  bg2: '#FFFFFF', // cards e superfícies elevadas
  bg3: '#F5F0E9', // chrome secundário (chips inativos, divisores)
  text: '#44403C',
  textForte: '#1C1917',
  muted: '#8A8580',
  border: '#E7E1D7',
  green: '#15803D', // disponível / sucesso / avaliação
  greenSoft: '#DCF3E4',
  red: '#B91C1C',
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
  shadowColor: '#1C1917',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 10,
  elevation: 2,
};

// Sombra mais forte (cards de destaque, botões flutuantes).
export const sombraForte = {
  shadowColor: '#1C1917',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.16,
  shadowRadius: 20,
  elevation: 6,
};
