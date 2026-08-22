const { Router } = require('express');
const pedidoController = require('../controllers/pedidoController');
const { autenticarApp } = require('../middlewares/auth');

const router = Router();

router.get('/abertos', pedidoController.listarAbertos);

router.use(autenticarApp);

router.post('/', pedidoController.criarComPrestador);
router.post('/abertos', pedidoController.criarAberto);
router.get('/meus', pedidoController.meus);
router.put('/:id/status', pedidoController.atualizarStatus);
router.put('/:id/endereco', pedidoController.definirEndereco);

module.exports = router;
