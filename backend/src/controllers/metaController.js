const MetaPrestador = require('../models/MetaPrestador');

const TIPOS_VALIDOS = ['semana', 'mes'];

function exigirPrestador(req, res) {
  if (req.usuarioApp.tipo !== 'prestador') {
    res.status(403).json({ erro: 'Somente prestadores têm metas de serviço' });
    return false;
  }
  return true;
}

async function minhas(req, res) {
  if (!exigirPrestador(req, res)) return;
  const metas = await MetaPrestador.listarComProgresso(req.usuarioApp.id);
  res.json(metas);
}

async function definir(req, res) {
  if (!exigirPrestador(req, res)) return;

  const { tipo } = req.body;
  const quantidade = Number(req.body.quantidade);
  if (!TIPOS_VALIDOS.includes(tipo)) {
    return res.status(400).json({ erro: `tipo deve ser um de: ${TIPOS_VALIDOS.join(', ')}` });
  }
  if (!quantidade || quantidade <= 0) {
    return res.status(400).json({ erro: 'Informe uma quantidade válida' });
  }

  const meta = await MetaPrestador.definir(req.usuarioApp.id, tipo, Math.round(quantidade));
  res.status(201).json(meta);
}

async function remover(req, res) {
  if (!exigirPrestador(req, res)) return;
  if (!TIPOS_VALIDOS.includes(req.params.tipo)) {
    return res.status(400).json({ erro: `tipo deve ser um de: ${TIPOS_VALIDOS.join(', ')}` });
  }
  await MetaPrestador.remover(req.usuarioApp.id, req.params.tipo);
  res.status(204).end();
}

module.exports = { minhas, definir, remover };
