const { Router } = require('express');
const authController = require('../controllers/authController');

const router = Router();

// App (cliente/prestador)
router.post('/login', authController.login);
router.post('/cadastro', authController.cadastro);

// Painel administrativo (equipe interna)
router.post('/admin/login', authController.loginAdmin);

module.exports = router;
