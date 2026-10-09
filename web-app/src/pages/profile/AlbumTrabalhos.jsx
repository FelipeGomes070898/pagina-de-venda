import { useEffect, useRef, useState } from 'react';
import { SubPaginaHeader } from '../../components/SubPaginaHeader';
import { useAuthStore } from '../../store/authStore';
import { meuPerfil } from '../../services/authService';
import { adicionarFotoTrabalho, removerFotoTrabalho } from '../../services/fotoTrabalhoService';
import { enviarImagem } from '../../services/uploadService';
import { mensagemErro } from '../../utils/erro';

export function AlbumTrabalhos() {
  const usuario = useAuthStore((s) => s.usuario);
  const [fotos, setFotos] = useState(null);
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const inputFoto = useRef(null);

  useEffect(() => {
    meuPerfil()
      .then((p) => setFotos(p.fotos ?? []))
      .catch((erro) => setErro(mensagemErro(erro, 'Não foi possível carregar seus dados.')));
  }, []);

  async function aoEscolherFoto(e) {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo) return;

    setEnviando(true);
    setErro(null);
    try {
      const url = await enviarImagem(arquivo, `trabalhos/${usuario.id}/${Date.now()}.jpg`);
      const foto = await adicionarFotoTrabalho({ url });
      setFotos((lista) => [...(lista ?? []), foto]);
    } catch (erro) {
      setErro(erro.message || 'Não foi possível enviar a foto. Verifique sua internet e tente de novo.');
    } finally {
      setEnviando(false);
    }
  }

  async function aoRemover(fotoId) {
    try {
      await removerFotoTrabalho(fotoId);
      setFotos((lista) => lista.filter((f) => f.id !== fotoId));
    } catch (erro) {
      setErro(mensagemErro(erro, 'Não foi possível remover a foto.'));
    }
  }

  return (
    <div style={styles.pagina}>
      <SubPaginaHeader titulo="Álbum de trabalhos" />
      <div style={styles.container}>
        <div style={styles.cabecalhoSecao}>
          <p style={styles.ajuda}>Fotos de serviços que você já fez ajudam o cliente a confiar no seu trabalho.</p>
          {(fotos?.length ?? 0) >= 3 && <span style={styles.seloCompleto}>✓ Perfil completo</span>}
        </div>

        {erro && <p style={styles.erro}>{erro}</p>}

        {fotos === null ? (
          <p style={styles.info}>Carregando...</p>
        ) : (
          <div style={styles.grade}>
            {fotos.map((foto) => (
              <div key={foto.id} style={styles.item}>
                <img src={foto.url} alt={foto.legenda || 'Trabalho realizado'} style={styles.foto} />
                <button style={styles.remover} onClick={() => aoRemover(foto.id)}>
                  ✕
                </button>
              </div>
            ))}
            <button type="button" style={styles.adicionar} onClick={() => inputFoto.current?.click()} disabled={enviando}>
              {enviando ? '...' : '+ Foto'}
            </button>
          </div>
        )}
        <input ref={inputFoto} type="file" accept="image/*" style={{ display: 'none' }} onChange={aoEscolherFoto} />
      </div>
    </div>
  );
}

const styles = {
  pagina: { minHeight: '100vh' },
  container: { maxWidth: 480, margin: '0 auto', padding: '20px 24px 48px' },
  cabecalhoSecao: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  ajuda: { color: 'var(--konectaja-muted)', fontSize: 12.5, marginTop: 0, marginBottom: 14 },
  info: { color: 'var(--konectaja-muted)', fontSize: 13, textAlign: 'center', marginTop: 24 },
  erro: { color: 'var(--konectaja-red)', fontSize: 13, marginBottom: 12 },
  seloCompleto: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--konectaja-verde)',
    background: 'rgba(16, 185, 129, 0.12)',
    padding: '4px 8px',
    borderRadius: 999,
    whiteSpace: 'nowrap',
  },
  grade: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 },
  item: { position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden' },
  foto: { width: '100%', height: '100%', objectFit: 'cover' },
  remover: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    border: 'none',
    background: 'rgba(0, 0, 0, 0.6)',
    color: '#fff',
    fontSize: 11,
    lineHeight: '20px',
    padding: 0,
  },
  adicionar: {
    aspectRatio: '1',
    borderRadius: 10,
    border: '1px dashed var(--konectaja-border)',
    background: 'var(--konectaja-bg3)',
    color: 'var(--konectaja-muted)',
    fontSize: 12,
    fontWeight: 600,
  },
};
