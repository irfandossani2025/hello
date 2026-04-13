'use strict';

var models = require('../models/index');

async function log(entityType, entityId, action, description, userId) {
  try {
    await models.ActivityLog.create({
      entity_type: entityType,
      entity_id: entityId,
      action: action,
      description: description || '',
      user_id: userId || null
    });
  } catch (err) {
    // Non-fatal - log error but don't crash
    console.error('[ActivityLog Error]', err.message);
  }
}

module.exports = { log: log };
