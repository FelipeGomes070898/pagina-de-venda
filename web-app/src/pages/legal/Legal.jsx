import { Link, useParams } from 'react-router-dom';
import { DOCUMENTOS, ATUALIZADO_EM_LABEL } from '../../content/documentosLegais';

const ABAS = [
  { chave: 'termos', rotulo: 'Termos de Uso' },
  { chave: 'privacidade', rotulo: 'Privacidade' },
  { chave: 'cancelamento', rotulo: 'Cancelamento' },
];

// Página pública (sem precisar de login) com os 3 documentos legais do
// Konecta Já. Acessada a partir do cadastro (link no checkbox de
// aceite) e do "Meu perfil" — ver src/content/documentosLegais.js pro
// aviso sobre isso ser um rascunho pendente de revisão jurídica.
export function Legal() {
  const { doc = 'termos' } = useParams();
  const documento = DOCUMENTOS[doc] || DOCUMENTOS.termos;

  return (
    <div style={styles.pagina}>
      <div style={styles.container}>
        <div style={styles.marca}>KONECTA JÁ</div>

        <div style={styles.abas}>
          {ABAS.map((aba) => (
            <Link
              key={aba.chave}
              to={`/legal/${aba.chave}`}
              style={{ ...styles.aba, ...(doc === aba.chave ? styles.abaAtiva : {}) }}
            >
              {aba.rotulo}
            </Link>
          ))}
        </div>

        <div style={styles.card}>
          <h1 style={styles.titulo}>{documento.titulo}</h1>
          <p style={styles.atualizado}>Última atualização: {ATUALIZADO_EM_LABEL}</p>

          <p style={styles.aviso}>
            Este é um rascunho técnico escrito para refletir como o app funciona hoje — ainda em
            revisão jurídica antes do lançamento comercial oficial do Konecta Já.
          </p>

          {documento.secoes.map((secao) => (
            <section key={secao.titulo} style={styles.secao}>
              <h2 style={styles.secaoTitulo}>{secao.titulo}</h2>
              {secao.paragrafos.map((p, i) => (
                <p key={i} style={styles.paragrafo}>
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>

        <p style={styles.rodape}>
          <Link style={styles.link} to="/">
            Voltar ao Konecta Já
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  pagina: { minHeight: '100vh', padding: '32px 16px 64px' },
  container: { maxWidth: 640, margin: '0 auto' },
  marca: {
    fontSize: 20,
    fontWeight: 900,
    color: 'var(--konectaja-laranja-escuro)',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 20,
  },
  abas: {
    display: 'flex',
    gap: 6,
    background: 'var(--konectaja-bg3)',
    borderRadius: 14,
    padding: 5,
    border: '1px solid var(--konectaja-border)',
    marginBottom: 20,
  },
  aba: {
    flex: 1,
    textAlign: 'center',
    padding: '10px 6px',
    borderRadius: 10,
    color: 'var(--konectaja-muted)',
    fontSize: 13,
    fontWeight: 700,
    textDecoration: 'none',
  },
  abaAtiva: {
    background: 'linear-gradient(180deg, var(--konectaja-laranja), var(--konectaja-laranja-escuro))',
    color: '#fff',
    boxShadow: 'var(--konectaja-shadow-sm)',
  },
  card: {
    background: 'var(--konectaja-bg2)',
    border: '1px solid var(--konectaja-border)',
    borderRadius: 22,
    padding: 28,
    boxShadow: 'var(--konectaja-shadow-md)',
  },
  titulo: { color: 'var(--konectaja-text-forte)', fontSize: 24, margin: 0 },
  atualizado: { color: 'var(--konectaja-muted)', fontSize: 12, marginTop: 6, marginBottom: 16 },
  aviso: {
    background: 'var(--konectaja-laranja-soft)',
    color: 'var(--konectaja-laranja-escuro)',
    borderRadius: 10,
    padding: 12,
    fontSize: 12,
    lineHeight: 1.5,
    marginBottom: 20,
  },
  secao: { marginTop: 22 },
  secaoTitulo: { color: 'var(--konectaja-text-forte)', fontSize: 15, marginBottom: 8 },
  paragrafo: { color: 'var(--konectaja-text)', fontSize: 13.5, lineHeight: 1.65, marginTop: 0, marginBottom: 10 },
  rodape: { textAlign: 'center', fontSize: 13, marginTop: 24 },
  link: { color: 'var(--konectaja-azul)', fontWeight: 600, textDecoration: 'none' },
};
