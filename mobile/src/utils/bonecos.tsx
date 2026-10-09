import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// "Boneco" do trabalhador — escolhido uma vez no cadastro/perfil do
// prestador, usado como pino no mapa. Sem nenhuma lib de SVG (o
// mobile não pode ganhar dependência nativa nova), então isso é só
// Views/Text do React Native: um círculo colorido por gênero + um
// emoji de pessoa (cor E emoji mudam juntos, nunca só a cor) e um
// selo pequeno no canto com o tipo de serviço.
export type GeneroBoneco = 'masculino' | 'feminino' | 'neutro' | null | undefined;

export const OPCOES_BONECO: { valor: 'masculino' | 'feminino'; rotulo: string; cor: string }[] = [
  { valor: 'masculino', rotulo: 'Masculino', cor: '#2563eb' },
  { valor: 'feminino', rotulo: 'Feminino', cor: '#db2777' },
];

const COR_PADRAO = '#d97706';

function corPorGenero(genero: GeneroBoneco): string {
  return OPCOES_BONECO.find((o) => o.valor === genero)?.cor || COR_PADRAO;
}

function emojiPorGenero(genero: GeneroBoneco): string {
  if (genero === 'masculino') return '👨';
  if (genero === 'feminino') return '👩';
  return '🧑';
}

// Mesmas palavras-chave do boneco do web-app (ver web-app/src/utils/bonecos.js),
// só trocando SVG por emoji — reconhecidas no texto livre do segmento,
// não vêm de uma lista fechada.
const PALAVRAS_CHAVE_EMOJI: { chaves: string[]; emoji: string }[] = [
  { chaves: ['pedreiro'], emoji: '🧱' },
  { chaves: ['diarista', 'domestic'], emoji: '🧹' },
  { chaves: ['baba', 'babá', 'idoso', 'cuidador'], emoji: '❤️' },
  { chaves: ['rocad', 'roçad', 'jardin', 'quintal'], emoji: '🌿' },
  { chaves: ['encanador'], emoji: '💧' },
  { chaves: ['eletricista'], emoji: '⚡' },
  { chaves: ['pintor'], emoji: '🎨' },
  { chaves: ['motorista'], emoji: '🚗' },
  { chaves: ['montador', 'movei', 'móvei'], emoji: '🪑' },
];

function normalizar(texto?: string | null): string {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function emojiSegmento(segmento?: string | null): string {
  const alvo = normalizar(segmento);
  const encontrado = PALAVRAS_CHAVE_EMOJI.find((item) =>
    item.chaves.some((chave) => alvo.includes(normalizar(chave))),
  );
  return encontrado?.emoji || '🔧';
}

interface Props {
  genero: GeneroBoneco;
  segmento?: string | null;
  tamanho?: number;
}

export function Boneco({ genero, segmento, tamanho = 40 }: Props) {
  const cor = corPorGenero(genero);
  const selo = Math.round(tamanho * 0.5);
  return (
    <View
      style={[
        styles.circulo,
        { width: tamanho, height: tamanho, borderRadius: tamanho / 2, backgroundColor: cor },
      ]}
    >
      <Text style={{ fontSize: tamanho * 0.52 }}>{emojiPorGenero(genero)}</Text>
      {segmento ? (
        <View
          style={[
            styles.selo,
            {
              width: selo,
              height: selo,
              borderRadius: selo / 2,
              right: -selo * 0.14,
              bottom: -selo * 0.14,
            },
          ]}
        >
          <Text style={{ fontSize: selo * 0.56 }}>{emojiSegmento(segmento)}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  circulo: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  selo: {
    position: 'absolute',
    backgroundColor: '#44403c',
    borderWidth: 1.5,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
