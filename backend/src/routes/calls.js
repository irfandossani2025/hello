'use strict';

var express = require('express');
var router = express.Router();
var callController = require('../controllers/callController');
var authMiddleware = require('../middleware/auth');

router.use(authMiddleware.auth);

router.get('/', callController.list);
router.post('/', callController.create);
router.get('/:id', callController.get);
router.put('/:id', callController.update);
router.delete('/:id', callController.remove);
router.post('/:id/convert-to-lead', callController.convertToLead);

module.exports = router;
