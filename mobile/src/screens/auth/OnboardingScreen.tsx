import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { colors, spacing } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width } = Dimensions.get('window');
const CHAVE_ONBOARDING_VISTO = '@vexo/onboarding_visto';

const SLIDES = [
  { icone: '🔍', chaveTitulo: 'onboarding.slide1_title', chaveTexto: 'onboarding.slide1_text' },
  { icone: '💬', chaveTitulo: 'onboarding.slide2_title', chaveTexto: 'onboarding.slide2_text' },
  { icone: '⭐', chaveTitulo: 'onboarding.slide3_title', chaveTexto: 'onboarding.slide3_text' },
];

export function OnboardingScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [indice, setIndice] = useState(0);
  const listaRef = useRef<FlatList>(null);

  const finalizar = async () => {
    await AsyncStorage.setItem(CHAVE_ONBOARDING_VISTO, '1');
    navigation.replace('Login');
  };

  const proximo = () => {
    if (indice < SLIDES.length - 1) {
      listaRef.current?.scrollToIndex({ index: indice + 1 });
    } else {
      finalizar();
    }
  };

  const aoRolar = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const novoIndice = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndice(novoIndice);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.pular} onPress={finalizar}>
        <Text style={styles.pularTexto}>{t('onboarding.skip')}</Text>
      </TouchableOpacity>

      <FlatList
        ref={listaRef}
        data={SLIDES}
        keyExtractor={(item) => item.chaveTitulo}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={aoRolar}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Text style={styles.icone}>{item.icone}</Text>
            <Text style={styles.titulo}>{t(item.chaveTitulo)}</Text>
            <Text style={styles.texto}>{t(item.chaveTexto)}</Text>
          </View>
        )}
      />

      <View style={styles.pontos}>
        {SLIDES.map((item, i) => (
          <View
            key={item.chaveTitulo}
            style={[styles.ponto, i === indice && styles.pontoAtivo]}
          />
        ))}
      </View>

      <PrimaryButton
        label={indice === SLIDES.length - 1 ? t('onboarding.start') : t('onboarding.next')}
        onPress={proximo}
        style={styles.botao}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  pular: { alignSelf: 'flex-end', padding: spacing.lg },
  pularTexto: { color: colors.muted, fontSize: 14 },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  icone: { fontSize: 64, marginBottom: spacing.lg },
  titulo: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textForte,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  texto: { fontSize: 15, color: colors.text, textAlign: 'center' },
  pontos: { flexDirection: 'row', justifyContent: 'center', marginBottom: spacing.lg },
  ponto: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  pontoAtivo: { backgroundColor: colors.laranja, width: 20 },
  botao: { marginHorizontal: spacing.xl, marginBottom: spacing.xl },
});
