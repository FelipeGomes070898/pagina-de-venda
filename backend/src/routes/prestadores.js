const { Router } = require('express');
const prestadorController = require('../controllers/prestadorController');
const { autenticarApp, autenticarAppOpcional } = require('../middlewares/auth');

const router = Router();

router.get('/', autenticarAppOpcional, prestadorController.listar);

router.post('/me/fotos-trabalho', autenticarApp, prestadorController.adicionarFotoTrabalho);
router.delete('/me/fotos-trabalho/:fotoId', autenticarApp, prestadorController.removerFotoTrabalho);

router.get('/:id', prestadorController.buscar);

module.exports = router;
