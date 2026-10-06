const { Router } = require('express');
const uploadController = require('../controllers/uploadController');
const { autenticarApp } = require('../middlewares/auth');

const router = Router();

router.post('/handle-blob', autenticarApp, uploadController.gerarToken);

module.exports = router;
