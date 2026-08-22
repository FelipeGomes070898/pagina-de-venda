const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

async function loginAdmin(req, res) {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ erro: 'Informe e-mail e senha' });
  }

  const admin = await Admin.buscarPorEmailComSenha(email);
  if (!admin || !admin.ativo) {
    return res.status(401).json({ erro: 'Credenciais inválidas' });
  }

  const senhaValida = await Admin.verificarSenha(senha, admin.senha_hash);
  if (!senhaValida) {
    return res.status(401).json({ erro: 'Credenciais inválidas' });
  }

  const token = jwt.sign(
    { id: admin.id, cargo: admin.cargo, divisaoId: admin.divisao_id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_ADMIN || '8h' },
  );

  await Admin.registrarLogin(admin.id);

  res.json({
    token,
    admin: {
      id: admin.id,
      nome: admin.nome,
      email: admin.email,
      cargo: admin.cargo,
      divisaoId: admin.divisao_id,
    },
  });
}

module.exports = { loginAdmin };
