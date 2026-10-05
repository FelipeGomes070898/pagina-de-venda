const Cliente = require('../models/Cliente');
const { gerarSenhaTemporaria } = require('../utils/senha');

async function listar(req, res) {
  const { busca, page } = req.query;
  const pagina = page ? Number(page) : 1;

  const [clientes, total] = await Promise.all([
    Cliente.listarTodos({ busca, pagina }),
    Cliente.contar({ busca }),
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
