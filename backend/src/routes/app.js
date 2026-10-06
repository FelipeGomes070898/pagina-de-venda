const { Router } = require('express');
const appDownloadController = require('../controllers/appDownloadController');

const router = Router();

// Público de propósito (sem autenticarApp) — é o link de download que
// aparece no site pra qualquer cliente baixar o app, antes mesmo de
// ter uma conta.
router.get('/baixar-android', appDownloadController.baixarAndroid);

module.exports = router;
