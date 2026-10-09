import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { BottomNav } from '../../components/BottomNav';
import { meuPerfil, atualizarFotoPerfil, trocarPapel } from '../../services/authService';
import { enviarImagem } from '../../services/uploadService';
import { mensagemErro } from '../../utils/erro';

const ROTULOS_TIPO = { cliente: 'Cliente', prestador: 'Prestador de serviço' };

// Hub do perfil: a identidade (foto/nome/tipo) fica aqui, o resto vira
// um menu — cada seção tem muita informação/formulário pra caber tudo
// numa página só sem virar uma rolagem infinita (era basicamente isso
// que a tela antiga tinha virado).
export function MeuPerfil() {
  const usuario = useAuthStore((s) => s.usuario);
  const logout = useAuthStore((s) => s.logout);
  const definirSessao = useAuthStore((s) => s.definirSessao);
  const navigate = useNavigate();

  const [perfil, setPerfil] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [trocandoPapel, setTrocandoPapel] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const inputFotoPerfil = useRef(null);

  useEffect(() => {
    meuPerfil()
      .then(setPerfil)
      .catch((erro) => setErro(mensagemErro(erro, 'Não foi possível carregar seus dados.')))
      .finally(() => setCarregando(false));
  }, []);

  async function aoEscolherFotoPerfil(e) {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo) return;

    setEnviandoFoto(true);
    setErro(null);
    try {
      const url = await enviarImagem(arquivo, `perfil/${usuario.tipo}/${usuario.id}/foto.jpg`);
      const atualizado = await atualizarFotoPerfil(url);
      setPerfil((p) => ({ ...p, ...atualizado }));
    } catch (erro) {
      setErro(erro.message || 'Não foi possível enviar a foto. Verifique sua internet e tente de novo.');
    } finally {
      setEnviandoFoto(false);
    }
  }

  async function aoTrocarPapel() {
    setTrocandoPapel(true);
    setErro(null);
    try {
      const { token, usuario: novoUsuario } = await trocarPapel();
      definirSessao({ token, usuario: novoUsuario });
      navigate('/');
    } catch (erro) {
      setErro(mensagemErro(erro, 'Não foi possível trocar de modo agora.'));
      setTrocandoPapel(false);
    }
  }

  if (carregando) {
    return (
      <div style={styles.pagina}>
        <BottomNav />
        <div style={styles.centro}>Carregando...</div>
      </div>
    );
  }
  if (erro && !perfil) {
    return (
      <div style={styles.pagina}>
        <BottomNav />
        <div style={styles.centro}>{erro}</div>
      </div>
    );
  }

  const souPrestador = perfil.tipo === 'prestador';

  return (
    <div style={styles.pagina}>
      <BottomNav />

      <button style={styles.botaoMenu} onClick={() => setMenuAberto(true)} aria-label="Abrir menu do perfil">
        <IconeHamburguer />
      </button>

      <div style={styles.container}>
        <button
          type="button"
          style={styles.avatarWrapper}
          onClick={() => inputFotoPerfil.current?.click()}
          disabled={enviandoFoto}
        >
          {perfil.foto_url ? (
            <img src={perfil.foto_url} alt={perfil.nome} style={styles.avatarFoto} />
          ) : (
            <div style={styles.avatar}>{perfil.nome.charAt(0).toUpperCase()}</div>
          )}
          <div style={styles.avatarEditar}>
            {enviandoFoto ? (
              '...'
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 8h3l1.5-2h7L17 8h3v11H4V8Z" /><circle cx="12" cy="13.5" r="3.2" />
              </svg>
            )}
          </div>
        </button>
        <input
          ref={inputFotoPerfil}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={aoEscolherFotoPerfil}
        />

        <h1 style={styles.nome}>{perfil.nome}</h1>
        <p style={styles.tipo}>{ROTULOS_TIPO[perfil.tipo] || perfil.tipo}</p>

        {erro && <p style={styles.erro}>{erro}</p>}

        {souPrestador && (
          <div style={styles.albumSecao}>
            <div style={styles.albumCabecalho}>
              <h2 style={styles.albumTitulo}>Álbum de trabalhos</h2>
              <Link to="/perfil/album" style={styles.albumVerTudo}>
                Ver tudo
              </Link>
            </div>

            {(perfil.fotos?.length ?? 0) > 0 ? (
              <Link to="/perfil/album" style={styles.albumGrade}>
                {perfil.fotos.slice(0, 6).map((foto, i) => (
                  <div key={foto.id} style={styles.albumItem}>
                    <img src={foto.url} alt={foto.legenda || 'Trabalho realizado'} style={styles.albumFoto} />
                    {i === 5 && perfil.fotos.length > 6 && (
                      <div style={styles.albumMais}>+{perfil.fotos.length - 6}</div>
                    )}
                  </div>
                ))}
              </Link>
            ) : (
              <Link to="/perfil/album" style={styles.albumVazio}>
                + Adicionar fotos dos seus trabalhos
              </Link>
            )}
          </div>
        )}

        {!souPrestador && !perfil.temPapelPrestador && (
          <Link to="/perfil/tornar-prestador" style={styles.botaoTornarPrestador}>
            + Quero também trabalhar
          </Link>
        )}

        {((souPrestador && perfil.temPapelCliente) || (!souPrestador && perfil.temPapelPrestador)) && (
          <button style={styles.botaoTrocarPapel} onClick={aoTrocarPapel} disabled={trocandoPapel}>
            {trocandoPapel
              ? 'Trocando...'
              : souPrestador
                ? '⇄ Mudar para modo cliente'
                : '⇄ Mudar para modo prestador'}
          </button>
        )}

        <button style={styles.botaoSair} onClick={logout}>
          Sair da conta
        </button>
      </div>

      {menuAberto && (
        <div style={styles.drawerFundo} onClick={() => setMenuAberto(false)}>
          <div style={styles.drawerPainel} onClick={(e) => e.stopPropagation()}>
            <div style={styles.drawerCabecalho}>
              <span style={styles.drawerTitulo}>Menu</span>
              <button style={styles.drawerFechar} onClick={() => setMenuAberto(false)} aria-label="Fechar">
                <IconeFechar />
              </button>
            </div>

            <div style={styles.menu}>
              <ItemMenu
                to="/perfil/dados-pessoais"
                icone={<IconePessoa />}
                titulo="Dados pessoais"
                descricao="E-mail, telefone, CPF, cidade"
                aoClicar={() => setMenuAberto(false)}
              />

              {souPrestador ? (
                <>
                  <ItemMenu
                    to="/perfil/prestador"
                    icone={<IconeMala />}
                    titulo="Dados de prestador"
                    descricao="Serviço, valor, cobrança, avaliação"
                    aoClicar={() => setMenuAberto(false)}
                  />
                  <ItemMenu
                    to="/perfil/mapa-trabalhos"
                    icone={<IconePino />}
                    titulo="Mapa dos trabalhos"
                    descricao="Onde você já prestou serviço"
                    aoClicar={() => setMenuAberto(false)}
                  />
                  <ItemMenu
                    to="/perfil/area-servico"
                    icone={<IconeFerramenta />}
                    titulo="Área de serviço"
                    descricao="Outros trabalhos que você também faz"
                    aoClicar={() => setMenuAberto(false)}
                  />
                  <ItemMenu
                    to="/perfil/album"
                    icone={<IconeFoto />}
                    titulo="Álbum de trabalhos"
                    descricao="Fotos de serviços já feitos"
                    aoClicar={() => setMenuAberto(false)}
                  />
                </>
              ) : (
                <ItemMenu
                  to="/perfil/historico"
                  icone={<IconeMala />}
                  titulo="Meu histórico"
                  descricao="Serviços contratados e avaliações"
                  aoClicar={() => setMenuAberto(false)}
                />
              )}

              <ItemMenu
                to="/perfil/privacidade"
                icone={<IconeEscudo />}
                titulo="Privacidade e dados"
                descricao="LGPD, baixar dados, excluir conta"
                aoClicar={() => setMenuAberto(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ItemMenu({ to, icone, titulo, descricao, aoClicar }) {
  return (
    <Link to={to} style={styles.itemMenu} onClick={aoClicar}>
      <div style={styles.itemMenuIcone}>{icone}</div>
      <div style={styles.itemMenuTextos}>
        <div style={styles.itemMenuTitulo}>{titulo}</div>
        <div style={styles.itemMenuDescricao}>{descricao}</div>
      </div>
      <IconeSeta />
    </Link>
  );
}

function IconeHamburguer() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}
function IconeFechar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function IconePessoa() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6.5 8-6.5s8 2.5 8 6.5" />
    </svg>
  );
}
function IconeMala() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
function IconePino() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.4" />
    </svg>
  );
}
function IconeFerramenta() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2-2 2.6-2.6Z" />
    </svg>
  );
}
function IconeFoto() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="m21 17-5-4-4 3-3-2-6 5" />
    </svg>
  );
}
function IconeEscudo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 4 6v6c0 5 4 8 8 9 4-1 8-4 8-9V6Z" />
    </svg>
  );
}
function IconeSeta() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--konectaja-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

const styles = {
  pagina: { minHeight: '100vh' },
  centro: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    color: 'var(--konectaja-muted)',
  },
  container: { maxWidth: 480, margin: '0 auto', padding: '0 24px 104px' },
  avatarWrapper: {
    position: 'relative',
    width: 88,
    height: 88,
    margin: '0 auto 16px',
    display: 'block',
    border: 'none',
    background: 'transparent',
    padding: 0,
    cursor: 'pointer',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 999,
    background: 'linear-gradient(135deg, #F6AD3C, var(--konectaja-laranja-escuro))',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 36,
    boxShadow: '0 4px 10px rgba(180, 83, 9, 0.35)',
    border: '2.5px solid #fff',
  },
  avatarFoto: { width: 88, height: 88, borderRadius: 999, objectFit: 'cover' },
  avatarEditar: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    background: 'var(--konectaja-bg2)',
    border: '1px solid var(--konectaja-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--konectaja-shadow-sm)',
    fontSize: 13,
  },
  nome: { color: 'var(--konectaja-text-forte)', fontSize: 20, textAlign: 'center', margin: 0 },
  tipo: { color: 'var(--konectaja-muted)', fontSize: 14, textAlign: 'center', marginTop: 4 },
  erro: { color: 'var(--konectaja-red)', fontSize: 13, textAlign: 'center', marginTop: 12 },
  botaoMenu: {
    position: 'fixed',
    top: 16,
    left: 16,
    zIndex: 60,
    width: 44,
    height: 44,
    borderRadius: 999,
    border: '1px solid var(--konectaja-border)',
    background: 'var(--konectaja-bg2)',
    color: 'var(--konectaja-text-forte)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--konectaja-shadow-md)',
  },
  albumSecao: { marginTop: 28 },
  albumCabecalho: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  albumTitulo: { color: 'var(--konectaja-text-forte)', fontSize: 16, margin: 0 },
  albumVerTudo: { color: 'var(--konectaja-laranja-escuro)', fontWeight: 700, fontSize: 12.5, textDecoration: 'none' },
  albumGrade: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
    textDecoration: 'none',
  },
  albumItem: { position: 'relative', aspectRatio: '1', borderRadius: 12, overflow: 'hidden' },
  albumFoto: { width: '100%', height: '100%', objectFit: 'cover' },
  albumMais: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(28,25,23,0.55)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 16,
  },
  albumVazio: {
    display: 'block',
    textAlign: 'center',
    padding: '22px 16px',
    borderRadius: 14,
    border: '1px dashed var(--konectaja-border)',
    background: 'var(--konectaja-bg3)',
    color: 'var(--konectaja-muted)',
    fontWeight: 600,
    fontSize: 13,
    textDecoration: 'none',
  },
  drawerFundo: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(28,25,23,.35)',
    zIndex: 70,
    display: 'flex',
    justifyContent: 'flex-start',
  },
  drawerPainel: {
    width: 320,
    maxWidth: '85vw',
    height: '100%',
    background: 'var(--konectaja-bg)',
    borderRight: '1px solid var(--konectaja-border)',
    boxShadow: 'var(--konectaja-shadow-lg)',
    display: 'flex',
    flexDirection: 'column',
    padding: '18px 18px 24px',
    overflowY: 'auto',
  },
  drawerCabecalho: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  drawerTitulo: { fontWeight: 800, fontSize: 16, color: 'var(--konectaja-text-forte)' },
  drawerFechar: {
    background: 'transparent',
    border: 'none',
    color: 'var(--konectaja-muted)',
    display: 'flex',
    padding: 4,
  },
  menu: { display: 'flex', flexDirection: 'column', gap: 10 },
  itemMenu: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    background: 'var(--konectaja-bg2)',
    border: '1px solid var(--konectaja-border)',
    borderRadius: 14,
    padding: '14px 16px',
    textDecoration: 'none',
  },
  itemMenuIcone: {
    flex: 'none',
    width: 38,
    height: 38,
    borderRadius: 10,
    background: 'var(--konectaja-bg3)',
    color: 'var(--konectaja-laranja-escuro)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemMenuTextos: { flex: 1, minWidth: 0 },
  itemMenuTitulo: { color: 'var(--konectaja-text-forte)', fontWeight: 700, fontSize: 14 },
  itemMenuDescricao: {
    color: 'var(--konectaja-muted)',
    fontSize: 12,
    marginTop: 2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  botaoTornarPrestador: {
    display: 'block',
    textAlign: 'center',
    width: '100%',
    height: 48,
    lineHeight: '48px',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(180deg, var(--konectaja-laranja), var(--konectaja-laranja-escuro))',
    color: '#fff',
    fontWeight: 700,
    fontSize: 14,
    marginTop: 24,
    textDecoration: 'none',
    boxSizing: 'border-box',
  },
  botaoTrocarPapel: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    border: '1px solid var(--konectaja-laranja)',
    background: 'var(--konectaja-laranja-soft)',
    color: 'var(--konectaja-laranja-escuro)',
    fontWeight: 700,
    fontSize: 14,
    marginTop: 24,
  },
  botaoSair: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    border: '1px solid var(--konectaja-border)',
    background: 'transparent',
    color: 'var(--konectaja-text)',
    fontWeight: 700,
    fontSize: 14,
    marginTop: 28,
  },
};
