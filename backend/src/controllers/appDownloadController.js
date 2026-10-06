const axios = require('axios');

// O repositório do app é privado (código-fonte protegido), mas o APK
// compilado precisa ser baixável por qualquer cliente, sem conta no
// GitHub. Esse endpoint busca o instalador mais recente usando um
// token só do servidor (GITHUB_RELEASE_TOKEN, com permissão de leitura
// nesse repositório) e repassa os bytes pro navegador — pro cliente
// final, é só um link de download normal.
const REPO = 'FelipeGomes070898/KONECTAJA';
const RELEASE_TAG = 'app-mobile';
const NOME_ARQUIVO = 'app-release.apk';

async function baixarAndroid(req, res) {
  const token = process.env.GITHUB_RELEASE_TOKEN;
  if (!token) {
    return res.status(503).json({ erro: 'Download do app ainda não configurado no servidor' });
  }

  const cabecalhos = {
    Authorization: `Bearer ${token}`,
    'User-Agent': 'konectaja-backend',
  };

  try {
    const { data: release } = await axios.get(
      `https://api.github.com/repos/${REPO}/releases/tags/${RELEASE_TAG}`,
      { headers: { ...cabecalhos, Accept: 'application/vnd.github+json' } },
    );

    const asset = release.assets?.find((a) => a.name === NOME_ARQUIVO);
    if (!asset) {
      return res.status(404).json({ erro: 'Instalador ainda não disponível' });
    }

    // O endpoint de asset do GitHub não devolve o arquivo em si — devolve
    // um 302 pra uma URL assinada e temporária (sem precisar de token)
    // no storage deles. Repassamos esse redirect pro navegador em vez de
    // baixar os ~23 MB aqui e reenviar: funções serverless da Vercel têm
    // limite de tamanho de resposta bem menor que isso, então "baixar e
    // reenviar" sempre dava 502.
    const resposta = await axios.get(asset.url, {
      headers: { ...cabecalhos, Accept: 'application/octet-stream' },
      maxRedirects: 0,
      validateStatus: (status) => status === 302,
    });

    const urlAssinada = resposta.headers.location;
    if (!urlAssinada) {
      return res.status(502).json({ erro: 'Não foi possível localizar o instalador agora.' });
    }

    res.redirect(302, urlAssinada);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('baixarAndroid falhou:', e.message, e.response?.status, e.response?.data);
    res.status(502).json({
      erro: 'Não foi possível baixar o instalador agora. Tente novamente.',
      debug: e.message,
    });
  }
}

module.exports = { baixarAndroid };
