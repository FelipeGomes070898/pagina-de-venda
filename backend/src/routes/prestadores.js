const { Router } = require('express');
const prestadorController = require('../controllers/prestadorController');
const { autenticarAppOpcional } = require('../middlewares/auth');

const router = Router();

router.get('/', autenticarAppOpcional, prestadorController.listar);
router.get('/:id', prestadorController.buscar);

module.exports = router;
