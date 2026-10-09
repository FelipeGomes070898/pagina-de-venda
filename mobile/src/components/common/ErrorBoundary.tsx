import React, { Component, ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';

interface Props {
  children: ReactNode;
}

interface State {
  temErro: boolean;
}

// Sem isso, qualquer exceção de render em qualquer lugar da árvore
// derruba o app pra tela branca do RN sem nenhum caminho de volta —
// mesmo bug de classe já documentado no backend (database.js) pro lado
// web. "Tentar de novo" reseta o estado e deixa a árvore renderizar de
// novo, o que já resolve quando a causa era um dado momentâneo (ex.:
// resposta de API mal formada que some numa nova tentativa).
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { temErro: false };
  }

  static getDerivedStateFromError() {
    return { temErro: true };
  }

  componentDidCatch(erro: Error, info: React.ErrorInfo) {
    console.error('Erro não tratado na interface:', erro, info.componentStack);
  }

  render() {
    if (!this.state.temErro) return this.props.children;

    return (
      <View style={styles.container}>
        <Text style={styles.titulo}>Algo deu errado</Text>
        <Text style={styles.texto}>
          Essa tela encontrou um problema inesperado. Toque em tentar de novo — se continuar
          acontecendo, feche e abra o app, ou fale com o suporte.
        </Text>
        <TouchableOpacity style={styles.botao} onPress={() => this.setState({ temErro: false })}>
          <Text style={styles.botaoTexto}>Tentar de novo</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.bg,
  },
  titulo: { color: colors.textForte, fontSize: 18, fontWeight: '800', marginBottom: spacing.sm },
  texto: { color: colors.muted, fontSize: 13.5, lineHeight: 19, textAlign: 'center', marginBottom: spacing.lg },
  botao: {
    height: 44,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    backgroundColor: colors.laranjaEscuro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoTexto: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
