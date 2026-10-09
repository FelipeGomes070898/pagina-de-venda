import { useEffect, useRef, useState } from 'react';
import { carregarGoogleMaps } from '../services/mapsService';

// Mapa com um pino pra cada serviço concluído que tem localização
// registrada (pedidos sem lat/lng — ex.: antigos, ou cuja negociação
// nunca chegou a liberar o endereço — não aparecem aqui, não tem como
// desenhar um pino sem coordenada).
export function MapaTrabalhos({ pedidos }) {
  const mapaRef = useRef(null);
  const [apiDisponivel, setApiDisponivel] = useState(null);

  useEffect(() => {
    carregarGoogleMaps().then(setApiDisponivel);
  }, []);

  useEffect(() => {
    if (!apiDisponivel || !mapaRef.current || pedidos.length === 0) return;

    const google = window.google;
    const bounds = new google.maps.LatLngBounds();
    const mapa = new google.maps.Map(mapaRef.current, {
      center: { lat: Number(pedidos[0].lat), lng: Number(pedidos[0].lng) },
      zoom: 13,
      disableDefaultUI: true,
      zoomControl: true,
      clickableIcons: false,
    });

    pedidos.forEach((pedido) => {
      const posicao = { lat: Number(pedido.lat), lng: Number(pedido.lng) };
      bounds.extend(posicao);

      const marcador = new google.maps.Marker({
        position: posicao,
        map: mapa,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: '#d97706',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
      });

      const dataFormatada = pedido.criado_em
        ? new Date(pedido.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
        : '';
      const infoJanela = new google.maps.InfoWindow({
        content: `<div style="font:13px sans-serif;max-width:200px">
          <strong>${pedido.endereco || 'Serviço concluído'}</strong><br>
          ${dataFormatada}
        </div>`,
      });
      marcador.addListener('click', () => infoJanela.open(mapa, marcador));
    });

    if (pedidos.length > 1) mapa.fitBounds(bounds, 40);
  }, [apiDisponivel, pedidos]);

  if (pedidos.length === 0) {
    return <p style={styles.vazio}>Ainda sem serviços concluídos com localização registrada.</p>;
  }
  if (apiDisponivel === false) {
    return <p style={styles.vazio}>Mapa indisponível no momento.</p>;
  }
  return <div ref={mapaRef} style={styles.mapa} />;
}

const styles = {
  mapa: { width: '100%', height: 220, borderRadius: 12, overflow: 'hidden' },
  vazio: { color: 'var(--konectaja-muted)', fontSize: 12.5, margin: 0 },
};
