const { Router } = require('express');
const adminController = require('../controllers/adminController');
const divisaoController = require('../controllers/divisaoController');
const { autenticarAdmin, permitir, carregarAdminAtivo } = require('../middlewares/auth');

const router = Router();

router.use(autenticarAdmin, carregarAdminAtivo);

// Equipe (hierarquia dono/rh/gerente/atendimento)
router.get('/equipe', permitir('dono', 'rh', 'gerente'), adminController.listar);
router.get('/equipe/:id', permitir('dono', 'rh'), adminController.buscar);
router.post('/equipe', permitir('dono', 'rh'), adminController.criar);
router.patch('/equipe/:id/status', permitir('dono', 'rh'), adminController.atualizarStatus);

// Divisões (usadas para vincular gerentes)
router.get('/divisoes', permitir('dono', 'rh'), divisaoController.listar);
router.post('/divisoes', permitir('dono', 'rh'), divisaoController.criar);

module.exports = router;
