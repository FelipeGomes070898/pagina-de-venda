const Banner = require('../models/Banner');

async function listar(req, res) {
  const banners = await Banner.listarTodos();
  res.json(banners);
}

async function criar(req, res) {
  const { titulo, imagemUrl, linkUrl, ordem } = req.body;
  if (!imagemUrl) return res.status(400).json({ erro: 'imagemUrl é obrigatório' });

  const banner = await Banner.criar({ titulo, imagemUrl, linkUrl, ordem });
  res.status(201).json(banner);
}

async function atualizar(req, res) {
  const { titulo, imagemUrl, linkUrl, ordem } = req.body;
  if (!imagemUrl) return res.status(400).json({ erro: 'imagemUrl é obrigatório' });

  const atualizado = await Banner.atualizar(req.params.id, { titulo, imagemUrl, linkUrl, ordem });
  if (!atualizado) return res.status(404).json({ erro: 'Banner não encontrado' });
  res.json(atualizado);
}

async function atualizarStatus(req, res) {
  const { ativo } = req.body;
  const atualizado = await Banner.atualizarStatus(req.params.id, Boolean(ativo));
  if (!atualizado) return res.status(404).json({ erro: 'Banner não encontrado' });
  res.json(atualizado);
}

async function remover(req, res) {
  await Banner.remover(req.params.id);
  res.json({ ok: true });
}

module.exports = { listar, criar, atualizar, atualizarStatus, remover };
