const { Router } = require('express');
const auth = require('./auth');
const admin = require('./admin');
const prestadores = require('./prestadores');
const pedidos = require('./pedidos');
const chat = require('./chat');

const router = Router();

router.use('/auth', auth);
router.use('/admin', admin);
router.use('/prestadores', prestadores);
router.use('/pedidos', pedidos);
router.use('/chat', chat);

module.exports = router;
