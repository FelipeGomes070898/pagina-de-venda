import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';
import { Prestador } from '@/services/marketplaceService';
import { formatarDistancia } from '@/utils/distancia';

interface Props {
  prestador: Prestador;
  onContatar?: () => void;
  onAbrirPerfil: () => void;
  contatando?: boolean;
  ocultarContato?: boolean;
}

export function ProfessionalCard({ prestador, onContatar, onAbrirPerfil, contatando, ocultarContato }: Props) {
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
              ★ {Number(prestador.avaliacao ?? 5).toFixed(1)} ({prestador.total_avaliacoes})
            </Text>
            {prestador.distancia_km != null && (
              <Text style={styles.distancia}>· {formatarDistancia(prestador.distancia_km)}</Text>
            )}
          </View>

          {prestador.valor_servico != null && (
            <Text style={styles.preco}>R$ {Number(prestador.valor_servico).toFixed(2)}</Text>
          )}
          {(prestador.servicos?.length ?? 0) > 0 && (
            <Text style={styles.tambemFaz}>
              Também faz: {prestador.servicos!.map((s) => s.categoria).join(', ')}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {!ocultarContato && (
        <TouchableOpacity
          style={[styles.botao, contatando && styles.botaoDesabilitado]}
          onPress={onContatar}
          disabled={contatando}
        >
          <Text style={styles.botaoTexto}>{contatando ? '...' : 'Contato'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
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
    backgroundColor: colors.laranja,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarTexto: { color: '#fff', fontWeight: '800', fontSize: 18 },
  info: { flex: 1 },
  nome: { color: colors.textForte, fontWeight: '700', fontSize: 15 },
  segmento: { color: colors.muted, fontSize: 12, marginTop: 2 },
  linha: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  estrelas: { color: colors.text, fontSize: 12 },
  distancia: { color: colors.muted, fontSize: 12, marginLeft: 4 },
  preco: { color: colors.laranja, fontWeight: '700', fontSize: 14, marginTop: 4 },
  tambemFaz: { color: colors.muted, fontSize: 11, marginTop: 4 },
  botao: {
    backgroundColor: colors.laranja,
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  botaoDesabilitado: { opacity: 0.6 },
  botaoTexto: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
