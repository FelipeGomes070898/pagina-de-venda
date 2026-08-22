const { Router } = require('express');
const prestadorController = require('../controllers/prestadorController');

const router = Router();

router.get('/', prestadorController.listar);
router.get('/:id', prestadorController.buscar);

module.exports = router;
