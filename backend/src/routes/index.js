const { Router } = require('express');
const auth = require('./auth');
const admin = require('./admin');

const router = Router();

router.use('/auth', auth);
router.use('/admin', admin);

module.exports = router;
