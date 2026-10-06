const { Router } = require('express');
const notificacaoController = require('../controllers/notificacaoController');
const { autenticarApp } = require('../middlewares/auth');

const router = Router();

router.use(autenticarApp);

router.post('/token', notificacaoController.salvarToken);
router.delete('/token', notificacaoController.removerToken);

module.exports = router;
