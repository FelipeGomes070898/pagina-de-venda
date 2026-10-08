const { Router } = require('express');
const metaController = require('../controllers/metaController');
const { autenticarApp } = require('../middlewares/auth');

const router = Router();

router.use(autenticarApp);

router.get('/', metaController.minhas);
router.post('/', metaController.definir);
router.delete('/:tipo', metaController.remover);

module.exports = router;
