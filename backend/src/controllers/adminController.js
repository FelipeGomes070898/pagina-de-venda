const Admin = require('../models/Admin');
const Divisao = require('../models/Divisao');

// Cria um membro da equipe respeitando a hierarquia:
// dono cria rh/gerente/atendimento; rh cria gerente/atendimento;
// gerente e atendimento não criam ninguém.
async function criar(req, res) {
  const { cargo: cargoDeQuemCria } = req.admin;
  const { nome, email, senha, cargo, divisaoId } = req.body;

  if (!nome || !email || !senha || !cargo) {
    return res.status(400).json({ erro: 'Nome, e-mail, senha e cargo são obrigatórios' });
  }

  const cargosPermitidos = Admin.CARGOS_QUE_PODEM_CRIAR[cargoDeQuemCria] || [];
  if (!cargosPermitidos.includes(cargo)) {
    return res.status(403).json({ erro: `Seu cargo não pode criar um admin do tipo "${cargo}"` });
  }

  if (cargo === 'gerente') {
    if (!divisaoId) {
      return res.status(400).json({ erro: 'Gerente precisa estar vinculado a uma divisão' });
    }
    const divisao = await Divisao.buscarPorId(divisaoId);
    if (!divisao) {
      return res.status(400).json({ erro: 'Divisão informada não existe' });
    }
  }

  const novoAdmin = await Admin.criar({
    nome,
    email,
    senha,
    cargo,
    divisaoId: cargo === 'gerente' ? divisaoId : divisaoId || null,
    criadoPor: req.admin.id,
  });

  res.status(201).json(novoAdmin);
}

async function listar(req, res) {
  const { cargo, divisaoId } = req.admin;
  const filtroDivisao = cargo === 'gerente' ? divisaoId : req.query.divisaoId;
  const admins = await Admin.listar({ divisaoId: filtroDivisao });
  res.json(admins);
}

async function buscar(req, res) {
  const admin = await Admin.buscarPorId(req.params.id);
  if (!admin) return res.status(404).json({ erro: 'Admin não encontrado' });
  res.json(admin);
}

// Ativa/desativa um membro da equipe. Só dono e rh podem, e ninguém
// desativa a si mesmo nem desativa um dono.
async function atualizarStatus(req, res) {
  const { id } = req.params;
  const { ativo } = req.body;

  if (id === req.admin.id) {
    return res.status(400).json({ erro: 'Você não pode alterar seu próprio status' });
  }

  const alvo = await Admin.buscarPorId(id);
  if (!alvo) return res.status(404).json({ erro: 'Admin não encontrado' });
  if (alvo.cargo === 'dono') {
    return res.status(403).json({ erro: 'Não é possível alterar o status do dono' });
  }
  if (req.admin.cargo === 'rh' && alvo.cargo === 'rh') {
    return res.status(403).json({ erro: 'RH não pode alterar outro RH' });
  }

  const atualizado = await Admin.atualizarStatus(id, ativo);
  res.json(atualizado);
}

module.exports = { criar, listar, buscar, atualizarStatus };
