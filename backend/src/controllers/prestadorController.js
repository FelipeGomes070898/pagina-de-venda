const Prestador = require('../models/Prestador');
const FotoTrabalho = require('../models/FotoTrabalho');
const Avaliacao = require('../models/Avaliacao');
const ServicoPrestador = require('../models/ServicoPrestador');
const { removerImagem } = require('../config/blob');
const { colunaExiste } = require('../utils/schema');

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

  // Endpoint público (sem exigir login). Um prestador aparece na própria
  // listagem também — ele quer ver como a publicação dele fica ao lado
  // das outras, e conferir o que a concorrência está oferecendo.
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

  const [fotos, avaliacoes, servicos] = await Promise.all([
    FotoTrabalho.listarPorPrestador(prestador.id),
    Avaliacao.listarPorPrestador(prestador.id),
    ServicoPrestador.listarPorPrestador(prestador.id),
  ]);

  res.json({ ...ocultarPii(prestador), fotos, avaliacoes, servicos });
}

// Álbum de trabalhos realizados — chamado depois que a imagem já subiu
// direto pro Vercel Blob (ver uploadController.js), igual
// atualizarFotoPerfil em authController.js.
async function adicionarFotoTrabalho(req, res) {
  if (req.usuarioApp.tipo !== 'prestador') {
    return res.status(403).json({ erro: 'Somente prestadores têm álbum de trabalhos' });
  }
  const { url, legenda } = req.body;
  if (!url) return res.status(400).json({ erro: 'url é obrigatória' });

  const foto = await FotoTrabalho.adicionar(req.usuarioApp.id, { url, legenda });
  res.status(201).json(foto);
}

async function removerFotoTrabalho(req, res) {
  if (req.usuarioApp.tipo !== 'prestador') {
    return res.status(403).json({ erro: 'Somente prestadores têm álbum de trabalhos' });
  }
  const urlRemovida = await FotoTrabalho.remover(req.usuarioApp.id, req.params.fotoId);
  if (!urlRemovida) return res.status(404).json({ erro: 'Foto não encontrada' });

  removerImagem(urlRemovida).catch(() => {});
  res.status(204).end();
}

// "Área de serviço": outros trabalhos que o prestador também faz, além
// do segmento principal do cadastro — cada um com a própria diária.
// Aparecem no marketplace (Prestador.listarAtivos casa busca/segmento
// contra isso também) e no perfil público dele.
async function adicionarServico(req, res) {
  if (req.usuarioApp.tipo !== 'prestador') {
    return res.status(403).json({ erro: 'Somente prestadores têm área de serviço' });
  }
  const { categoria, valor, descricao } = req.body;
  if (!categoria || !categoria.trim()) {
    return res.status(400).json({ erro: 'categoria é obrigatória' });
  }

  const servico = await ServicoPrestador.adicionar(req.usuarioApp.id, {
    categoria: categoria.trim(),
    valor: valor || null,
    descricao,
  });
  res.status(201).json(servico);
}

async function removerServico(req, res) {
  if (req.usuarioApp.tipo !== 'prestador') {
    return res.status(403).json({ erro: 'Somente prestadores têm área de serviço' });
  }
  const removido = await ServicoPrestador.remover(req.usuarioApp.id, req.params.servicoId);
  if (!removido) return res.status(404).json({ erro: 'Serviço não encontrado' });

  res.status(204).end();
}

// Mapa dos trabalhadores disponíveis, mostrado na tela inicial pra
// cliente e prestador (ver Prestador.listarParaMapa — nunca devolve
// coordenada exata).
async function mapaPrestadores(req, res) {
  const prestadores = await Prestador.listarParaMapa({ cidade: req.query.cidade });
  res.json(prestadores);
}

const AVATARES_VALIDOS = ['masculino', 'feminino'];

async function definirAvatar(req, res) {
  if (req.usuarioApp.tipo !== 'prestador') {
    return res.status(403).json({ erro: 'Somente prestadores têm avatar de trabalhador' });
  }
  const { avatarGenero } = req.body;
  if (!AVATARES_VALIDOS.includes(avatarGenero)) {
    return res.status(400).json({ erro: `avatarGenero deve ser um de: ${AVATARES_VALIDOS.join(', ')}` });
  }
  if (!(await colunaExiste('prestadores', 'avatar_genero'))) {
    return res.status(503).json({ erro: 'Recurso ainda não disponível neste servidor.' });
  }

  const prestador = await Prestador.definirAvatarGenero(req.usuarioApp.id, avatarGenero);
  res.json(prestador);
}

module.exports = {
  listar,
  buscar,
  adicionarFotoTrabalho,
  removerFotoTrabalho,
  adicionarServico,
  removerServico,
  mapaPrestadores,
  definirAvatar,
};
