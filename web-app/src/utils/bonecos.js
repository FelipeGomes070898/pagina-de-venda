// "Boneco" do trabalhador — escolhido uma vez no cadastro do
// prestador, usado depois como pino no mapa (sem nenhuma legenda
// pública dizendo qual é qual — isso é só um detalhe de cadastro, não
// uma informação que o público precisa ver). Cada opção tem cor E
// silhueta diferentes (nunca só a cor), pra continuar distinguível pra
// quem tem daltonismo. Tudo fica dentro de um círculo (clip-path),
// então não tem risco de "vazar" nada feio fora do badge por causa de
// coordenadas aproximadas.
export const BONECOS = [
  { valor: 'masculino', rotulo: 'Masculino', cor: '#2563eb' },
  { valor: 'feminino', rotulo: 'Feminino', cor: '#db2777' },
];

const COR_PADRAO = '#d97706';

function corPorGenero(genero) {
  return BONECOS.find((b) => b.valor === genero)?.cor || COR_PADRAO;
}

// Silhueta branca (cabeça + ombros), clipada dentro do círculo —
// masculino tem um "corte" reto de cabelo, feminino tem cabelo
// emoldurando o rosto, neutro fica sem acessório nenhum.
function silhuetaPorGenero(genero) {
  const ombros = '<path d="M6 40c0-9 6-14 14-14s14 5 14 14Z" />';
  const cabeca = '<circle cx="20" cy="16" r="7" />';

  if (genero === 'masculino') {
    return `${ombros}${cabeca}<rect x="13" y="7" width="14" height="5" rx="2" />`;
  }
  if (genero === 'feminino') {
    return `${ombros}${cabeca}<path d="M11 10a9 9 0 0 1 18 0v7c-2-3.5-4.5-5-9-5s-7 1.5-9 5v-7Z" />`;
  }
  return `${ombros}${cabeca}`;
}

export function svgBoneco(genero, { tamanho = 40 } = {}) {
  const cor = corPorGenero(genero);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tamanho}" height="${tamanho}" viewBox="0 0 40 40">
    <defs><clipPath id="borda-${genero}"><circle cx="20" cy="20" r="20" /></clipPath></defs>
    <circle cx="20" cy="20" r="19" fill="${cor}" stroke="#fff" stroke-width="2" />
    <g clip-path="url(#borda-${genero})" fill="#fff">${silhuetaPorGenero(genero)}</g>
  </svg>`;
}

export function dataUriBoneco(genero, opcoes) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgBoneco(genero, opcoes))}`;
}
