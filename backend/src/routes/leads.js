'use strict';

var express = require('express');
var router = express.Router();
var leadController = require('../controllers/leadController');
var authMiddleware = require('../middleware/auth');

router.use(authMiddleware.auth);

router.get('/', leadController.list);
router.post('/', leadController.create);
router.get('/:id', leadController.get);
router.put('/:id', leadController.update);
router.delete('/:id', leadController.remove);
router.post('/:id/create-quotation', leadController.createQuotation);

module.exports = router;
