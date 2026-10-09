import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/theme/tokens';
import { SubPaginaHeader } from '@/components/common/SubPaginaHeader';
import { MapaTrabalhos } from '@/components/common/MapaTrabalhos';
import { listarMinhasConversas } from '@/services/marketplaceService';

export function MapaTrabalhosPerfilScreen() {
  const [locais, setLocais] = useState<
    { id: string; lat: number; lng: number; endereco: string | null; criado_em: string }[]
  >([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    listarMinhasConversas()
      .then((pedidos) =>
        setLocais(
          pedidos
            .filter((p) => p.status === 'concluido' && p.lat != null && p.lng != null)
            .map((p) => ({ id: p.id, lat: Number(p.lat), lng: Number(p.lng), endereco: p.endereco, criado_em: p.criado_em })),
        ),
      )
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  return (
    <View style={styles.container}>
      <SubPaginaHeader titulo="Mapa dos trabalhos" />
      <ScrollView contentContainerStyle={styles.corpo}>
        <Text style={styles.ajuda}>Onde você já prestou serviço, com base nos pedidos concluídos.</Text>
        {carregando ? (
          <ActivityIndicator color={colors.laranja} style={{ marginTop: spacing.lg }} />
        ) : (
          <MapaTrabalhos pontos={locais} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  corpo: { padding: spacing.lg, paddingBottom: spacing.xxl },
  ajuda: { color: colors.muted, fontSize: 12.5, marginBottom: spacing.md },
});
