const Prestador = require('../models/Prestador');
const FotoTrabalho = require('../models/FotoTrabalho');
const Avaliacao = require('../models/Avaliacao');

async function listar(req, res) {
  const { cidade, segmento, lat, lng, page } = req.query;

  const prestadores = await Prestador.listarAtivos({
    cidade,
    segmento,
    lat: lat ? Number(lat) : undefined,
    lng: lng ? Number(lng) : undefined,
    pagina: page ? Number(page) : 1,
  });

  res.json(prestadores);
}

async function buscar(req, res) {
  const prestador = await Prestador.buscarPorId(req.params.id);
  if (!prestador) return res.status(404).json({ erro: 'Prestador não encontrado' });

  const [fotos, avaliacoes] = await Promise.all([
    FotoTrabalho.listarPorPrestador(prestador.id),
    Avaliacao.listarPorPrestador(prestador.id),
  ]);

  res.json({ ...prestador, fotos, avaliacoes });
}

module.exports = { listar, buscar };
