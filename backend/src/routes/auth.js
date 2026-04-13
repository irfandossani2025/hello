'use strict';

var express = require('express');
var router = express.Router();
var authController = require('../controllers/authController');
var authMiddleware = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/register', authMiddleware.auth, authMiddleware.adminOnly, authController.register);
router.get('/me', authMiddleware.auth, authController.me);
router.put('/change-password', authMiddleware.auth, authController.changePassword);
router.get('/users', authMiddleware.auth, authController.listUsers);

module.exports = router;
