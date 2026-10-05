const Prestador = require('../models/Prestador');
const { gerarSenhaTemporaria } = require('../utils/senha');

const STATUS_VALIDOS = ['ativo', 'inadimplente', 'bloqueado'];

// Diferente de prestadorController (público): este endpoint é só pra
// painel admin, então mostra PII (email, cpf, telefone) e qualquer status.
async function listar(req, res) {
  const { busca, status, page } = req.query;
  const pagina = page ? Number(page) : 1;

  const [prestadores, total] = await Promise.all([
    Prestador.listarTodos({ busca, status, pagina }),
    Prestador.contar({ busca, status }),
  ]);

  res.json({ prestadores, total, pagina });
}

async function atualizarStatus(req, res) {
  const { status } = req.body;
  if (!STATUS_VALIDOS.includes(status)) {
    return res.status(400).json({ erro: `Status inválido. Use: ${STATUS_VALIDOS.join(', ')}` });
  }

  const atualizado = await Prestador.atualizarStatus(req.params.id, status);
  if (!atualizado) return res.status(404).json({ erro: 'Prestador não encontrado' });
  res.json(atualizado);
}

// Suporte/RH/dono redefine a senha sem precisar excluir e recriar a
// conta — a senha nova aparece só uma vez na resposta, pra passar pro
// prestador por telefone/WhatsApp.
async function redefinirSenha(req, res) {
  const prestador = await Prestador.buscarPorId(req.params.id);
  if (!prestador) return res.status(404).json({ erro: 'Prestador não encontrado' });

  const senhaTemporaria = gerarSenhaTemporaria();
  await Prestador.atualizarSenha(prestador.id, senhaTemporaria);
  res.json({ ok: true, senhaTemporaria });
}

module.exports = { listar, atualizarStatus, redefinirSenha };
