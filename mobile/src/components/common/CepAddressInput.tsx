import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';
import { buscarCep, EnderecoPorCep, mascararCep } from '@/services/cepService';

interface DadosEndereco {
  enderecoCompleto: string;
  cidade: string;
  estado: string;
}

interface Props {
  onSelecionar: (dados: DadosEndereco) => void;
}

// Fluxo pedido: usuário digita o CEP, o endereço é preenchido
// automaticamente (rua, bairro, cidade, estado) e ele só completa o
// número da casa. Quando o CEP não é encontrado, libera os campos
// pra preenchimento manual.
export function CepAddressInput({ onSelecionar }: Props) {
  const [cep, setCep] = useState('');
  const [numero, setNumero] = useState('');
  const [endereco, setEndereco] = useState<EnderecoPorCep | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [manual, setManual] = useState(false);

  function emitir(dados: Partial<EnderecoPorCep> | null, numeroAtual: string) {
    if (!dados) return;
    const partes = [dados.rua, numeroAtual, dados.bairro, dados.cidade, dados.estado].filter(Boolean);
    onSelecionar({
      enderecoCompleto: partes.join(', '),
      cidade: dados.cidade || '',
      estado: dados.estado || '',
    });
  }

  async function aoDigitarCep(valor: string) {
    const formatado = mascararCep(valor);
    setCep(formatado);
    setErro(null);

    const digitos = formatado.replace(/\D/g, '');
    if (digitos.length !== 8) {
      setEndereco(null);
      return;
    }

    setBuscando(true);
    try {
      const resultado = await buscarCep(formatado);
      if (!resultado) {
        setErro('CEP não encontrado. Preencha o endereço manualmente abaixo.');
        setManual(true);
        setEndereco(null);
        return;
      }
      setEndereco(resultado);
      emitir(resultado, numero);
    } catch {
      setErro('Não foi possível buscar o CEP agora. Preencha manualmente.');
      setManual(true);
    } finally {
      setBuscando(false);
    }
  }

  function aoEditarCampo(campo: keyof EnderecoPorCep, valor: string) {
    const base = endereco || { cep: '', rua: '', bairro: '', cidade: '', estado: '' };
    const atualizado = { ...base, [campo]: valor };
    setEndereco(atualizado);
    emitir(atualizado, numero);
  }

  function aoDigitarNumero(valor: string) {
    setNumero(valor);
    emitir(endereco, valor);
  }

  return (
    <View style={{ marginBottom: spacing.md }}>
      <TextInput
        style={styles.input}
        placeholder="CEP (00000-000)"
        placeholderTextColor={colors.muted}
        value={cep}
        onChangeText={aoDigitarCep}
        keyboardType="number-pad"
      />
      {buscando && <Text style={styles.info}>Buscando endereço...</Text>}
      {erro && <Text style={styles.erro}>{erro}</Text>}

      {(endereco || manual) && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Rua"
            placeholderTextColor={colors.muted}
            value={endereco?.rua || ''}
            onChangeText={(v) => aoEditarCampo('rua', v)}
          />
          <View style={styles.linha}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Número"
              placeholderTextColor={colors.muted}
              value={numero}
              onChangeText={aoDigitarNumero}
              keyboardType="number-pad"
            />
            <TextInput
              style={[styles.input, { flex: 2 }]}
              placeholder="Bairro"
              placeholderTextColor={colors.muted}
              value={endereco?.bairro || ''}
              onChangeText={(v) => aoEditarCampo('bairro', v)}
            />
          </View>
          <View style={styles.linha}>
            <TextInput
              style={[styles.input, { flex: 2 }]}
              placeholder="Cidade"
              placeholderTextColor={colors.muted}
              value={endereco?.cidade || ''}
              onChangeText={(v) => aoEditarCampo('cidade', v)}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="UF"
              placeholderTextColor={colors.muted}
              value={endereco?.estado || ''}
              onChangeText={(v) => aoEditarCampo('estado', v.toUpperCase().slice(0, 2))}
              autoCapitalize="characters"
              maxLength={2}
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    width: '100%',
    height: 52,
    backgroundColor: colors.bg2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    color: colors.textForte,
    marginBottom: spacing.sm,
  },
  linha: { flexDirection: 'row', gap: 8 },
  info: { color: colors.muted, fontSize: 12, marginBottom: spacing.sm },
  erro: { color: colors.red, fontSize: 12, marginBottom: spacing.sm },
});
