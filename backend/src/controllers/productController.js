'use strict';

var Joi = require('joi');
var Op = require('sequelize').Op;
var models = require('../models/index');
var activityLogger = require('../utils/activityLogger');

var productSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  sku: Joi.string().max(50).allow('', null).optional(),
  description: Joi.string().allow('', null).optional(),
  unit_price: Joi.number().min(0).default(0),
  category: Joi.string().max(100).allow('', null).optional(),
  unit: Joi.string().max(50).default('piece'),
  active: Joi.boolean().default(true)
});

exports.list = async function(req, res, next) {
  try {
    var where = {};

    if (req.query.active !== undefined) {
      where.active = req.query.active === 'true';
    }
    if (req.query.category) {
      where.category = req.query.category;
    }
    if (req.query.search) {
      where[Op.or] = [
        { name: { [Op.iLike]: '%' + req.query.search + '%' } },
        { sku: { [Op.iLike]: '%' + req.query.search + '%' } },
        { category: { [Op.iLike]: '%' + req.query.search + '%' } }
      ];
    }

    var products = await models.Product.findAll({
      where: where,
      order: [['name', 'ASC']]
    });

    res.json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
};

exports.create = async function(req, res, next) {
  try {
    var value = await productSchema.validateAsync(req.body);
    var product = await models.Product.create(value);

    await activityLogger.log('product', product.id, 'created', 'Product created: ' + value.name, req.user.id);

    res.status(201).json({ success: true, data: product });
  } catch (err) {
    if (err.isJoi) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

exports.get = async function(req, res, next) {
  try {
    var product = await models.Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

exports.update = async function(req, res, next) {
  try {
    var product = await models.Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    var value = await productSchema.validateAsync(req.body);
    await product.update(value);

    await activityLogger.log('product', product.id, 'updated', 'Product updated: ' + value.name, req.user.id);

    res.json({ success: true, data: product });
  } catch (err) {
    if (err.isJoi) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

exports.remove = async function(req, res, next) {
  try {
    var product = await models.Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Soft-delete: deactivate instead of hard delete (preserves quotation history)
    await product.update({ active: false });

    await activityLogger.log('product', product.id, 'deactivated', 'Product deactivated', req.user.id);

    res.json({ success: true, message: 'Product deactivated' });
  } catch (err) {
    next(err);
  }
};
