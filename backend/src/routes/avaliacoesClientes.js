const { Router } = require('express');
const avaliacaoClienteController = require('../controllers/avaliacaoClienteController');
const { autenticarApp } = require('../middlewares/auth');

const router = Router();

router.post('/', autenticarApp, avaliacaoClienteController.criar);

module.exports = router;
