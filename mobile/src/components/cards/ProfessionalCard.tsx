import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';
import { Prestador } from '@/services/marketplaceService';

interface Props {
  prestador: Prestador;
  onContatar: () => void;
  onAbrirPerfil: () => void;
  contatando?: boolean;
}

export function ProfessionalCard({ prestador, onContatar, onAbrirPerfil, contatando }: Props) {
  const inicial = prestador.nome?.charAt(0)?.toUpperCase() || '?';

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.corpo} onPress={onAbrirPerfil}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>{inicial}</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.nome}>{prestador.nome}</Text>
          <Text style={styles.segmento}>{prestador.segmento || 'Serviços gerais'}</Text>

          <View style={styles.linha}>
            <Text style={styles.estrelas}>
              ⭐ {prestador.avaliacao?.toFixed(1) ?? '5.0'} ({prestador.total_avaliacoes})
            </Text>
            {prestador.distancia_km != null && (
              <Text style={styles.distancia}>· {formatarDistancia(prestador.distancia_km)}</Text>
            )}
          </View>

          {prestador.valor_servico != null && (
            <Text style={styles.preco}>R$ {prestador.valor_servico.toFixed(2)}</Text>
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.botao, contatando && styles.botaoDesabilitado]}
        onPress={onContatar}
        disabled={contatando}
      >
        <Text style={styles.botaoTexto}>{contatando ? '...' : 'Contato'}</Text>
      </TouchableOpacity>
    </View>
  );
}

function formatarDistancia(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  corpo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.roxo,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarTexto: { color: colors.textForte, fontWeight: '800', fontSize: 18 },
  info: { flex: 1 },
  nome: { color: colors.textForte, fontWeight: '700', fontSize: 15 },
  segmento: { color: colors.muted, fontSize: 12, marginTop: 2 },
  linha: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  estrelas: { color: colors.text, fontSize: 12 },
  distancia: { color: colors.muted, fontSize: 12, marginLeft: 4 },
  preco: { color: colors.green, fontWeight: '700', fontSize: 14, marginTop: 4 },
  botao: {
    backgroundColor: colors.laranja,
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  botaoDesabilitado: { opacity: 0.6 },
  botaoTexto: { color: '#1a1a1a', fontWeight: '700', fontSize: 12 },
});
