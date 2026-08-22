import { useEffect, useRef, useState } from 'react';
import { carregarGoogleMaps, extrairEnderecoDoPlace } from '../services/mapsService';

// Sem chave do Google Maps configurada, isso vira um <input> comum
// (o usuário digita a cidade manualmente, sem sugestões nem lat/lng).
export function AddressAutocompleteInput({ value, onChange, onSelecionar, placeholder, style }) {
  const inputRef = useRef(null);
  const [mapsDisponivel, setMapsDisponivel] = useState(false);

  useEffect(() => {
    let ativo = true;
    carregarGoogleMaps().then((ok) => {
      if (!ativo || !ok || !inputRef.current || !window.google?.maps?.places) return;

      setMapsDisponivel(true);
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['geocode'],
        componentRestrictions: { country: 'br' },
        fields: ['formatted_address', 'address_components', 'geometry'],
      });
      autocomplete.addListener('place_changed', () => {
        const dados = extrairEnderecoDoPlace(autocomplete.getPlace());
        if (dados) onSelecionar(dados);
      });
    });
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <input
      ref={inputRef}
      style={style}
      placeholder={mapsDisponivel ? placeholder : `${placeholder} (cidade)`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
