const { Router } = require('express');
const authController = require('../controllers/authController');
const { autenticarApp } = require('../middlewares/auth');

const router = Router();

// App (cliente/prestador)
router.post('/login', authController.login);
router.post('/cadastro', authController.cadastro);
router.post('/google', authController.loginGoogle);
router.post('/recuperar-senha', authController.recuperarSenha);
router.get('/me', autenticarApp, authController.meuPerfil);
router.patch('/me/foto', autenticarApp, authController.atualizarFotoPerfil);
router.get('/me/exportar', autenticarApp, authController.exportarDados);
router.delete('/me', autenticarApp, authController.excluirConta);

// Painel administrativo (equipe interna)
router.post('/admin/login', authController.loginAdmin);

module.exports = router;
