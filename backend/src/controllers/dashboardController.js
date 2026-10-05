const Prestador = require('../models/Prestador');
const Cliente = require('../models/Cliente');

// Resumo leve (sem valores financeiros) pro Dashboard, visível a
// qualquer cargo — números de receita ficam reservados à tela
// Financeiro (só dono).
async function resumo(req, res) {
  const [prestadoresPorStatus, totalClientes] = await Promise.all([
    Prestador.contarPorStatus(),
    Cliente.contar(),
  ]);

  res.json({ prestadoresPorStatus, totalClientes });
}

module.exports = { resumo };
