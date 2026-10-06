const Cliente = require('../models/Cliente');
const Divisao = require('../models/Divisao');
const { gerarSenhaTemporaria } = require('../utils/senha');

async function listar(req, res) {
  const { busca, page } = req.query;
  const pagina = page ? Number(page) : 1;

  // Gerente só vê clientes da própria divisão — ver prestadorAdminController
  // para a mesma lógica (divisão = filtro por cidade).
  let cidade;
  if (req.escopoDivisaoId) {
    const divisao = await Divisao.buscarPorId(req.escopoDivisaoId);
    cidade = divisao?.nome;
  }

  const [clientes, total] = await Promise.all([
    Cliente.listarTodos({ busca, cidade, pagina }),
    Cliente.contar({ busca, cidade }),
  ]);

  res.json({ clientes, total, pagina });
}

// Suporte/RH/dono redefine a senha sem precisar excluir e recriar a
// conta — a senha nova aparece só uma vez na resposta, pra passar pro
// cliente por telefone/WhatsApp.
async function redefinirSenha(req, res) {
  const cliente = await Cliente.buscarPorId(req.params.id);
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado' });

  const senhaTemporaria = gerarSenhaTemporaria();
  await Cliente.atualizarSenha(cliente.id, senhaTemporaria);
  res.json({ ok: true, senhaTemporaria });
}

module.exports = { listar, redefinirSenha };
