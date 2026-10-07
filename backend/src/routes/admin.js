const { Router } = require('express');
const adminController = require('../controllers/adminController');
const divisaoController = require('../controllers/divisaoController');
const prestadorAdminController = require('../controllers/prestadorAdminController');
const clienteAdminController = require('../controllers/clienteAdminController');
const financeiroController = require('../controllers/financeiroController');
const dashboardController = require('../controllers/dashboardController');
const cupomAdminController = require('../controllers/cupomAdminController');
const bannerAdminController = require('../controllers/bannerAdminController');
const {
  autenticarAdmin,
  permitir,
  carregarAdminAtivo,
  restringirPorDivisao,
} = require('../middlewares/auth');

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
router.delete('/equipe/:id', permitir('dono', 'rh'), adminController.remover);

// Divisões (usadas para vincular gerentes)
router.get('/divisoes', permitir('dono', 'rh'), divisaoController.listar);
router.post('/divisoes', permitir('dono', 'rh'), divisaoController.criar);

// Prestadores (listagem com PII + alteração de status, visível à equipe
// toda — restringirPorDivisao restringe gerente à própria divisão, sem
// efeito para os outros cargos).
router.get(
  '/prestadores',
  permitir(...TODOS_OS_CARGOS),
  restringirPorDivisao,
  prestadorAdminController.listar,
);
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

// Clientes (listagem, visível à equipe toda — mesma restrição por
// divisão do gerente que em /prestadores)
router.get(
  '/clientes',
  permitir(...TODOS_OS_CARGOS),
  restringirPorDivisao,
  clienteAdminController.listar,
);
router.post(
  '/clientes/:id/redefinir-senha',
  permitir(...TODOS_OS_CARGOS),
  clienteAdminController.redefinirSenha,
);

// Pagamentos e Financeiro (valores reais — só dono)
router.get('/pagamentos', permitir('dono'), financeiroController.listarPagamentos);
router.get('/financeiro/resumo', permitir('dono'), financeiroController.resumo);

// Cupons e banners (Gestão/promoções) — leitura liberada a toda a
// equipe, mutações reservadas a quem decide preço/campanha.
router.get('/cupons', permitir(...TODOS_OS_CARGOS), cupomAdminController.listar);
router.post('/cupons', permitir('dono', 'rh', 'gerente'), cupomAdminController.criar);
router.patch(
  '/cupons/:id/status',
  permitir('dono', 'rh', 'gerente'),
  cupomAdminController.atualizarStatus,
);
router.delete('/cupons/:id', permitir('dono', 'rh', 'gerente'), cupomAdminController.remover);

router.get('/banners', permitir(...TODOS_OS_CARGOS), bannerAdminController.listar);
router.post('/banners', permitir('dono', 'rh', 'gerente'), bannerAdminController.criar);
router.put('/banners/:id', permitir('dono', 'rh', 'gerente'), bannerAdminController.atualizar);
router.patch(
  '/banners/:id/status',
  permitir('dono', 'rh', 'gerente'),
  bannerAdminController.atualizarStatus,
);
router.delete('/banners/:id', permitir('dono', 'rh', 'gerente'), bannerAdminController.remover);

// Configurações: qualquer admin troca a própria senha
router.patch('/me/senha', permitir(...TODOS_OS_CARGOS), adminController.alterarSenha);

module.exports = router;
