'use strict';

var config = require('../config/config');
var models = require('../models/index');
var activityLogger = require('../utils/activityLogger');

// Parse structured NEW LEAD message
// Expected format:
//   NEW LEAD
//   Name: Ali
//   Company: ABC Corp
//   Phone: 03001234567
//   Note: Interested in mugs
function parseLeadMessage(body) {
  var lines = body.split('\n');
  var result = {};

  lines.forEach(function(line) {
    var trimmed = line.trim();
    var lower = trimmed.toLowerCase();

    if (lower.startsWith('name:')) {
      result.name = trimmed.substring(5).trim();
    } else if (lower.startsWith('company:')) {
      result.company_name = trimmed.substring(8).trim();
    } else if (lower.startsWith('phone:')) {
      result.phone = trimmed.substring(6).trim();
    } else if (lower.startsWith('email:')) {
      result.email = trimmed.substring(6).trim();
    } else if (lower.startsWith('note:') || lower.startsWith('notes:')) {
      var colonIdx = trimmed.indexOf(':');
      result.notes = trimmed.substring(colonIdx + 1).trim();
    }
  });

  return result;
}

function isLeadMessage(body) {
  var upper = (body || '').toUpperCase().trim();
  return upper.startsWith('NEW LEAD') ||
         upper.startsWith('NEW CONTACT') ||
         upper.startsWith('LEAD:') ||
         upper.startsWith('NEW INQUIRY');
}

// GET /webhook/whatsapp — Meta verification challenge
exports.verify = function(req, res) {
  var mode = req.query['hub.mode'];
  var token = req.query['hub.verify_token'];
  var challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.whatsapp.verifyToken) {
    console.log('[WhatsApp] Webhook verified');
    return res.status(200).send(challenge);
  }

  console.warn('[WhatsApp] Webhook verification failed');
  return res.status(403).json({ error: 'Verification failed' });
};

// POST /webhook/whatsapp — Incoming messages
exports.receive = async function(req, res) {
  // Always respond 200 immediately so Meta does not retry
  res.status(200).json({ status: 'ok' });

  try {
    var body = req.body;

    if (!body || body.object !== 'whatsapp_business_account') return;

    var entries = body.entry || [];

    for (var i = 0; i < entries.length; i++) {
      var changes = (entries[i] && entries[i].changes) || [];

      for (var j = 0; j < changes.length; j++) {
        var change = changes[j];

        if (change.field !== 'messages') continue;

        var value = (change && change.value) || {};
        var messages = value.messages || [];

        for (var k = 0; k < messages.length; k++) {
          var msg = messages[k];

          if (msg.type !== 'text') continue;

          var fromPhone = msg.from;
          var messageText = (msg.text && msg.text.body) ? msg.text.body : '';
          var waMessageId = msg.id;

          if (!messageText || !waMessageId) continue;

          // Deduplicate
          var existing = await models.WhatsappMessage.findOne({
            where: { wa_message_id: waMessageId }
          });
          if (existing) continue;

          // Persist message
          var waMsg = await models.WhatsappMessage.create({
            from_phone: fromPhone,
            message_body: messageText,
            wa_message_id: waMessageId,
            status: 'received'
          });

          // Auto-create lead if structured message
          if (isLeadMessage(messageText)) {
            var parsed = parseLeadMessage(messageText);

            if (parsed.name) {
              var lead = await models.Lead.create({
                name: parsed.name,
                company_name: parsed.company_name || null,
                phone: parsed.phone || fromPhone,
                email: parsed.email || null,
                source: 'whatsapp',
                status: 'new',
                notes: parsed.notes || messageText,
                whatsapp_message_id: waMsg.id
              });

              await waMsg.update({
                status: 'processed',
                lead_created: true,
                lead_id: lead.id
              });

              await activityLogger.log(
                'lead', lead.id, 'created',
                'Auto-created from WhatsApp (' + fromPhone + ')', null
              );

              console.log('[WhatsApp] Lead #' + lead.id + ' created from ' + fromPhone);
            } else {
              await waMsg.update({ status: 'processed' });
            }
          } else {
            await waMsg.update({ status: 'processed' });
          }
        }
      }
    }
  } catch (err) {
    console.error('[WhatsApp] Webhook processing error:', err.message);
  }
};
