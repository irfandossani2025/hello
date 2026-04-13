'use strict';

var jwt = require('jsonwebtoken');
var config = require('../config/config');
var models = require('../models/index');

var auth = async function(req, res, next) {
  try {
    var token = null;
    var authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    var decoded = jwt.verify(token, config.jwt.secret);
    var user = await models.User.findOne({ where: { id: decoded.id, active: true } });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

var adminOnly = function(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Admin access required' });
};

module.exports = { auth: auth, adminOnly: adminOnly };
