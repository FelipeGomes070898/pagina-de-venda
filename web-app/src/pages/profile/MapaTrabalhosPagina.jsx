import { useEffect, useState } from 'react';
import { SubPaginaHeader } from '../../components/SubPaginaHeader';
import { MapaTrabalhos } from '../../components/MapaTrabalhos';
import { listarMinhasConversas } from '../../services/marketplaceService';

export function MapaTrabalhosPagina() {
  const [locais, setLocais] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    listarMinhasConversas()
      .then((pedidos) =>
        setLocais(pedidos.filter((p) => p.status === 'concluido' && p.lat != null && p.lng != null)),
      )
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  return (
    <div style={styles.pagina}>
      <SubPaginaHeader titulo="Mapa dos trabalhos" />
      <div style={styles.container}>
        <p style={styles.ajuda}>Onde você já prestou serviço, com base nos pedidos concluídos.</p>
        {carregando ? <p style={styles.info}>Carregando...</p> : <MapaTrabalhos pedidos={locais} />}
      </div>
    </div>
  );
}

const styles = {
  pagina: { minHeight: '100vh' },
  container: { maxWidth: 480, margin: '0 auto', padding: '20px 24px 48px' },
  ajuda: { color: 'var(--konectaja-muted)', fontSize: 12.5, marginTop: 0, marginBottom: 14 },
  info: { color: 'var(--konectaja-muted)', fontSize: 13, textAlign: 'center', marginTop: 24 },
};
