const Banner = require('../models/Banner');

// Público — exibido no topo do marketplace (web + mobile), sem exigir
// login, pra aparecer já na primeira tela.
async function listarAtivos(req, res) {
  const banners = await Banner.listarAtivos();
  res.json(banners);
}

module.exports = { listarAtivos };
