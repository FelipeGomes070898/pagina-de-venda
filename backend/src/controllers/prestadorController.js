const Prestador = require('../models/Prestador');
const FotoTrabalho = require('../models/FotoTrabalho');
const Avaliacao = require('../models/Avaliacao');

// email/cpf/telefone vêm de CAMPOS_PUBLICOS (compartilhado com o retorno do
// próprio cadastro do prestador, que precisa desses campos) mas não podem
// vazar nestes dois endpoints, que são públicos e sem autenticação — quem
// quiser contato usa o chat do app ou o whatsapp que o prestador optou por
// exibir. lat/lng também ficam de fora: a distância já vem calculada em
// distancia_km, então não tem motivo pra expor a coordenada exata de onde
// o prestador mora/trabalha pra qualquer um que bater nesse endpoint.
function ocultarPii(prestador) {
  // eslint-disable-next-line no-unused-vars
  const { email, cpf, telefone, lat, lng, ...publico } = prestador;
  return publico;
}

async function listar(req, res) {
  const { cidade, segmento, busca, lat, lng, page } = req.query;

  const prestadores = await Prestador.listarAtivos({
    cidade,
    segmento,
    busca,
    lat: lat ? Number(lat) : undefined,
    lng: lng ? Number(lng) : undefined,
    pagina: page ? Number(page) : 1,
  });

  res.json(prestadores.map(ocultarPii));
}

async function buscar(req, res) {
  const { lat, lng } = req.query;
  const prestador = await Prestador.buscarPorId(req.params.id, {
    lat: lat ? Number(lat) : undefined,
    lng: lng ? Number(lng) : undefined,
  });
  if (!prestador) return res.status(404).json({ erro: 'Prestador não encontrado' });

  const [fotos, avaliacoes] = await Promise.all([
    FotoTrabalho.listarPorPrestador(prestador.id),
    Avaliacao.listarPorPrestador(prestador.id),
  ]);

  res.json({ ...ocultarPii(prestador), fotos, avaliacoes });
}

module.exports = { listar, buscar };
