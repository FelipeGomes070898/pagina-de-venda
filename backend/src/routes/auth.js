const { Router } = require('express');
const authController = require('../controllers/authController');

const router = Router();

router.post('/login', authController.loginAdmin);

module.exports = router;
