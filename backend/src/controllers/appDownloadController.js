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

    const resposta = await axios.get(asset.url, {
      headers: { ...cabecalhos, Accept: 'application/octet-stream' },
      responseType: 'stream',
    });

    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="konectaja.apk"');
    if (resposta.headers['content-length']) {
      res.setHeader('Content-Length', resposta.headers['content-length']);
    }
    resposta.data.pipe(res);
  } catch {
    res.status(502).json({ erro: 'Não foi possível baixar o instalador agora. Tente novamente.' });
  }
}

module.exports = { baixarAndroid };
