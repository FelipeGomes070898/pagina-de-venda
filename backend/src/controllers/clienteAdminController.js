const Cliente = require('../models/Cliente');

async function listar(req, res) {
  const { busca, page } = req.query;
  const pagina = page ? Number(page) : 1;

  const [clientes, total] = await Promise.all([
    Cliente.listarTodos({ busca, pagina }),
    Cliente.contar({ busca }),
  ]);

  res.json({ clientes, total, pagina });
}

module.exports = { listar };
