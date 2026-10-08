import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { criarTicket } from '../services/ticketService';
import { mensagemErro } from '../utils/erro';

const ASSUNTOS = [
  'Problema com pagamento',
  'Problema com um pedido',
  'Dúvida sobre como usar o app',
  'Denúncia de prestador ou cliente',
  'Outro',
];

const FAQ = [
  {
    pergunta: 'Como eu troco minha senha?',
    resposta:
      'Na tela de login, toque em "Esqueci minha senha" e confirme seu e-mail, CPF e celular cadastrados. Você escolhe uma senha nova na hora, sem precisar falar com ninguém.',
  },
  {
    pergunta: 'Como funciona o pagamento?',
    resposta:
      'Você combina e paga o prestador diretamente (Pix ou dinheiro) — o app não processa o pagamento do serviço em si, só cobra uma taxa do prestador pelo uso da plataforma.',
  },
  {
    pergunta: 'Posso cancelar um pedido?',
    resposta:
      'Sim, dentro da conversa do pedido (chat) existe o botão "Cancelar pedido", disponível enquanto o serviço ainda não foi concluído.',
  },
  {
    pergunta: 'Como avalio um prestador ou cliente?',
    resposta:
      'Depois que o pedido é marcado como concluído, a tela de avaliação abre automaticamente a partir do chat.',
  },
];

function IconeAjuda() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2-3 4" />
      <path d="M12 17h.01" />
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

// Preferências de acessibilidade ficam no localStorage (só deste
// navegador — é exatamente o tipo de conveniência por visitante que
// não precisa de backend) e são aplicadas como atributos no <html>,
// que o tokens.css usa pra escalar fonte/contraste.
function usarPreferencias() {
  const [tamanhoFonte, setTamanhoFonteState] = useState(() => {
    try {
      return localStorage.getItem('konectaja:tamanhoFonte') || 'normal';
    } catch {
      return 'normal';
    }
  });
  const [altoContraste, setAltoContrasteState] = useState(() => {
    try {
      return localStorage.getItem('konectaja:altoContraste') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-tamanho-fonte', tamanhoFonte);
    try {
      localStorage.setItem('konectaja:tamanhoFonte', tamanhoFonte);
    } catch {
      // localStorage pode estar bloqueado (modo anônimo) — não é crítico
    }
  }, [tamanhoFonte]);

  useEffect(() => {
    document.documentElement.setAttribute('data-alto-contraste', String(altoContraste));
    try {
      localStorage.setItem('konectaja:altoContraste', String(altoContraste));
    } catch {
      // idem
    }
  }, [altoContraste]);

  return { tamanhoFonte, setTamanhoFonteState, altoContraste, setAltoContrasteState };
}

export function AjudaBar() {
  const usuario = useAuthStore((s) => s.usuario);
  const [aberto, setAberto] = useState(false);
  const [abaInterna, setAbaInterna] = useState('ajuda');
  const [perguntaAberta, setPerguntaAberta] = useState(null);

  const [assunto, setAssunto] = useState(ASSUNTOS[0]);
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState(null);

  const { tamanhoFonte, setTamanhoFonteState, altoContraste, setAltoContrasteState } = usarPreferencias();

  async function aoEnviarTicket(e) {
    e.preventDefault();
    if (!mensagem.trim()) return;
    setEnviando(true);
    setErro(null);
    try {
      await criarTicket({ assunto, mensagem: mensagem.trim() });
      setEnviado(true);
      setMensagem('');
    } catch (erro) {
      setErro(mensagemErro(erro, 'Não foi possível enviar sua mensagem agora. Tente novamente.'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <button style={estilos.botaoFlutuante} onClick={() => setAberto(true)} aria-label="Ajuda e acessibilidade">
        <IconeAjuda />
      </button>

      {aberto && (
        <div style={estilos.fundo} onClick={() => setAberto(false)}>
          <div style={estilos.painel} onClick={(e) => e.stopPropagation()}>
            <div style={estilos.cabecalho}>
              <div style={estilos.titulo}>Ajuda e acessibilidade</div>
              <button style={estilos.botaoFechar} onClick={() => setAberto(false)} aria-label="Fechar">
                <IconeFechar />
              </button>
            </div>

            <div style={estilos.abas}>
              <button
                style={{ ...estilos.aba, ...(abaInterna === 'ajuda' ? estilos.abaAtiva : {}) }}
                onClick={() => setAbaInterna('ajuda')}
              >
                Ajuda
              </button>
              <button
                style={{ ...estilos.aba, ...(abaInterna === 'acessibilidade' ? estilos.abaAtiva : {}) }}
                onClick={() => setAbaInterna('acessibilidade')}
              >
                Acessibilidade
              </button>
            </div>

            <div style={estilos.corpo}>
              {abaInterna === 'ajuda' ? (
                <>
                  <div style={estilos.secaoTitulo}>Perguntas frequentes</div>
                  {FAQ.map((item, i) => (
                    <div key={i} style={estilos.faqItem}>
                      <button
                        style={estilos.faqPergunta}
                        onClick={() => setPerguntaAberta(perguntaAberta === i ? null : i)}
                      >
                        {item.pergunta}
                        <span>{perguntaAberta === i ? '−' : '+'}</span>
                      </button>
                      {perguntaAberta === i && <p style={estilos.faqResposta}>{item.resposta}</p>}
                    </div>
                  ))}

                  <div style={{ ...estilos.secaoTitulo, marginTop: 24 }}>Falar com um atendente</div>

                  {!usuario ? (
                    <p style={estilos.texto}>Entre na sua conta pra poder enviar uma mensagem ao suporte.</p>
                  ) : enviado ? (
                    <div style={estilos.confirmacao}>
                      <strong>Mensagem enviada!</strong>
                      <p style={{ margin: '6px 0 0' }}>
                        Nosso tempo médio de resposta é de 10 a 30 minutos. Você também pode acompanhar
                        suas mensagens por aqui.
                      </p>
                      <button style={estilos.linkBotao} onClick={() => setEnviado(false)}>
                        Enviar outra mensagem
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={aoEnviarTicket} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <select style={estilos.input} value={assunto} onChange={(e) => setAssunto(e.target.value)}>
                        {ASSUNTOS.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                      <textarea
                        style={estilos.textarea}
                        placeholder="Descreva o que você precisa..."
                        value={mensagem}
                        onChange={(e) => setMensagem(e.target.value)}
                      />
                      {erro && <p style={estilos.erro}>{erro}</p>}
                      <button style={estilos.botaoPrimario} type="submit" disabled={enviando}>
                        {enviando ? 'Enviando...' : 'Enviar mensagem'}
                      </button>
                    </form>
                  )}
                </>
              ) : (
                <>
                  <div style={estilos.secaoTitulo}>Tamanho da fonte</div>
                  <div style={estilos.opcoesLinha}>
                    {[
                      ['normal', 'Normal'],
                      ['grande', 'Grande'],
                      ['extra-grande', 'Extra grande'],
                    ].map(([valor, rotulo]) => (
                      <button
                        key={valor}
                        style={{ ...estilos.opcaoBotao, ...(tamanhoFonte === valor ? estilos.opcaoBotaoAtiva : {}) }}
                        onClick={() => setTamanhoFonteState(valor)}
                      >
                        {rotulo}
                      </button>
                    ))}
                  </div>

                  <div style={{ ...estilos.secaoTitulo, marginTop: 24 }}>Alto contraste</div>
                  <p style={estilos.texto}>Preto sobre branco, bordas mais fortes — ajuda na leitura em telas de sol ou baixa visão.</p>
                  <button
                    style={{ ...estilos.opcaoBotao, ...(altoContraste ? estilos.opcaoBotaoAtiva : {}) }}
                    onClick={() => setAltoContrasteState((v) => !v)}
                  >
                    {altoContraste ? 'Desativar alto contraste' : 'Ativar alto contraste'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const estilos = {
  botaoFlutuante: {
    position: 'fixed',
    top: 16,
    right: 16,
    zIndex: 60,
    width: 44,
    height: 44,
    borderRadius: 999,
    border: '1px solid var(--konectaja-border)',
    background: 'var(--konectaja-bg2)',
    color: 'var(--konectaja-laranja-escuro)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--konectaja-shadow-md)',
  },
  fundo: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(28,25,23,.35)',
    zIndex: 70,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  painel: {
    width: 380,
    maxWidth: '100vw',
    height: '100%',
    background: 'var(--konectaja-bg)',
    borderLeft: '1px solid var(--konectaja-border)',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'var(--konectaja-shadow-lg)',
  },
  cabecalho: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottom: '1px solid var(--konectaja-border)',
  },
  titulo: { fontWeight: 800, fontSize: 16, color: 'var(--konectaja-text-forte)' },
  botaoFechar: {
    background: 'transparent',
    border: 'none',
    color: 'var(--konectaja-muted)',
    display: 'flex',
    padding: 4,
  },
  abas: {
    display: 'flex',
    gap: 4,
    padding: '10px 18px',
    borderBottom: '1px solid var(--konectaja-border)',
  },
  aba: {
    flex: 1,
    padding: '9px 0',
    borderRadius: 10,
    border: 'none',
    background: 'var(--konectaja-bg3)',
    color: 'var(--konectaja-muted)',
    fontSize: 12.5,
    fontWeight: 700,
  },
  abaAtiva: {
    background: 'linear-gradient(180deg, var(--konectaja-laranja), var(--konectaja-laranja-escuro))',
    color: '#fff',
  },
  corpo: { padding: 18, overflowY: 'auto', flex: 1 },
  secaoTitulo: { fontWeight: 700, fontSize: 13, color: 'var(--konectaja-text-forte)', marginBottom: 8 },
  texto: { color: 'var(--konectaja-muted)', fontSize: 12.5, lineHeight: 1.5, marginBottom: 10 },
  faqItem: { borderBottom: '1px solid var(--konectaja-border)' },
  faqPergunta: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'transparent',
    border: 'none',
    padding: '10px 0',
    color: 'var(--konectaja-text-forte)',
    fontSize: 13,
    fontWeight: 600,
    textAlign: 'left',
  },
  faqResposta: { color: 'var(--konectaja-text)', fontSize: 12.5, lineHeight: 1.5, paddingBottom: 12, margin: 0 },
  input: {
    height: 42,
    borderRadius: 10,
    border: '1px solid var(--konectaja-border)',
    background: 'var(--konectaja-bg2)',
    color: 'var(--konectaja-text-forte)',
    padding: '0 10px',
    fontSize: 13,
  },
  textarea: {
    minHeight: 80,
    borderRadius: 10,
    border: '1px solid var(--konectaja-border)',
    background: 'var(--konectaja-bg2)',
    color: 'var(--konectaja-text-forte)',
    padding: 10,
    fontSize: 13,
    resize: 'vertical',
  },
  botaoPrimario: {
    height: 42,
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(180deg, var(--konectaja-laranja), var(--konectaja-laranja-escuro))',
    color: '#fff',
    fontWeight: 700,
    fontSize: 13,
  },
  erro: { color: 'var(--konectaja-red)', fontSize: 12, margin: 0 },
  confirmacao: {
    background: 'var(--konectaja-verde-soft)',
    color: 'var(--konectaja-verde)',
    borderRadius: 10,
    padding: 12,
    fontSize: 12.5,
  },
  linkBotao: {
    background: 'transparent',
    border: 'none',
    color: 'var(--konectaja-verde)',
    fontWeight: 700,
    fontSize: 12,
    padding: 0,
    marginTop: 8,
    textDecoration: 'underline',
  },
  opcoesLinha: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  opcaoBotao: {
    padding: '9px 14px',
    borderRadius: 10,
    border: '1px solid var(--konectaja-border)',
    background: 'var(--konectaja-bg2)',
    color: 'var(--konectaja-text)',
    fontSize: 12.5,
    fontWeight: 700,
  },
  opcaoBotaoAtiva: {
    background: 'linear-gradient(180deg, var(--konectaja-laranja), var(--konectaja-laranja-escuro))',
    borderColor: 'var(--konectaja-laranja)',
    color: '#fff',
  },
};
