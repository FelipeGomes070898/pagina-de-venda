const Divisao = require('../models/Divisao');

async function criar(req, res) {
  const { nome, descricao } = req.body;
  if (!nome) return res.status(400).json({ erro: 'Nome da divisão é obrigatório' });
  const divisao = await Divisao.criar({ nome, descricao });
  res.status(201).json(divisao);
}

async function listar(req, res) {
  const divisoes = await Divisao.listarAtivas();
  res.json(divisoes);
}

module.exports = { criar, listar };
