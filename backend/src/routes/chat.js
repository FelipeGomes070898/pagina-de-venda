const { Router } = require('express');
const chatController = require('../controllers/chatController');
const { autenticarApp } = require('../middlewares/auth');

const router = Router();

router.use(autenticarApp);

router.get('/:pedidoId', chatController.listar);
router.post('/:pedidoId', chatController.enviarMensagem);
router.post('/:pedidoId/proposta', chatController.enviarProposta);
router.patch('/:pedidoId/proposta/:propostaId', chatController.responderProposta);

module.exports = router;
