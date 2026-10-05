// Entrada usada em desenvolvimento local e em hosts que rodam um servidor
// Node "sempre ligado" (Render, Railway, Docker). Na Vercel, quem responde
// as requisições é api/index.js — que importa o mesmo app.js, mas sem dar
// listen() (a Vercel cuida disso do jeito dela, no modelo serverless).
const app = require('./src/app');

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => console.log(`Konecta Já API rodando na porta ${PORT}`));
