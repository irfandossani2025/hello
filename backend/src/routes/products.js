'use strict';

var express = require('express');
var router = express.Router();
var productController = require('../controllers/productController');
var authMiddleware = require('../middleware/auth');

// All authenticated
router.get('/', authMiddleware.auth, productController.list);
router.get('/:id', authMiddleware.auth, productController.get);
// Admin-only for write operations
router.post('/', authMiddleware.auth, authMiddleware.adminOnly, productController.create);
router.put('/:id', authMiddleware.auth, authMiddleware.adminOnly, productController.update);
router.delete('/:id', authMiddleware.auth, authMiddleware.adminOnly, productController.remove);

module.exports = router;
