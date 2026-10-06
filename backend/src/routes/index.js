const { Router } = require('express');
const auth = require('./auth');
const admin = require('./admin');
const prestadores = require('./prestadores');
const pedidos = require('./pedidos');
const chat = require('./chat');
const avaliacoes = require('./avaliacoes');
const avaliacoesClientes = require('./avaliacoesClientes');
const pagamentos = require('./pagamentos');
const app = require('./app');
const notificacoes = require('./notificacoes');
const uploads = require('./uploads');

const router = Router();

router.use('/auth', auth);
router.use('/admin', admin);
router.use('/prestadores', prestadores);
router.use('/pedidos', pedidos);
router.use('/chat', chat);
router.use('/avaliacoes', avaliacoes);
router.use('/avaliacoes-clientes', avaliacoesClientes);
router.use('/pagamentos', pagamentos);
router.use('/app', app);
router.use('/notificacoes', notificacoes);
router.use('/uploads', uploads);

module.exports = router;
