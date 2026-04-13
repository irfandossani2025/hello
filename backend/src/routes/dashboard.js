'use strict';

var express = require('express');
var router = express.Router();
var dashboardController = require('../controllers/dashboardController');
var authMiddleware = require('../middleware/auth');

router.get('/stats', authMiddleware.auth, dashboardController.stats);
router.get('/users', authMiddleware.auth, dashboardController.users);

module.exports = router;
