import { useEffect, useRef, useState } from 'react';
import { SubPaginaHeader } from '../../components/SubPaginaHeader';
import { carregarGoogleMaps } from '../../services/mapsService';
import { listarMapaPrestadores } from '../../services/marketplaceService';
import { dataUriBoneco } from '../../utils/bonecos';
import { obterLocalizacaoAtual } from '../../services/locationService';
import { useAuthStore } from '../../store/authStore';

// Mapa com um "boneco" por prestador disponível — nunca mostra pedido
// nenhum (endereço de cliente é dado privado, só visível pra ele e o
// prestador daquele chat específico; ver Prestador.listarParaMapa no
// backend, que também nunca devolve a coordenada exata de ninguém).
export function MapaTrabalhadores() {
  const cidadeUsuario = useAuthStore((s) => s.usuario?.cidade);
  const mapaRef = useRef(null);
  const [apiDisponivel, setApiDisponivel] = useState(null);
  const [prestadores, setPrestadores] = useState(null);
  const [erro, setErro] = useState(null);
  const [localizacao, setLocalizacao] = useState(null);

  useEffect(() => {
    carregarGoogleMaps().then(setApiDisponivel);
    obterLocalizacaoAtual()
      .then(setLocalizacao)
      .catch(() => {});
    listarMapaPrestadores({ cidade: cidadeUsuario || undefined })
      .then(setPrestadores)
      .catch(() => setErro('Não foi possível carregar o mapa agora.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!apiDisponivel || !prestadores || !mapaRef.current) return;

    const google = window.google;
    const centro =
      localizacao ||
      (prestadores.length > 0 ? { lat: prestadores[0].lat, lng: prestadores[0].lng } : { lat: -15.78, lng: -47.93 });

    const mapa = new google.maps.Map(mapaRef.current, {
      center: centro,
      zoom: prestadores.length > 0 ? 12 : 4,
      disableDefaultUI: true,
      zoomControl: true,
    });

    const bounds = new google.maps.LatLngBounds();
    prestadores.forEach((p) => {
      const posicao = { lat: p.lat, lng: p.lng };
      bounds.extend(posicao);

      const marcador = new google.maps.Marker({
        position: posicao,
        map: mapa,
        title: `${p.nome}${p.segmento ? ` — ${p.segmento}` : ''}`,
        icon: {
          url: dataUriBoneco(p.avatarGenero),
          scaledSize: new google.maps.Size(36, 36),
          anchor: new google.maps.Point(18, 18),
        },
      });

      const info = new google.maps.InfoWindow({
        content: `<div style="font:13px sans-serif;max-width:180px">
          <strong>${p.nome}</strong><br>${p.segmento || ''}
        </div>`,
      });
      marcador.addListener('click', () => info.open(mapa, marcador));
    });

    if (prestadores.length > 1) mapa.fitBounds(bounds, 48);
  }, [apiDisponivel, prestadores, localizacao]);

  return (
    <div style={styles.pagina}>
      <SubPaginaHeader titulo="Trabalhadores por perto" voltarPara="/" />
      <div style={styles.container}>
        <p style={styles.ajuda}>
          Cada boneco é um prestador disponível. A posição é aproximada — nunca mostramos o endereço exato
          de ninguém.
        </p>

        {erro && <p style={styles.erro}>{erro}</p>}

        {prestadores === null ? (
          <p style={styles.info}>Carregando...</p>
        ) : apiDisponivel === false ? (
          <p style={styles.info}>Mapa indisponível no momento.</p>
        ) : prestadores.length === 0 ? (
          <p style={styles.info}>Nenhum prestador disponível por aqui ainda.</p>
        ) : (
          <div ref={mapaRef} style={styles.mapa} />
        )}
      </div>
    </div>
  );
}

const styles = {
  pagina: { minHeight: '100vh' },
  container: { maxWidth: 640, margin: '0 auto', padding: '20px 24px 48px' },
  ajuda: { color: 'var(--konectaja-muted)', fontSize: 12.5, marginTop: 0, marginBottom: 12, lineHeight: 1.5 },
  erro: { color: 'var(--konectaja-red)', fontSize: 13, marginBottom: 10 },
  info: { color: 'var(--konectaja-muted)', fontSize: 13, textAlign: 'center', marginTop: 24 },
  mapa: { width: '100%', height: 420, borderRadius: 14, overflow: 'hidden' },
};
