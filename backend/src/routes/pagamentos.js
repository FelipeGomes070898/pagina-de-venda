const { Router } = require('express');
const pagamentoController = require('../controllers/pagamentoController');
const { autenticarApp } = require('../middlewares/auth');

const router = Router();

router.post('/webhook', pagamentoController.webhook);
router.get('/meus', autenticarApp, pagamentoController.meus);

module.exports = router;
