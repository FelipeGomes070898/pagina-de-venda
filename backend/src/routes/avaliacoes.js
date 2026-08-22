const { Router } = require('express');
const avaliacaoController = require('../controllers/avaliacaoController');
const { autenticarApp } = require('../middlewares/auth');

const router = Router();

router.get('/:prestadorId', avaliacaoController.listarPorPrestador);
router.post('/', autenticarApp, avaliacaoController.criar);

module.exports = router;
