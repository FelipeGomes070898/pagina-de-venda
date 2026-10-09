const { Router } = require('express');
const prestadorController = require('../controllers/prestadorController');
const { autenticarApp, autenticarAppOpcional } = require('../middlewares/auth');

const router = Router();

router.get('/', autenticarAppOpcional, prestadorController.listar);
router.get('/mapa', autenticarApp, prestadorController.mapaPrestadores);

router.put('/me/avatar', autenticarApp, prestadorController.definirAvatar);
router.post('/me/fotos-trabalho', autenticarApp, prestadorController.adicionarFotoTrabalho);
router.delete('/me/fotos-trabalho/:fotoId', autenticarApp, prestadorController.removerFotoTrabalho);

router.post('/me/servicos', autenticarApp, prestadorController.adicionarServico);
router.delete('/me/servicos/:servicoId', autenticarApp, prestadorController.removerServico);

router.get('/:id', prestadorController.buscar);

module.exports = router;
