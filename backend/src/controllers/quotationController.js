'use strict';

var Joi = require('joi');
var models = require('../models/index');
var activityLogger = require('../utils/activityLogger');

var itemSchema = Joi.object({
  id: Joi.number().integer().optional(),
  product_id: Joi.number().integer().allow(null).optional(),
  description: Joi.string().max(500).required(),
  quantity: Joi.number().integer().min(1).required(),
  unit_price: Joi.number().min(0).required()
});

var quotationSchema = Joi.object({
  lead_id: Joi.number().integer().required(),
  status: Joi.string().valid('draft', 'sent', 'won', 'lost').default('draft'),
  discount_percent: Joi.number().min(0).max(100).default(0),
  notes: Joi.string().allow('', null).optional(),
  valid_until: Joi.date().allow(null).optional(),
  items: Joi.array().items(itemSchema).default([])
});

function calculateTotal(items, discountPercent) {
  var subtotal = items.reduce(function(sum, item) {
    return sum + (item.quantity * item.unit_price);
  }, 0);
  var discount = subtotal * (discountPercent / 100);
  return parseFloat((subtotal - discount).toFixed(2));
}

exports.list = async function(req, res, next) {
  try {
    var page = parseInt(req.query.page || '1', 10);
    var limit = parseInt(req.query.limit || '20', 10);
    var offset = (page - 1) * limit;

    var where = {};
    if (req.query.status) where.status = req.query.status;

    var result = await models.Quotation.findAndCountAll({
      where: where,
      include: [
        { model: models.Lead, as: 'lead', attributes: ['id', 'name', 'company_name', 'phone'] },
        { model: models.User, as: 'creator', attributes: ['id', 'name'] }
      ],
      limit: limit,
      offset: offset,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: result.rows,
      total: result.count,
      page: page,
      pages: Math.ceil(result.count / limit)
    });
  } catch (err) {
    next(err);
  }
};

exports.create = async function(req, res, next) {
  try {
    var value = await quotationSchema.validateAsync(req.body);

    var count = await models.Quotation.count();
    var year = new Date().getFullYear();
    var quotationNumber = 'QT-' + year + '-' + String(count + 1).padStart(4, '0');

    var total = calculateTotal(value.items, value.discount_percent);

    var quotation = await models.Quotation.create({
      lead_id: value.lead_id,
      quotation_number: quotationNumber,
      status: value.status,
      discount_percent: value.discount_percent,
      total_amount: total,
      notes: value.notes || null,
      valid_until: value.valid_until || null,
      created_by: req.user.id
    });

    if (value.items && value.items.length > 0) {
      var itemsData = value.items.map(function(item) {
        return {
          quotation_id: quotation.id,
          product_id: item.product_id || null,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: parseFloat((item.quantity * item.unit_price).toFixed(2))
        };
      });
      await models.QuotationItem.bulkCreate(itemsData);
    }

    await activityLogger.log('quotation', quotation.id, 'created', 'Quotation ' + quotationNumber + ' created', req.user.id);

    var full = await models.Quotation.findByPk(quotation.id, {
      include: [
        { model: models.QuotationItem, as: 'items', include: [{ model: models.Product, as: 'product' }] },
        { model: models.Lead, as: 'lead' },
        { model: models.User, as: 'creator', attributes: ['id', 'name'] }
      ]
    });

    res.status(201).json({ success: true, data: full });
  } catch (err) {
    if (err.isJoi) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

exports.get = async function(req, res, next) {
  try {
    var quotation = await models.Quotation.findByPk(req.params.id, {
      include: [
        { model: models.QuotationItem, as: 'items', include: [{ model: models.Product, as: 'product' }] },
        { model: models.Lead, as: 'lead' },
        { model: models.User, as: 'creator', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    res.json({ success: true, data: quotation });
  } catch (err) {
    next(err);
  }
};

exports.update = async function(req, res, next) {
  try {
    var quotation = await models.Quotation.findByPk(req.params.id);

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    if (quotation.status === 'won' || quotation.status === 'lost') {
      return res.status(400).json({ success: false, message: 'Cannot edit a closed quotation' });
    }

    var value = await quotationSchema.validateAsync(req.body);
    var total = calculateTotal(value.items, value.discount_percent);

    await quotation.update({
      status: value.status,
      discount_percent: value.discount_percent,
      total_amount: total,
      notes: value.notes || null,
      valid_until: value.valid_until || null
    });

    // Replace all items
    await models.QuotationItem.destroy({ where: { quotation_id: quotation.id } });

    if (value.items && value.items.length > 0) {
      var itemsData = value.items.map(function(item) {
        return {
          quotation_id: quotation.id,
          product_id: item.product_id || null,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: parseFloat((item.quantity * item.unit_price).toFixed(2))
        };
      });
      await models.QuotationItem.bulkCreate(itemsData);
    }

    await activityLogger.log('quotation', quotation.id, 'updated', 'Quotation updated', req.user.id);

    var full = await models.Quotation.findByPk(quotation.id, {
      include: [
        { model: models.QuotationItem, as: 'items', include: [{ model: models.Product, as: 'product' }] },
        { model: models.Lead, as: 'lead' },
        { model: models.User, as: 'creator', attributes: ['id', 'name'] }
      ]
    });

    res.json({ success: true, data: full });
  } catch (err) {
    if (err.isJoi) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

exports.updateStatus = async function(req, res, next) {
  try {
    var schema = Joi.object({
      status: Joi.string().valid('draft', 'sent', 'won', 'lost').required(),
      notes: Joi.string().allow('', null).optional()
    });

    var value = await schema.validateAsync(req.body);

    var quotation = await models.Quotation.findByPk(req.params.id);

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    var updates = { status: value.status };
    if (value.notes) updates.notes = value.notes;

    await quotation.update(updates);

    // Update lead status on won/lost
    if (value.status === 'won') {
      await models.Lead.update({ status: 'converted' }, { where: { id: quotation.lead_id } });
    } else if (value.status === 'lost') {
      await models.Lead.update({ status: 'unqualified' }, { where: { id: quotation.lead_id } });
    }

    await activityLogger.log('quotation', quotation.id, 'status_changed',
      'Status changed to ' + value.status, req.user.id);

    res.json({ success: true, data: quotation, message: 'Status updated to ' + value.status });
  } catch (err) {
    if (err.isJoi) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

exports.remove = async function(req, res, next) {
  try {
    var quotation = await models.Quotation.findByPk(req.params.id);

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    await models.QuotationItem.destroy({ where: { quotation_id: quotation.id } });
    await quotation.destroy();

    await activityLogger.log('quotation', req.params.id, 'deleted', 'Quotation deleted', req.user.id);

    res.json({ success: true, message: 'Quotation deleted' });
  } catch (err) {
    next(err);
  }
};
