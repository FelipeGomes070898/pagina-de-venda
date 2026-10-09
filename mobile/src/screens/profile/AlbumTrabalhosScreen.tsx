import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';
import { SubPaginaHeader } from '@/components/common/SubPaginaHeader';
import { meuPerfil, FotoTrabalho } from '@/services/authService';

export function AlbumTrabalhosScreen() {
  const [fotos, setFotos] = useState<FotoTrabalho[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    meuPerfil()
      .then((p) => setFotos(p.fotos ?? []))
      .catch(() => setErro('Não foi possível carregar seus dados.'));
  }, []);

  return (
    <View style={styles.container}>
      <SubPaginaHeader titulo="Álbum de trabalhos" />
      <ScrollView contentContainerStyle={styles.corpo}>
        <View style={styles.cabecalhoSecao}>
          <Text style={styles.ajuda}>Fotos de serviços que você já fez ajudam o cliente a confiar no seu trabalho.</Text>
          {(fotos?.length ?? 0) >= 3 && <Text style={styles.seloCompleto}>✓ Perfil completo</Text>}
        </View>

        {erro && <Text style={styles.erro}>{erro}</Text>}

        {fotos === null ? (
          <ActivityIndicator color={colors.laranja} style={{ marginTop: spacing.xl }} />
        ) : fotos.length === 0 ? (
          <Text style={styles.vazio}>Você ainda não tem fotos de trabalhos.</Text>
        ) : (
          <View style={styles.grade}>
            {fotos.map((foto) => (
              <Image key={foto.id} source={{ uri: foto.url }} style={styles.foto} />
            ))}
          </View>
        )}

        <Text style={styles.ajudaUpload}>
          Pra adicionar ou remover fotos, use o site da Konecta Já pelo navegador por enquanto.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  corpo: { padding: spacing.lg, paddingBottom: spacing.xxl },
  cabecalhoSecao: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  ajuda: { flex: 1, color: colors.muted, fontSize: 12.5, marginBottom: spacing.md },
  erro: { color: colors.red, fontSize: 13, marginBottom: spacing.sm },
  vazio: { color: colors.muted, fontSize: 13, textAlign: 'center', marginTop: spacing.xl },
  seloCompleto: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.green,
    backgroundColor: colors.greenSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  foto: { width: 100, height: 100, borderRadius: radius.sm },
  ajudaUpload: { color: colors.muted, fontSize: 11, marginTop: spacing.md },
});
