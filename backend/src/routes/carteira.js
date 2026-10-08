const { Router } = require('express');
const carteiraController = require('../controllers/carteiraController');
const { autenticarApp } = require('../middlewares/auth');

const router = Router();

router.use(autenticarApp);

router.get('/saldo', carteiraController.meuSaldo);
router.get('/extrato', carteiraController.meuExtrato);
router.get('/dashboard', carteiraController.meuDashboard);
router.post('/depositar', carteiraController.criarDeposito);
router.post('/sacar', carteiraController.solicitarSaque);

module.exports = router;
