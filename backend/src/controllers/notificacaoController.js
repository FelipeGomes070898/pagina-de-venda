const FcmToken = require('../models/FcmToken');

const PLATAFORMAS_VALIDAS = ['android', 'ios', 'web'];

// App chama isso depois do login/cadastro e sempre que o token do FCM for
// renovado (o Firebase troca o token de tempos em tempos).
async function salvarToken(req, res) {
  const { token, plataforma } = req.body;
  if (!token) return res.status(400).json({ erro: 'token é obrigatório' });
  if (plataforma && !PLATAFORMAS_VALIDAS.includes(plataforma)) {
    return res.status(400).json({ erro: `plataforma deve ser uma de: ${PLATAFORMAS_VALIDAS.join(', ')}` });
  }

  await FcmToken.salvar({
    usuarioId: req.usuarioApp.id,
    usuarioTipo: req.usuarioApp.tipo,
    token,
    plataforma,
  });

  res.status(204).end();
}

// App chama isso ao sair (logout) — pra não mandar notificação pro
// dispositivo depois que ninguém está mais logado nele.
async function removerToken(req, res) {
  const { token } = req.body;
  if (!token) return res.status(400).json({ erro: 'token é obrigatório' });

  await FcmToken.removerToken(token);
  res.status(204).end();
}

module.exports = { salvarToken, removerToken };
