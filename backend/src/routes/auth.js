const { Router } = require('express');
const authController = require('../controllers/authController');

const router = Router();

// App (cliente/prestador)
router.post('/login', authController.login);
router.post('/cadastro', authController.cadastro);
router.post('/google', authController.loginGoogle);
router.post('/recuperar-senha', authController.recuperarSenha);

// Painel administrativo (equipe interna)
router.post('/admin/login', authController.loginAdmin);

module.exports = router;
