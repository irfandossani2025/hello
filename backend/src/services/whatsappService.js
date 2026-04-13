'use strict';

var axios = require('axios');
var config = require('../config/config');

exports.sendMessage = async function(to, message) {
  if (!config.whatsapp.accessToken || !config.whatsapp.phoneNumberId) {
    throw new Error('WhatsApp credentials not configured');
  }

  var url = 'https://graph.facebook.com/' +
    config.whatsapp.apiVersion + '/' +
    config.whatsapp.phoneNumberId + '/messages';

  var response = await axios.post(url, {
    messaging_product: 'whatsapp',
    to: to,
    type: 'text',
    text: { body: message }
  }, {
    headers: {
      'Authorization': 'Bearer ' + config.whatsapp.accessToken,
      'Content-Type': 'application/json'
    },
    timeout: 10000
  });

  return response.data;
};

exports.sendLeadConfirmation = async function(phone, name) {
  var message = 'Hi ' + name + ', your enquiry has been received. ' +
    'Our team will get back to you shortly. Thank you!';
  return exports.sendMessage(phone, message);
};
