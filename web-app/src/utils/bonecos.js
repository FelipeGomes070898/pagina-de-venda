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

// Selo do tipo de serviço — um ícone pequeno no canto do boneco,
// reconhecido por palavra-chave no segmento (texto livre, não vem de
// uma lista fechada). Cor do selo é sempre a mesma (neutra escura) —
// quem muda é só o desenho, pra não competir com a cor do gênero, que
// já carrega seu próprio significado.
const PALAVRAS_CHAVE_ICONE = [
  { chaves: ['pedreiro'], icone: 'colher' },
  { chaves: ['diarista', 'domestic'], icone: 'vassoura' },
  { chaves: ['baba', 'babá', 'idoso', 'cuidador'], icone: 'coracao' },
  { chaves: ['roçad', 'rocad', 'jardin', 'quintal'], icone: 'folha' },
  { chaves: ['encanador'], icone: 'gota' },
  { chaves: ['eletricista'], icone: 'raio' },
  { chaves: ['pintor'], icone: 'rolo' },
  { chaves: ['motorista'], icone: 'volante' },
  { chaves: ['montador', 'movei', 'móvei'], icone: 'cadeira' },
];

function normalizar(texto) {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function chaveIconeSegmento(segmento) {
  const alvo = normalizar(segmento);
  const encontrado = PALAVRAS_CHAVE_ICONE.find((item) =>
    item.chaves.some((chave) => alvo.includes(normalizar(chave))),
  );
  return encontrado?.icone || 'ferramenta';
}

// Cada selo é um grupo de formas simples (preenchidas, em branco),
// pensado pra continuar legível em ~16px — não tenta ser um desenho
// realista, só uma silhueta reconhecível por categoria.
const SELOS = {
  colher: '<path d="M12 2 19 9 12 22 5 9Z" />',
  vassoura: '<path d="M11.2 2h1.6l-.4 10h-.8Z" /><path d="M7 20l5-7 5 7Z" />',
  coracao: '<path d="M12 20.5s-6.5-4.1-8.8-8.1A4.9 4.9 0 0 1 12 6.8a4.9 4.9 0 0 1 8.8 5.6c-2.3 4-8.8 8.1-8.8 8.1Z" />',
  folha: '<path d="M4.5 12.5C4.5 6 9.5 3 18 3c-1 8.5-4.5 13.5-13.5 14.5-.3-1.8-.3-3.5 0-5Z" /><path d="M5 19 16 6" stroke="#44403c" stroke-width="1.4" />',
  gota: '<path d="M12 2c4 6.2 7 9.6 7 13A7 7 0 1 1 5 15c0-3.4 3-6.8 7-13Z" />',
  raio: '<path d="M13 2 3 14h7l-1 8 10-12h-7Z" />',
  rolo: '<rect x="5" y="5" width="14" height="6" rx="1.5" /><path d="M12 11v10" stroke="#fff" stroke-width="2.2" stroke-linecap="round" /><path d="M8 21h8" stroke="#fff" stroke-width="2.2" stroke-linecap="round" />',
  volante:
    '<circle cx="12" cy="12" r="8" fill="none" stroke="#fff" stroke-width="2" /><circle cx="12" cy="12" r="2.2" /><path d="M12 6v4M12 14v4M6.5 9l3.3 2M17.5 9l-3.3 2" stroke="#fff" stroke-width="1.8" stroke-linecap="round" />',
  cadeira:
    '<rect x="6" y="11" width="12" height="3" rx="1" /><rect x="6" y="3" width="3" height="11" rx="1" /><path d="M8 17v4M16 14v7" stroke="#fff" stroke-width="2" stroke-linecap="round" />',
  ferramenta:
    '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2-2 2.6-2.6Z" />',
};

function svgSelo(segmento) {
  const icone = chaveIconeSegmento(segmento);
  return `<circle cx="31" cy="31" r="9" fill="#44403c" stroke="#fff" stroke-width="2" />
    <g transform="translate(23,23) scale(0.58)" fill="#fff">${SELOS[icone]}</g>`;
}

export function svgBoneco(genero, { tamanho = 40, segmento } = {}) {
  const cor = corPorGenero(genero);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tamanho}" height="${tamanho}" viewBox="0 0 40 40">
    <defs><clipPath id="borda-${genero}"><circle cx="20" cy="20" r="20" /></clipPath></defs>
    <circle cx="20" cy="20" r="19" fill="${cor}" stroke="#fff" stroke-width="2" />
    <g clip-path="url(#borda-${genero})" fill="#fff">${silhuetaPorGenero(genero)}</g>
    ${segmento ? svgSelo(segmento) : ''}
  </svg>`;
}

export function dataUriBoneco(genero, opcoes) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgBoneco(genero, opcoes))}`;
}
