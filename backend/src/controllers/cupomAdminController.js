const Cupom = require('../models/Cupom');

const TIPOS_VALIDOS = ['percentual', 'fixo'];

async function listar(req, res) {
  const cupons = await Cupom.listarTodos();
  res.json(cupons);
}

async function criar(req, res) {
  const { codigo, tipo, valor, descricao, validadeFim, limiteUso } = req.body;

  if (!codigo || !tipo || valor == null) {
    return res.status(400).json({ erro: 'codigo, tipo e valor são obrigatórios' });
  }
  if (!TIPOS_VALIDOS.includes(tipo)) {
    return res.status(400).json({ erro: `tipo deve ser um de: ${TIPOS_VALIDOS.join(', ')}` });
  }

  const existente = await Cupom.buscarPorCodigo(codigo);
  if (existente) return res.status(409).json({ erro: 'Já existe um cupom com esse código' });

  const cupom = await Cupom.criar({ codigo, tipo, valor, descricao, validadeFim, limiteUso });
  res.status(201).json(cupom);
}

async function atualizarStatus(req, res) {
  const { ativo } = req.body;
  const atualizado = await Cupom.atualizarStatus(req.params.id, Boolean(ativo));
  if (!atualizado) return res.status(404).json({ erro: 'Cupom não encontrado' });
  res.json(atualizado);
}

async function remover(req, res) {
  await Cupom.remover(req.params.id);
  res.json({ ok: true });
}

module.exports = { listar, criar, atualizarStatus, remover };
