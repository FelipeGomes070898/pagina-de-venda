const { Router } = require('express');
const adminController = require('../controllers/adminController');
const divisaoController = require('../controllers/divisaoController');
const prestadorAdminController = require('../controllers/prestadorAdminController');
const clienteAdminController = require('../controllers/clienteAdminController');
const financeiroController = require('../controllers/financeiroController');
const dashboardController = require('../controllers/dashboardController');
const { autenticarAdmin, permitir, carregarAdminAtivo } = require('../middlewares/auth');

const router = Router();

router.use(autenticarAdmin, carregarAdminAtivo);

const TODOS_OS_CARGOS = ['dono', 'rh', 'gerente', 'atendimento'];

// Dashboard (resumo leve, sem valores financeiros — qualquer cargo)
router.get('/dashboard/resumo', permitir(...TODOS_OS_CARGOS), dashboardController.resumo);

// Equipe (hierarquia dono/rh/gerente/atendimento)
router.get('/equipe', permitir('dono', 'rh', 'gerente'), adminController.listar);
router.get('/equipe/:id', permitir('dono', 'rh'), adminController.buscar);
router.post('/equipe', permitir('dono', 'rh'), adminController.criar);
router.patch('/equipe/:id/status', permitir('dono', 'rh'), adminController.atualizarStatus);

// Divisões (usadas para vincular gerentes)
router.get('/divisoes', permitir('dono', 'rh'), divisaoController.listar);
router.post('/divisoes', permitir('dono', 'rh'), divisaoController.criar);

// Prestadores (listagem com PII + alteração de status, visível à equipe toda)
router.get('/prestadores', permitir(...TODOS_OS_CARGOS), prestadorAdminController.listar);
router.patch(
  '/prestadores/:id/status',
  permitir('dono', 'rh', 'gerente'),
  prestadorAdminController.atualizarStatus,
);
router.post(
  '/prestadores/:id/redefinir-senha',
  permitir(...TODOS_OS_CARGOS),
  prestadorAdminController.redefinirSenha,
);

// Clientes (listagem, visível à equipe toda)
router.get('/clientes', permitir(...TODOS_OS_CARGOS), clienteAdminController.listar);
router.post(
  '/clientes/:id/redefinir-senha',
  permitir(...TODOS_OS_CARGOS),
  clienteAdminController.redefinirSenha,
);

// Pagamentos e Financeiro (valores reais — só dono)
router.get('/pagamentos', permitir('dono'), financeiroController.listarPagamentos);
router.get('/financeiro/resumo', permitir('dono'), financeiroController.resumo);

// Configurações: qualquer admin troca a própria senha
router.patch('/me/senha', permitir(...TODOS_OS_CARGOS), adminController.alterarSenha);

module.exports = router;
