import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';
import { SubPaginaHeader } from '@/components/common/SubPaginaHeader';
import { useCategoryStore } from '@/store/categoryStore';
import { meuPerfil } from '@/services/authService';
import { ServicoPrestador } from '@/services/marketplaceService';
import { adicionarServico, removerServico } from '@/services/servicoPrestadorService';

export function AreaServicoScreen() {
  const categorias = useCategoryStore((s) => s.categorias);

  const [servicos, setServicos] = useState<ServicoPrestador[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [novaCategoria, setNovaCategoria] = useState<string | null>(null);
  const [novoValor, setNovoValor] = useState('');
  const [adicionando, setAdicionando] = useState(false);

  useEffect(() => {
    meuPerfil()
      .then((p) => setServicos(p.servicos ?? []))
      .catch(() => setErro('Não foi possível carregar seus dados.'));
  }, []);

  async function aoAdicionar() {
    if (!novaCategoria) return;
    setAdicionando(true);
    setErro(null);
    try {
      const servico = await adicionarServico({
        categoria: novaCategoria,
        valor: novoValor ? Number(novoValor.replace(',', '.')) : undefined,
      });
      setServicos((lista) => [...(lista ?? []), servico]);
      setNovaCategoria(null);
      setNovoValor('');
    } catch {
      Alert.alert('Erro', 'Não foi possível adicionar esse serviço.');
    } finally {
      setAdicionando(false);
    }
  }

  async function aoRemover(servicoId: string) {
    try {
      await removerServico(servicoId);
      setServicos((lista) => (lista ? lista.filter((s) => s.id !== servicoId) : lista));
    } catch {
      Alert.alert('Erro', 'Não foi possível remover esse serviço.');
    }
  }

  return (
    <View style={styles.container}>
      <SubPaginaHeader titulo="Área de serviço" />
      <ScrollView contentContainerStyle={styles.corpo}>
        <Text style={styles.ajuda}>
          Outros trabalhos que você também faz, além do seu serviço principal — aparecem no marketplace
          pros clientes (e outros prestadores) encontrarem.
        </Text>

        {erro && <Text style={styles.erro}>{erro}</Text>}

        {servicos === null ? (
          <ActivityIndicator color={colors.laranja} style={{ marginTop: spacing.xl }} />
        ) : (
          <>
            {servicos.length > 0 && (
              <View style={styles.listaServicos}>
                {servicos.map((servico) => (
                  <View key={servico.id} style={styles.itemServico}>
                    <View>
                      <Text style={styles.itemServicoCategoria}>{servico.categoria}</Text>
                      {servico.valor != null && (
                        <Text style={styles.itemServicoValor}>R$ {Number(servico.valor).toFixed(2)}</Text>
                      )}
                    </View>
                    <TouchableOpacity onPress={() => aoRemover(servico.id)}>
                      <Text style={styles.itemServicoRemover}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.rotulo}>Categoria</Text>
            <View style={styles.categorias}>
              {categorias.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.chip, novaCategoria === cat.nome && styles.chipAtivo]}
                  onPress={() => setNovaCategoria(cat.nome)}
                >
                  <Text style={[styles.chipTexto, novaCategoria === cat.nome && styles.chipTextoAtivo]}>
                    {cat.icone ? `${cat.icone} ` : ''}
                    {cat.nome}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.formServico}>
              <TextInput
                style={styles.inputServicoValor}
                placeholder="Diária (R$, opcional)"
                placeholderTextColor={colors.muted}
                value={novoValor}
                onChangeText={setNovoValor}
                keyboardType="decimal-pad"
              />
              <TouchableOpacity
                style={styles.botaoAdicionarServico}
                onPress={aoAdicionar}
                disabled={adicionando || !novaCategoria}
              >
                <Text style={styles.botaoAdicionarServicoTexto}>{adicionando ? '...' : '+ Adicionar'}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  corpo: { padding: spacing.lg, paddingBottom: spacing.xxl },
  ajuda: { color: colors.muted, fontSize: 12.5, lineHeight: 18, marginBottom: spacing.md },
  erro: { color: colors.red, fontSize: 13, marginBottom: spacing.sm },
  listaServicos: { gap: 8, marginBottom: spacing.md },
  itemServico: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg3,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  itemServicoCategoria: { color: colors.textForte, fontWeight: '600', fontSize: 13 },
  itemServicoValor: { color: colors.laranja, fontWeight: '700', fontSize: 12, marginTop: 2 },
  itemServicoRemover: { color: colors.muted, fontSize: 14, paddingHorizontal: 8 },
  rotulo: { color: colors.textForte, fontSize: 13, fontWeight: '700', marginBottom: spacing.sm },
  categorias: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipAtivo: { backgroundColor: colors.laranja, borderColor: colors.laranja },
  chipTexto: { color: colors.text, fontSize: 12, fontWeight: '600' },
  chipTextoAtivo: { color: '#fff' },
  formServico: { flexDirection: 'row', gap: 8, marginTop: spacing.sm },
  inputServicoValor: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    color: colors.textForte,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  botaoAdicionarServico: {
    height: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.laranja,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoAdicionarServicoTexto: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
