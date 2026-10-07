const { Router } = require('express');
const bannerController = require('../controllers/bannerController');

const router = Router();

router.get('/ativos', bannerController.listarAtivos);

module.exports = router;
