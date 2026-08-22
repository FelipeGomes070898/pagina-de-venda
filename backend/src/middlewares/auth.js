const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

function autenticarAdmin(req, res, next) {
  const cabecalho = req.headers.authorization;
  if (!cabecalho) return res.status(401).json({ erro: 'Token não informado' });

  const [, token] = cabecalho.split(' ');
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = payload; // { id, cargo, divisaoId }
    next();
  } catch {
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}

// Uso: permitir('dono', 'rh')
function permitir(...cargosPermitidos) {
  return (req, res, next) => {
    if (!req.admin || !cargosPermitidos.includes(req.admin.cargo)) {
      return res.status(403).json({ erro: 'Sem permissão para este recurso' });
    }
    next();
  };
}

// Gerente só acessa dados da própria divisão; dono e rh acessam tudo.
// admins/atendimento sem divisão vinculada também passam livre (escopo global).
function restringirPorDivisao(req, res, next) {
  const { cargo, divisaoId } = req.admin;
  if (cargo === 'dono' || cargo === 'rh') return next();

  if (cargo === 'gerente') {
    const divisaoAlvo = req.params.divisaoId || req.query.divisaoId || req.body.divisaoId;
    if (divisaoAlvo && divisaoAlvo !== divisaoId) {
      return res.status(403).json({ erro: 'Fora da sua divisão' });
    }
    req.escopoDivisaoId = divisaoId;
  }

  next();
}

async function carregarAdminAtivo(req, res, next) {
  const admin = await Admin.buscarPorId(req.admin.id);
  if (!admin || !admin.ativo) {
    return res.status(403).json({ erro: 'Conta desativada' });
  }
  next();
}

module.exports = { autenticarAdmin, permitir, restringirPorDivisao, carregarAdminAtivo };
