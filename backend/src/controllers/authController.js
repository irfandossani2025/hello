'use strict';

var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var Joi = require('joi');
var config = require('../config/config');
var models = require('../models/index');

var loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(1).required()
});

var registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('admin', 'sales').default('sales')
});

exports.login = async function(req, res, next) {
  try {
    var value = await loginSchema.validateAsync(req.body);

    var user = await models.User.findOne({ where: { email: value.email, active: true } });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    var isMatch = await bcrypt.compare(value.password, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    var token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.json({
      success: true,
      token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    if (err.isJoi) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

exports.register = async function(req, res, next) {
  try {
    var value = await registerSchema.validateAsync(req.body);

    var existing = await models.User.findOne({ where: { email: value.email } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    var hashed = await bcrypt.hash(value.password, 10);

    var user = await models.User.create({
      name: value.name,
      email: value.email,
      password: hashed,
      role: value.role
    });

    res.status(201).json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    if (err.isJoi) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

exports.me = async function(req, res) {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    }
  });
};

exports.changePassword = async function(req, res, next) {
  try {
    var schema = Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: Joi.string().min(6).required()
    });

    var value = await schema.validateAsync(req.body);

    var isMatch = await bcrypt.compare(value.currentPassword, req.user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    var hashed = await bcrypt.hash(value.newPassword, 10);
    await req.user.update({ password: hashed });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    if (err.isJoi) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

exports.listUsers = async function(req, res, next) {
  try {
    var users = await models.User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'active'],
      order: [['name', 'ASC']]
    });
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};
