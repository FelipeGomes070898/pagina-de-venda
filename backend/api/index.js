// Ponto de entrada da Vercel: qualquer arquivo dentro de api/ vira uma
// função serverless. O vercel.json na raiz do backend redireciona toda
// requisição pra cá, e o Express (app.js) cuida do roteamento normal
// (/api/..., /health) por dentro, como sempre fez.
module.exports = require('../src/app');
