import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';
import {
  buscarDetalhesLugar,
  buscarSugestoesEndereco,
  EnderecoDetalhado,
  mapsDisponivel,
  SugestaoEndereco,
} from '@/services/mapsService';

interface Props {
  value: string;
  onChangeText: (texto: string) => void;
  onSelecionar: (endereco: EnderecoDetalhado) => void;
  placeholder: string;
  wrapperStyle?: ViewStyle;
  inputStyle?: ViewStyle;
}

const DEBOUNCE_MS = 400;

// Sem chave do Google Maps configurada, isso é um TextInput comum (o
// usuário digita a cidade manualmente, sem sugestões nem lat/lng).
export function AddressAutocompleteInput({
  value,
  onChangeText,
  onSelecionar,
  placeholder,
  wrapperStyle,
  inputStyle,
}: Props) {
  const [sugestoes, setSugestoes] = useState<SugestaoEndereco[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!mapsDisponivel()) return;

    timeoutRef.current = setTimeout(async () => {
      const resultado = await buscarSugestoesEndereco(value);
      setSugestoes(resultado);
    }, DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value]);

  async function aoSelecionarSugestao(sugestao: SugestaoEndereco) {
    setSugestoes([]);
    onChangeText(sugestao.descricao);
    const detalhes = await buscarDetalhesLugar(sugestao.placeId);
    if (detalhes) onSelecionar(detalhes);
  }

  return (
    <View style={[styles.wrapper, wrapperStyle]}>
      <TextInput
        style={[styles.input, inputStyle]}
        placeholder={mapsDisponivel() ? placeholder : `${placeholder} (cidade)`}
        placeholderTextColor={colors.muted}
        value={value}
        onChangeText={onChangeText}
      />
      {sugestoes.length > 0 && (
        <View style={styles.lista}>
          {sugestoes.map((s) => (
            <TouchableOpacity
              key={s.placeId}
              style={styles.item}
              onPress={() => aoSelecionarSugestao(s)}
            >
              <Text style={styles.itemTexto}>{s.descricao}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%', marginBottom: spacing.md },
  input: {
    width: '100%',
    height: 52,
    backgroundColor: colors.bg2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    color: colors.textForte,
  },
  lista: {
    backgroundColor: colors.bg2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 4,
  },
  item: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemTexto: { color: colors.text, fontSize: 13 },
});
