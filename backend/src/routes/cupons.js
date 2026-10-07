const { Router } = require('express');
const cupomController = require('../controllers/cupomController');
const { autenticarApp } = require('../middlewares/auth');

const router = Router();

router.use(autenticarApp);
router.post('/validar', cupomController.validar);

module.exports = router;
