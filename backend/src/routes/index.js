'use strict';

var express = require('express');
var router = express.Router();

router.use('/auth', require('./auth'));
router.use('/calls', require('./calls'));
router.use('/leads', require('./leads'));
router.use('/quotations', require('./quotations'));
router.use('/products', require('./products'));
router.use('/dashboard', require('./dashboard'));

module.exports = router;
