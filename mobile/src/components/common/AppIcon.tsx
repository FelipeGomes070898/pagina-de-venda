import React from 'react';
import { View } from 'react-native';

export type NomeIcone =
  | 'inicio'
  | 'busca'
  | 'chats'
  | 'carteira'
  | 'perfil'
  | 'pessoa'
  | 'mala'
  | 'pino'
  | 'ferramenta'
  | 'foto'
  | 'escudo';

interface Props {
  nome: NomeIcone;
  cor: string;
  tamanho?: number;
}

// Ícones só com Views (bordas e o truque do "triângulo CSS" via border
// colorida em um View de tamanho zero) — sem SVG, já que o projeto não
// pode ganhar dependência nativa nova. O ponto é que isso tinge de
// verdade com qualquer cor (laranja ativo / muted inativo na barra
// inferior, laranja-escuro no menu do Perfil — mesmas cores do
// web-app), diferente de emoji — emoji sempre renderiza nas próprias
// cores do glifo e ignora qualquer `color` do React Native.
export function AppIcon({ nome, cor, tamanho = 20 }: Props) {
  const s = tamanho;

  if (nome === 'inicio') {
    return (
      <View style={{ width: s, height: s, alignItems: 'center' }}>
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: s * 0.5,
            borderRightWidth: s * 0.5,
            borderBottomWidth: s * 0.4,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: cor,
          }}
        />
        <View
          style={{
            width: s * 0.76,
            height: s * 0.42,
            borderWidth: s * 0.1,
            borderTopWidth: 0,
            borderColor: cor,
          }}
        />
      </View>
    );
  }

  if (nome === 'busca') {
    return (
      <View style={{ width: s, height: s }}>
        <View
          style={{
            width: s * 0.6,
            height: s * 0.6,
            borderRadius: s * 0.3,
            borderWidth: s * 0.11,
            borderColor: cor,
          }}
        />
        <View
          style={{
            position: 'absolute',
            width: s * 0.1,
            height: s * 0.38,
            backgroundColor: cor,
            borderRadius: s * 0.05,
            right: s * 0.04,
            bottom: -s * 0.02,
            transform: [{ rotate: '45deg' }],
          }}
        />
      </View>
    );
  }

  if (nome === 'chats') {
    return (
      <View style={{ width: s, height: s }}>
        <View
          style={{
            width: s * 0.92,
            height: s * 0.6,
            borderRadius: s * 0.16,
            borderWidth: s * 0.1,
            borderColor: cor,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: s * 0.14,
            bottom: -s * 0.1,
            width: 0,
            height: 0,
            borderTopWidth: s * 0.18,
            borderRightWidth: s * 0.14,
            borderTopColor: cor,
            borderRightColor: 'transparent',
          }}
        />
      </View>
    );
  }

  if (nome === 'carteira') {
    return (
      <View style={{ width: s, height: s }}>
        <View
          style={{
            width: s * 0.92,
            height: s * 0.64,
            marginTop: s * 0.12,
            borderRadius: s * 0.12,
            borderWidth: s * 0.1,
            borderColor: cor,
          }}
        />
        <View
          style={{
            position: 'absolute',
            width: s * 0.16,
            height: s * 0.16,
            borderRadius: s * 0.08,
            backgroundColor: cor,
            right: s * 0.1,
            top: s * 0.38,
          }}
        />
      </View>
    );
  }

  if (nome === 'perfil' || nome === 'pessoa') {
    return (
      <View style={{ width: s, height: s, alignItems: 'center' }}>
        <View
          style={{
            width: s * 0.36,
            height: s * 0.36,
            borderRadius: s * 0.18,
            backgroundColor: cor,
            marginBottom: s * 0.06,
          }}
        />
        <View
          style={{
            width: s * 0.78,
            height: s * 0.4,
            borderTopLeftRadius: s * 0.4,
            borderTopRightRadius: s * 0.4,
            backgroundColor: cor,
          }}
        />
      </View>
    );
  }

  if (nome === 'mala') {
    return (
      <View style={{ width: s, height: s, alignItems: 'center' }}>
        <View
          style={{
            width: s * 0.34,
            height: s * 0.18,
            borderWidth: s * 0.07,
            borderBottomWidth: 0,
            borderColor: cor,
            borderTopLeftRadius: s * 0.08,
            borderTopRightRadius: s * 0.08,
          }}
        />
        <View
          style={{
            width: s * 0.9,
            height: s * 0.56,
            borderWidth: s * 0.09,
            borderColor: cor,
            borderRadius: s * 0.1,
            marginTop: -s * 0.02,
          }}
        />
      </View>
    );
  }

  if (nome === 'pino') {
    return (
      <View style={{ width: s, height: s, alignItems: 'center' }}>
        <View
          style={{
            width: s * 0.6,
            height: s * 0.6,
            borderRadius: s * 0.3,
            backgroundColor: cor,
          }}
        />
        <View
          style={{
            width: 0,
            height: 0,
            marginTop: -s * 0.06,
            borderLeftWidth: s * 0.22,
            borderRightWidth: s * 0.22,
            borderTopWidth: s * 0.3,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderTopColor: cor,
          }}
        />
      </View>
    );
  }

  if (nome === 'ferramenta') {
    return (
      <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            width: s * 0.88,
            height: s * 0.2,
            backgroundColor: cor,
            borderRadius: s * 0.1,
            transform: [{ rotate: '45deg' }],
          }}
        />
        <View
          style={{
            position: 'absolute',
            width: s * 0.3,
            height: s * 0.3,
            borderRadius: s * 0.15,
            borderWidth: s * 0.07,
            borderColor: cor,
            backgroundColor: 'transparent',
            top: s * 0.04,
            left: s * 0.04,
          }}
        />
        <View
          style={{
            position: 'absolute',
            width: s * 0.3,
            height: s * 0.3,
            borderRadius: s * 0.15,
            borderWidth: s * 0.07,
            borderColor: cor,
            backgroundColor: 'transparent',
            bottom: s * 0.04,
            right: s * 0.04,
          }}
        />
      </View>
    );
  }

  if (nome === 'foto') {
    return (
      <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            width: s * 0.94,
            height: s * 0.72,
            borderWidth: s * 0.09,
            borderColor: cor,
            borderRadius: s * 0.12,
          }}
        />
        <View
          style={{
            position: 'absolute',
            width: s * 0.3,
            height: s * 0.3,
            borderRadius: s * 0.15,
            borderWidth: s * 0.08,
            borderColor: cor,
          }}
        />
      </View>
    );
  }

  // escudo
  return (
    <View style={{ width: s, height: s, alignItems: 'center' }}>
      <View
        style={{
          width: s * 0.74,
          height: s * 0.4,
          borderWidth: s * 0.09,
          borderBottomWidth: 0,
          borderColor: cor,
          borderTopLeftRadius: s * 0.1,
          borderTopRightRadius: s * 0.1,
        }}
      />
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: s * 0.37,
          borderRightWidth: s * 0.37,
          borderTopWidth: s * 0.34,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: cor,
        }}
      />
    </View>
  );
}
