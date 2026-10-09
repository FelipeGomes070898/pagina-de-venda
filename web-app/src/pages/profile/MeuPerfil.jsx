import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { BottomNav } from '../../components/BottomNav';
import { meuPerfil, atualizarFotoPerfil, exportarDados, excluirConta } from '../../services/authService';
import { adicionarFotoTrabalho, removerFotoTrabalho } from '../../services/fotoTrabalhoService';
import { adicionarServico, removerServico } from '../../services/servicoPrestadorService';
import { enviarImagem } from '../../services/uploadService';
import { listarMinhasConversas } from '../../services/marketplaceService';
import { MapaTrabalhos } from '../../components/MapaTrabalhos';
import { mascararCPF, mascararTelefoneBR } from '../../utils/masks';
import { CATEGORIAS } from '../../constants/categorias';
import { mensagemErro } from '../../utils/erro';

const ROTULOS_TIPO = { cliente: 'Cliente', prestador: 'Prestador de serviço' };
const ROTULOS_COBRANCA = {
  percentual: '5% por serviço concluído',
  fixo_mensal: 'R$ 25,00 fixo por mês',
};

export function MeuPerfil() {
  const usuario = useAuthStore((s) => s.usuario);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const [perfil, setPerfil] = useState(null);
  const [locaisTrabalho, setLocaisTrabalho] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [enviandoFotoTrabalho, setEnviandoFotoTrabalho] = useState(false);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [novoValor, setNovoValor] = useState('');
  const [adicionandoServico, setAdicionandoServico] = useState(false);
  const [mostrarExcluir, setMostrarExcluir] = useState(false);
  const [senhaExcluir, setSenhaExcluir] = useState('');
  const [excluindo, setExcluindo] = useState(false);
  const [erroExcluir, setErroExcluir] = useState(null);
  const inputFotoPerfil = useRef(null);
  const inputFotoTrabalho = useRef(null);

  useEffect(() => {
    carregar();
  }, []);

  function carregar() {
    setCarregando(true);
    meuPerfil()
      .then(setPerfil)
      .catch((erro) => setErro(mensagemErro(erro, 'Não foi possível carregar seus dados.')))
      .finally(() => setCarregando(false));

    if (usuario.tipo === 'prestador') {
      listarMinhasConversas()
        .then((pedidos) =>
          setLocaisTrabalho(pedidos.filter((p) => p.status === 'concluido' && p.lat != null && p.lng != null)),
        )
        .catch(() => {});
    }
  }

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

  async function aoEscolherFotoTrabalho(e) {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo) return;

    setEnviandoFotoTrabalho(true);
    setErro(null);
    try {
      const url = await enviarImagem(arquivo, `trabalhos/${usuario.id}/${Date.now()}.jpg`);
      await adicionarFotoTrabalho({ url });
      carregar();
    } catch (erro) {
      setErro(erro.message || 'Não foi possível enviar a foto. Verifique sua internet e tente de novo.');
    } finally {
      setEnviandoFotoTrabalho(false);
    }
  }

  async function aoRemoverFotoTrabalho(fotoId) {
    try {
      await removerFotoTrabalho(fotoId);
      setPerfil((p) => ({ ...p, fotos: p.fotos.filter((f) => f.id !== fotoId) }));
    } catch (erro) {
      setErro(mensagemErro(erro, 'Não foi possível remover a foto.'));
    }
  }

  async function aoAdicionarServico(e) {
    e.preventDefault();
    if (!novaCategoria.trim()) return;

    setAdicionandoServico(true);
    setErro(null);
    try {
      const servico = await adicionarServico({
        categoria: novaCategoria.trim(),
        valor: novoValor ? Number(novoValor.replace(',', '.')) : undefined,
      });
      setPerfil((p) => ({ ...p, servicos: [...(p.servicos ?? []), servico] }));
      setNovaCategoria('');
      setNovoValor('');
    } catch (erro) {
      setErro(mensagemErro(erro, 'Não foi possível adicionar esse serviço.'));
    } finally {
      setAdicionandoServico(false);
    }
  }

  async function aoRemoverServico(servicoId) {
    try {
      await removerServico(servicoId);
      setPerfil((p) => ({ ...p, servicos: p.servicos.filter((s) => s.id !== servicoId) }));
    } catch (erro) {
      setErro(mensagemErro(erro, 'Não foi possível remover esse serviço.'));
    }
  }

  // LGPD "portabilidade" — baixa um .json com os dados cadastrais.
  async function aoBaixarDados() {
    try {
      const resultado = await exportarDados();
      const blob = new Blob([JSON.stringify(resultado, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'konectaja-meus-dados.json';
      link.click();
      URL.revokeObjectURL(url);
    } catch (erro) {
      setErro(mensagemErro(erro, 'Não foi possível baixar seus dados.'));
    }
  }

  // LGPD "direito ao esquecimento" — exige a senha atual antes de
  // anonimizar a conta (ver backend/src/controllers/authController.js).
  async function aoConfirmarExclusao(e) {
    e.preventDefault();
    if (!senhaExcluir) return;

    setExcluindo(true);
    setErroExcluir(null);
    try {
      await excluirConta(senhaExcluir);
      logout();
      navigate('/login');
    } catch (erro) {
      setErroExcluir(mensagemErro(erro, 'Não foi possível excluir sua conta.'));
    } finally {
      setExcluindo(false);
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

  return (
    <div style={styles.pagina}>
      <BottomNav />

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

        <div style={styles.secao}>
          <h2 style={styles.secaoTitulo}>Dados de cadastro</h2>
          <Campo label="E-mail" valor={perfil.email} />
          <Campo label="Telefone" valor={perfil.telefone ? mascararTelefoneBR(perfil.telefone) : '—'} />
          <Campo label="CPF" valor={perfil.cpf ? mascararCPF(perfil.cpf) : '—'} />
          <Campo label="Cidade" valor={perfil.cidade || '—'} />
          <Campo label="Estado" valor={perfil.estado || '—'} />
        </div>

        {perfil.tipo === 'cliente' && (
          <div style={styles.secao}>
            <h2 style={styles.secaoTitulo}>Seu histórico</h2>
            <Campo label="Serviços contratados" valor={String(perfil.total_servicos ?? 0)} />
            <Campo
              label="Avaliação dos prestadores"
              valor={
                perfil.total_avaliacoes
                  ? `★ ${Number(perfil.avaliacao ?? 5).toFixed(1)} (${perfil.total_avaliacoes} avaliações)`
                  : 'Ainda sem avaliações'
              }
            />
          </div>
        )}

        {perfil.tipo === 'prestador' && (
          <>
            <div style={styles.secao}>
              <h2 style={styles.secaoTitulo}>Dados de prestador</h2>
              <Campo label="Serviço oferecido" valor={perfil.segmento || '—'} />
              <Campo
                label="Valor do serviço"
                valor={perfil.valor_servico != null ? `R$ ${Number(perfil.valor_servico).toFixed(2)}` : '—'}
              />
              <Campo label="Cobrança da plataforma" valor={ROTULOS_COBRANCA[perfil.modelo_cobranca] || '—'} />
              <Campo
                label="Avaliação"
                valor={`★ ${Number(perfil.avaliacao ?? 5).toFixed(1)} (${perfil.total_avaliacoes} avaliações)`}
              />
              <Campo label="Serviços concluídos" valor={String(perfil.total_servicos)} />
            </div>

            <div style={styles.secao}>
              <h2 style={styles.secaoTitulo}>Mapa dos trabalhos realizados</h2>
              <p style={styles.albumAjuda}>Onde você já prestou serviço, com base nos pedidos concluídos.</p>
              <MapaTrabalhos pedidos={locaisTrabalho} />
            </div>

            <div style={styles.secao}>
              <h2 style={styles.secaoTitulo}>Área de serviço</h2>
              <p style={styles.albumAjuda}>
                Outros trabalhos que você também faz, além do seu serviço principal — aparecem no marketplace
                pros clientes (e outros prestadores) encontrarem, cada um com sua própria diária.
              </p>

              {(perfil.servicos?.length ?? 0) > 0 && (
                <div style={styles.listaServicos}>
                  {perfil.servicos.map((servico) => (
                    <div key={servico.id} style={styles.itemServico}>
                      <div>
                        <div style={styles.itemServicoCategoria}>{servico.categoria}</div>
                        {servico.valor != null && (
                          <div style={styles.itemServicoValor}>R$ {Number(servico.valor).toFixed(2)}</div>
                        )}
                      </div>
                      <button style={styles.itemServicoRemover} onClick={() => aoRemoverServico(servico.id)}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form style={styles.formServico} onSubmit={aoAdicionarServico}>
                <input
                  style={styles.inputServicoCategoria}
                  placeholder="Ex.: Encanador, Diarista..."
                  list="categorias-sugestao"
                  value={novaCategoria}
                  onChange={(e) => setNovaCategoria(e.target.value)}
                />
                <datalist id="categorias-sugestao">
                  {CATEGORIAS.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
                <input
                  style={styles.inputServicoValor}
                  placeholder="Diária (R$)"
                  value={novoValor}
                  onChange={(e) => setNovoValor(e.target.value)}
                />
                <button style={styles.botaoAdicionarServico} type="submit" disabled={adicionandoServico}>
                  {adicionandoServico ? '...' : '+ Adicionar'}
                </button>
              </form>
            </div>

            <div style={styles.secao}>
              <div style={styles.albumHeader}>
                <h2 style={styles.secaoTitulo}>Álbum de trabalhos</h2>
                {(perfil.fotos?.length ?? 0) >= 3 && <span style={styles.seloCompleto}>✓ Perfil completo</span>}
              </div>
              <p style={styles.albumAjuda}>
                Fotos de serviços que você já fez ajudam o cliente a confiar no seu trabalho.
              </p>
              <div style={styles.albumGrade}>
                {(perfil.fotos ?? []).map((foto) => (
                  <div key={foto.id} style={styles.albumItem}>
                    <img src={foto.url} alt={foto.legenda || 'Trabalho realizado'} style={styles.albumFoto} />
                    <button style={styles.albumRemover} onClick={() => aoRemoverFotoTrabalho(foto.id)}>
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  style={styles.albumAdicionar}
                  onClick={() => inputFotoTrabalho.current?.click()}
                  disabled={enviandoFotoTrabalho}
                >
                  {enviandoFotoTrabalho ? '...' : '+ Foto'}
                </button>
              </div>
              <input
                ref={inputFotoTrabalho}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={aoEscolherFotoTrabalho}
              />
            </div>
          </>
        )}

        <div style={styles.secao}>
          <h2 style={styles.secaoTitulo}>Privacidade e dados (LGPD)</h2>
          <Link style={styles.linkPrivacidade} to="/legal/privacidade">
            Ver Política de Privacidade
          </Link>
          <Link style={styles.linkPrivacidade} to="/legal/termos">
            Ver Termos de Uso
          </Link>
          <button type="button" style={styles.botaoSecundario} onClick={aoBaixarDados}>
            Baixar meus dados
          </button>
        </div>

        <button style={styles.botaoSair} onClick={logout}>
          Sair da conta
        </button>

        <button type="button" style={styles.botaoExcluir} onClick={() => setMostrarExcluir(true)}>
          Excluir minha conta
        </button>
      </div>

      {mostrarExcluir && (
        <div style={styles.modalFundo} onClick={() => !excluindo && setMostrarExcluir(false)}>
          <form
            style={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
            onSubmit={aoConfirmarExclusao}
          >
            <h2 style={styles.modalTitulo}>Excluir sua conta</h2>
            <p style={styles.modalTexto}>
              Isso remove seus dados pessoais (nome, e-mail, telefone, CPF, foto) do Konecta Já e
              bloqueia o acesso à conta imediatamente. Pedidos já feitos continuam existindo pra
              outra parte envolvida, mas sem te identificar. Essa ação não pode ser desfeita.
            </p>
            <input
              type="password"
              style={styles.modalInput}
              placeholder="Confirme sua senha"
              value={senhaExcluir}
              onChange={(e) => setSenhaExcluir(e.target.value)}
              autoFocus
            />
            {erroExcluir && <p style={styles.erro}>{erroExcluir}</p>}
            <div style={styles.modalBotoes}>
              <button
                type="button"
                style={styles.botaoSecundario}
                onClick={() => setMostrarExcluir(false)}
                disabled={excluindo}
              >
                Cancelar
              </button>
              <button type="submit" style={styles.botaoExcluirConfirmar} disabled={excluindo}>
                {excluindo ? 'Excluindo...' : 'Excluir conta'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Campo({ label, valor }) {
  return (
    <div style={styles.campo}>
      <span style={styles.campoLabel}>{label}</span>
      <span style={styles.campoValor}>{valor}</span>
    </div>
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
  secao: {
    marginTop: 28,
    background: 'var(--konectaja-bg2)',
    border: '1px solid var(--konectaja-border)',
    borderRadius: 14,
    padding: 16,
  },
  secaoTitulo: {
    color: 'var(--konectaja-text-forte)',
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 12,
    marginTop: 0,
  },
  campo: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid var(--konectaja-border)',
    fontSize: 13,
  },
  campoLabel: { color: 'var(--konectaja-muted)' },
  campoValor: { color: 'var(--konectaja-text-forte)', fontWeight: 600, textAlign: 'right' },
  listaServicos: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 },
  itemServico: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'var(--konectaja-bg3)',
    borderRadius: 10,
    padding: '8px 12px',
  },
  itemServicoCategoria: { color: 'var(--konectaja-text-forte)', fontWeight: 600, fontSize: 13 },
  itemServicoValor: { color: 'var(--konectaja-laranja)', fontWeight: 700, fontSize: 12, marginTop: 2 },
  itemServicoRemover: {
    width: 24,
    height: 24,
    borderRadius: 12,
    border: 'none',
    background: 'transparent',
    color: 'var(--konectaja-muted)',
    fontSize: 13,
  },
  formServico: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  inputServicoCategoria: {
    flex: '1 1 160px',
    height: 44,
    borderRadius: 12,
    border: '1px solid var(--konectaja-border)',
    background: 'var(--konectaja-bg2)',
    color: 'var(--konectaja-text-forte)',
    padding: '0 14px',
    fontSize: 13,
  },
  inputServicoValor: {
    flex: '1 1 100px',
    height: 44,
    borderRadius: 12,
    border: '1px solid var(--konectaja-border)',
    background: 'var(--konectaja-bg2)',
    color: 'var(--konectaja-text-forte)',
    padding: '0 14px',
    fontSize: 13,
  },
  botaoAdicionarServico: {
    flex: '1 1 100%',
    height: 44,
    borderRadius: 12,
    border: 'none',
    background: 'var(--konectaja-laranja)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 13,
  },
  albumHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  seloCompleto: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--konectaja-verde)',
    background: 'rgba(16, 185, 129, 0.12)',
    padding: '4px 8px',
    borderRadius: 999,
  },
  albumAjuda: { color: 'var(--konectaja-muted)', fontSize: 12, marginTop: -4, marginBottom: 12 },
  albumGrade: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 },
  albumItem: { position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden' },
  albumFoto: { width: '100%', height: '100%', objectFit: 'cover' },
  albumRemover: {
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
  albumAdicionar: {
    aspectRatio: '1',
    borderRadius: 10,
    border: '1px dashed var(--konectaja-border)',
    background: 'var(--konectaja-bg3)',
    color: 'var(--konectaja-muted)',
    fontSize: 12,
    fontWeight: 600,
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
  botaoExcluir: {
    width: '100%',
    height: 40,
    borderRadius: 12,
    border: 'none',
    background: 'transparent',
    color: 'var(--konectaja-red)',
    fontWeight: 600,
    fontSize: 13,
    marginTop: 8,
  },
  linkPrivacidade: {
    display: 'block',
    color: 'var(--konectaja-azul)',
    fontSize: 13,
    fontWeight: 600,
    textDecoration: 'none',
    marginBottom: 10,
  },
  botaoSecundario: {
    height: 40,
    borderRadius: 10,
    border: '1px solid var(--konectaja-border)',
    background: 'var(--konectaja-bg3)',
    color: 'var(--konectaja-text-forte)',
    fontWeight: 600,
    fontSize: 13,
    padding: '0 16px',
  },
  modalFundo: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(28, 25, 23, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 1000,
  },
  modalCard: {
    width: 380,
    maxWidth: '100%',
    background: 'var(--konectaja-bg2)',
    borderRadius: 18,
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    boxShadow: 'var(--konectaja-shadow-lg)',
  },
  modalTitulo: { color: 'var(--konectaja-text-forte)', fontSize: 18, margin: 0 },
  modalTexto: { color: 'var(--konectaja-muted)', fontSize: 13, lineHeight: 1.6, margin: 0 },
  modalInput: {
    height: 44,
    borderRadius: 10,
    border: '1px solid var(--konectaja-border)',
    background: 'var(--konectaja-bg3)',
    color: 'var(--konectaja-text-forte)',
    padding: '0 12px',
    fontSize: 14,
  },
  modalBotoes: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 },
  botaoExcluirConfirmar: {
    height: 40,
    borderRadius: 10,
    border: 'none',
    background: 'var(--konectaja-red)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 13,
    padding: '0 16px',
  },
};
