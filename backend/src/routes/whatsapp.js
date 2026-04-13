'use strict';

var express = require('express');
var router = express.Router();
var whatsappController = require('../controllers/whatsappController');

// Webhook verification (GET) and message receiver (POST)
router.get('/whatsapp', whatsappController.verify);
router.post('/whatsapp', whatsappController.receive);

module.exports = router;
