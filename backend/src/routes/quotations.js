'use strict';

var express = require('express');
var router = express.Router();
var quotationController = require('../controllers/quotationController');
var authMiddleware = require('../middleware/auth');

router.use(authMiddleware.auth);

router.get('/', quotationController.list);
router.post('/', quotationController.create);
router.get('/:id', quotationController.get);
router.put('/:id', quotationController.update);
router.put('/:id/status', quotationController.updateStatus);
router.delete('/:id', quotationController.remove);

module.exports = router;
