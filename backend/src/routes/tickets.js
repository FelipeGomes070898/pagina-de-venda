const { Router } = require('express');
const ticketController = require('../controllers/ticketController');
const { autenticarApp } = require('../middlewares/auth');

const router = Router();

router.use(autenticarApp);
router.post('/', ticketController.criar);
router.get('/meus', ticketController.meus);

module.exports = router;
