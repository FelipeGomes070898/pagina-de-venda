import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SubPaginaHeader } from '../../components/SubPaginaHeader';
import { listarMapaPrestadores } from '../../services/marketplaceService';
import { dataUriBoneco } from '../../utils/bonecos';
import { obterLocalizacaoAtual } from '../../services/locationService';
import { useAuthStore } from '../../store/authStore';

// Em vez de um mapa de verdade (que precisaria de uma coordenada, nem
// que aproximada, de cada prestador), isso é um "radar": só a
// distância até você importa, nunca o endereço ou a direção de
// ninguém. Cada anel é uma faixa de distância; dentro do anel, a
// posição exata é só estética (distribuída/espalhada), não tem
// nenhuma coordenada real por trás.
const FAIXAS = [
  { ateKm: 1, raio: 34, rotulo: 'até 1 km' },
  { ateKm: 3, raio: 68, rotulo: 'até 3 km' },
  { ateKm: 5, raio: 102, rotulo: 'até 5 km' },
  { ateKm: 10, raio: 136, rotulo: 'até 10 km' },
  { ateKm: Infinity, raio: 170, rotulo: 'mais de 10 km' },
];

function faixaDe(distanciaKm) {
  if (distanciaKm == null) return FAIXAS[FAIXAS.length - 1];
  return FAIXAS.find((f) => distanciaKm <= f.ateKm) || FAIXAS[FAIXAS.length - 1];
}

export function MapaTrabalhadores() {
  const cidadeUsuario = useAuthStore((s) => s.usuario?.cidade);
  const navigate = useNavigate();

  const [prestadores, setPrestadores] = useState(null);
  const [erro, setErro] = useState(null);
  const [selecionado, setSelecionado] = useState(null);

  useEffect(() => {
    obterLocalizacaoAtual()
      .catch(() => null)
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
  // estética (ângulo não representa direção real nenhuma).
  const posicionados = useMemo(() => {
    if (!prestadores) return [];
    const porFaixa = new Map();
    prestadores.forEach((p) => {
      const faixa = faixaDe(p.distanciaKm);
      if (!porFaixa.has(faixa)) porFaixa.set(faixa, []);
      porFaixa.get(faixa).push(p);
    });

    const resultado = [];
    porFaixa.forEach((lista, faixa) => {
      lista.forEach((p, i) => {
        const angulo = (i / lista.length) * 2 * Math.PI + (faixa.raio / 97);
        resultado.push({
          ...p,
          x: 180 + Math.cos(angulo) * faixa.raio,
          y: 180 + Math.sin(angulo) * faixa.raio,
        });
      });
    });
    return resultado;
  }, [prestadores]);

  return (
    <div style={styles.pagina}>
      <SubPaginaHeader titulo="Trabalhadores por perto" voltarPara="/" />
      <div style={styles.container}>
        <p style={styles.ajuda}>
          Cada boneco é um prestador disponível, posicionado só pela distância até você — nunca mostramos
          endereço ou direção de ninguém.
        </p>

        {erro && <p style={styles.erro}>{erro}</p>}

        {prestadores === null ? (
          <p style={styles.info}>Carregando...</p>
        ) : prestadores.length === 0 ? (
          <p style={styles.info}>Nenhum prestador disponível por aqui ainda.</p>
        ) : (
          <>
            <div style={styles.radarWrapper}>
              <svg viewBox="0 0 360 360" width="100%" style={styles.radarSvg}>
                {FAIXAS.map((f) => (
                  <circle key={f.rotulo} cx={180} cy={180} r={f.raio} fill="none" stroke="var(--konectaja-border)" strokeWidth="1" />
                ))}
                <circle cx={180} cy={180} r={5} fill="var(--konectaja-laranja-escuro)" />
                <text x={180} y={166} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--konectaja-text-forte)">
                  Você
                </text>

                {posicionados.map((p) => (
                  <image
                    key={p.id}
                    href={dataUriBoneco(p.avatarGenero, { tamanho: 40, segmento: p.segmento })}
                    x={p.x - 18}
                    y={p.y - 18}
                    width={36}
                    height={36}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelecionado(p)}
                  />
                ))}
              </svg>
            </div>

            <div style={styles.legendaFaixas}>
              {FAIXAS.map((f) => (
                <span key={f.rotulo} style={styles.legendaFaixaItem}>
                  {f.rotulo}
                </span>
              ))}
            </div>

            {selecionado && (
              <div style={styles.cartaoSelecionado}>
                <img
                  src={dataUriBoneco(selecionado.avatarGenero, { tamanho: 48, segmento: selecionado.segmento })}
                  alt=""
                  style={styles.cartaoBoneco}
                />
                <div style={styles.cartaoTextos}>
                  <div style={styles.cartaoNome}>{selecionado.nome}</div>
                  <div style={styles.cartaoSegmento}>
                    {selecionado.segmento || 'Serviço geral'}
                    {selecionado.distanciaKm != null && ` · ${selecionado.distanciaKm} km`}
                  </div>
                </div>
                <button style={styles.cartaoBotao} onClick={() => navigate(`/prestador/${selecionado.id}`)}>
                  Ver perfil
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  pagina: { minHeight: '100vh' },
  container: { maxWidth: 480, margin: '0 auto', padding: '20px 24px 48px' },
  ajuda: { color: 'var(--konectaja-muted)', fontSize: 12.5, marginTop: 0, marginBottom: 14, lineHeight: 1.5 },
  erro: { color: 'var(--konectaja-red)', fontSize: 13, marginBottom: 10 },
  info: { color: 'var(--konectaja-muted)', fontSize: 13, textAlign: 'center', marginTop: 24 },
  radarWrapper: {
    background: 'var(--konectaja-bg2)',
    border: '1px solid var(--konectaja-border)',
    borderRadius: 16,
    padding: 8,
  },
  radarSvg: { display: 'block' },
  legendaFaixas: { display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 10 },
  legendaFaixaItem: { fontSize: 11, color: 'var(--konectaja-muted)' },
  cartaoSelecionado: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    background: 'var(--konectaja-bg2)',
    border: '1px solid var(--konectaja-border)',
    borderRadius: 14,
    padding: 12,
  },
  cartaoBoneco: { width: 48, height: 48, flex: 'none' },
  cartaoTextos: { flex: 1, minWidth: 0 },
  cartaoNome: { color: 'var(--konectaja-text-forte)', fontWeight: 700, fontSize: 14 },
  cartaoSegmento: { color: 'var(--konectaja-muted)', fontSize: 12, marginTop: 2 },
  cartaoBotao: {
    flex: 'none',
    height: 36,
    padding: '0 12px',
    borderRadius: 999,
    border: 'none',
    background: 'var(--konectaja-laranja)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 12,
  },
};
