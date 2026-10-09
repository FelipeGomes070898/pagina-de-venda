import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { colors, radius, sombra, spacing } from '@/theme/tokens';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SubPaginaHeader } from '@/components/common/SubPaginaHeader';
import { Boneco } from '@/utils/bonecos';
import { listarMapaPrestadores, PrestadorMapa } from '@/services/marketplaceService';
import { obterLocalizacaoComPermissao } from '@/services/locationService';
import { useAuthStore } from '@/store/authStore';

type Props = NativeStackScreenProps<RootStackParamList, 'MapaTrabalhadores'>;

// Em vez de um mapa de verdade (que precisaria de uma coordenada, nem
// que aproximada, de cada prestador), isso é um "radar": só a
// distância até você importa, nunca o endereço ou a direção de
// ninguém — espelha web-app/src/pages/marketplace/MapaTrabalhadores.jsx,
// trocando SVG por Views posicionadas de forma absoluta (sem libs novas).
const LADO = 300;
const CENTRO = LADO / 2;
const FAIXAS = [
  { ateKm: 1, raio: 28, rotulo: 'até 1 km' },
  { ateKm: 3, raio: 56, rotulo: 'até 3 km' },
  { ateKm: 5, raio: 84, rotulo: 'até 5 km' },
  { ateKm: 10, raio: 112, rotulo: 'até 10 km' },
  { ateKm: Infinity, raio: 140, rotulo: 'mais de 10 km' },
];

function faixaDe(distanciaKm: number | null) {
  if (distanciaKm == null) return FAIXAS[FAIXAS.length - 1];
  return FAIXAS.find((f) => distanciaKm <= f.ateKm) || FAIXAS[FAIXAS.length - 1];
}

export function MapaTrabalhadoresScreen({ navigation }: Props) {
  const cidadeUsuario = useAuthStore((s) => s.usuario?.cidade);

  const [prestadores, setPrestadores] = useState<PrestadorMapa[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [selecionado, setSelecionado] = useState<PrestadorMapa | null>(null);

  useEffect(() => {
    obterLocalizacaoComPermissao()
      .then((coordenadas) =>
        listarMapaPrestadores({
          cidade: cidadeUsuario || undefined,
          lat: coordenadas?.lat,
          lng: coordenadas?.lng,
        }),
      )
      .then(setPrestadores)
      .catch(() => setErro('Não foi possível carregar o radar de trabalhadores agora.'));
  }, [cidadeUsuario]);

  // Agrupa por faixa e distribui os bonecos em volta do anel, só por
  // estética — o ângulo não representa direção real nenhuma.
  const posicionados = useMemo(() => {
    if (!prestadores) return [];
    const porFaixa = new Map<(typeof FAIXAS)[number], PrestadorMapa[]>();
    prestadores.forEach((p) => {
      const faixa = faixaDe(p.distanciaKm);
      if (!porFaixa.has(faixa)) porFaixa.set(faixa, []);
      porFaixa.get(faixa)!.push(p);
    });

    const resultado: (PrestadorMapa & { x: number; y: number })[] = [];
    porFaixa.forEach((lista, faixa) => {
      lista.forEach((p, i) => {
        const angulo = (i / lista.length) * 2 * Math.PI + faixa.raio / 80;
        resultado.push({
          ...p,
          x: CENTRO + Math.cos(angulo) * faixa.raio,
          y: CENTRO + Math.sin(angulo) * faixa.raio,
        });
      });
    });
    return resultado;
  }, [prestadores]);

  return (
    <View style={styles.container}>
      <SubPaginaHeader titulo="Trabalhadores por perto" />

      <ScrollView contentContainerStyle={styles.corpo}>
        <Text style={styles.ajuda}>
          Cada boneco é um prestador disponível, posicionado só pela distância até você — nunca
          mostramos endereço ou direção de ninguém.
        </Text>

        {erro && <Text style={styles.erro}>{erro}</Text>}

        {prestadores === null ? (
          <ActivityIndicator color={colors.laranja} style={{ marginTop: spacing.xl }} />
        ) : prestadores.length === 0 ? (
          <Text style={styles.vazio}>Nenhum prestador disponível por aqui ainda.</Text>
        ) : (
          <>
            <View style={styles.radarWrapper}>
              <View style={{ width: LADO, height: LADO }}>
                {FAIXAS.map((f) => (
                  <View
                    key={f.rotulo}
                    style={[
                      styles.anel,
                      {
                        width: f.raio * 2,
                        height: f.raio * 2,
                        borderRadius: f.raio,
                        left: CENTRO - f.raio,
                        top: CENTRO - f.raio,
                      },
                    ]}
                  />
                ))}

                <View style={[styles.voceDot, { left: CENTRO - 5, top: CENTRO - 5 }]} />
                <Text style={[styles.voceTexto, { left: CENTRO - 14, top: CENTRO - 24 }]}>Você</Text>

                {posicionados.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={{ position: 'absolute', left: p.x - 18, top: p.y - 18 }}
                    onPress={() => setSelecionado(p)}
                  >
                    <Boneco genero={p.avatarGenero} segmento={p.segmento} tamanho={36} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.legendaFaixas}>
              {FAIXAS.map((f) => (
                <Text key={f.rotulo} style={styles.legendaItem}>
                  {f.rotulo}
                </Text>
              ))}
            </View>

            {selecionado && (
              <View style={styles.cartaoSelecionado}>
                <Boneco genero={selecionado.avatarGenero} segmento={selecionado.segmento} tamanho={48} />
                <View style={styles.cartaoTextos}>
                  <Text style={styles.cartaoNome}>{selecionado.nome}</Text>
                  <Text style={styles.cartaoSegmento}>
                    {selecionado.segmento || 'Serviço geral'}
                    {selecionado.distanciaKm != null && ` · ${selecionado.distanciaKm} km`}
                  </Text>
                </View>
                <PrimaryButton
                  label="Ver perfil"
                  onPress={() =>
                    navigation.navigate('ProProfile', {
                      prestadorId: selecionado.id,
                      prestadorNome: selecionado.nome,
                    })
                  }
                  style={styles.cartaoBotao}
                />
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  corpo: { padding: spacing.lg, paddingBottom: spacing.xxl, alignItems: 'center' },
  ajuda: { color: colors.muted, fontSize: 12.5, lineHeight: 18, marginBottom: spacing.md, textAlign: 'center' },
  erro: { color: colors.red, fontSize: 13, marginBottom: spacing.sm },
  vazio: { color: colors.muted, fontSize: 13, textAlign: 'center', marginTop: spacing.xl },
  radarWrapper: {
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.sm,
    alignItems: 'center',
  },
  anel: { position: 'absolute', borderWidth: 1, borderColor: colors.border },
  voceDot: { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: colors.laranjaEscuro },
  voceTexto: { position: 'absolute', fontSize: 11, fontWeight: '700', color: colors.textForte, width: 50, textAlign: 'center' },
  legendaFaixas: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: spacing.md },
  legendaItem: { fontSize: 11, color: colors.muted },
  cartaoSelecionado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: spacing.lg,
    width: '100%',
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...sombra,
  },
  cartaoTextos: { flex: 1 },
  cartaoNome: { color: colors.textForte, fontWeight: '700', fontSize: 14 },
  cartaoSegmento: { color: colors.muted, fontSize: 12, marginTop: 2 },
  cartaoBotao: { height: 40, paddingHorizontal: spacing.md },
});
