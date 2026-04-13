'use strict';

var Joi = require('joi');
var Op = require('sequelize').Op;
var models = require('../models/index');
var activityLogger = require('../utils/activityLogger');

var leadSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  company_name: Joi.string().max(150).allow('', null).optional(),
  phone: Joi.string().max(20).allow('', null).optional(),
  email: Joi.string().email().allow('', null).optional(),
  source: Joi.string().valid('call', 'whatsapp', 'direct', 'referral', 'other').default('direct'),
  status: Joi.string().valid('new', 'contacted', 'qualified', 'unqualified', 'converted').default('new'),
  notes: Joi.string().allow('', null).optional(),
  assigned_to: Joi.number().integer().allow(null).optional()
});

exports.list = async function(req, res, next) {
  try {
    var page = parseInt(req.query.page || '1', 10);
    var limit = parseInt(req.query.limit || '20', 10);
    var offset = (page - 1) * limit;

    var where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.source) where.source = req.query.source;
    if (req.query.search) {
      where[Op.or] = [
        { name: { [Op.iLike]: '%' + req.query.search + '%' } },
        { company_name: { [Op.iLike]: '%' + req.query.search + '%' } },
        { phone: { [Op.iLike]: '%' + req.query.search + '%' } },
        { email: { [Op.iLike]: '%' + req.query.search + '%' } }
      ];
    }

    var result = await models.Lead.findAndCountAll({
      where: where,
      include: [
        { model: models.User, as: 'assignee', attributes: ['id', 'name', 'email'] },
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
    var value = await leadSchema.validateAsync(req.body);
    value.created_by = req.user.id;

    if (!value.assigned_to) {
      value.assigned_to = req.user.id;
    }

    var lead = await models.Lead.create(value);
    await activityLogger.log('lead', lead.id, 'created', 'Lead created for ' + value.name, req.user.id);

    res.status(201).json({ success: true, data: lead });
  } catch (err) {
    if (err.isJoi) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

exports.get = async function(req, res, next) {
  try {
    var lead = await models.Lead.findByPk(req.params.id, {
      include: [
        { model: models.User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: models.User, as: 'creator', attributes: ['id', 'name'] },
        { model: models.Call, as: 'call', attributes: ['id', 'caller_name', 'phone', 'status'] },
        {
          model: models.Quotation,
          as: 'quotations',
          attributes: ['id', 'quotation_number', 'status', 'total_amount', 'created_at']
        }
      ]
    });

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    res.json({ success: true, data: lead });
  } catch (err) {
    next(err);
  }
};

exports.update = async function(req, res, next) {
  try {
    var lead = await models.Lead.findByPk(req.params.id);

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    var value = await leadSchema.validateAsync(req.body);
    await lead.update(value);

    await activityLogger.log('lead', lead.id, 'updated', 'Lead updated', req.user.id);

    res.json({ success: true, data: lead });
  } catch (err) {
    if (err.isJoi) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

exports.remove = async function(req, res, next) {
  try {
    var lead = await models.Lead.findByPk(req.params.id);

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    await lead.destroy();
    await activityLogger.log('lead', req.params.id, 'deleted', 'Lead deleted', req.user.id);

    res.json({ success: true, message: 'Lead deleted' });
  } catch (err) {
    next(err);
  }
};

exports.createQuotation = async function(req, res, next) {
  try {
    var lead = await models.Lead.findByPk(req.params.id);

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // Generate unique quotation number
    var count = await models.Quotation.count();
    var year = new Date().getFullYear();
    var quotationNumber = 'QT-' + year + '-' + String(count + 1).padStart(4, '0');

    var quotation = await models.Quotation.create({
      lead_id: lead.id,
      quotation_number: quotationNumber,
      status: 'draft',
      created_by: req.user.id
    });

    await lead.update({ status: 'qualified' });

    await activityLogger.log('lead', lead.id, 'quotation_created', 'Quotation ' + quotationNumber + ' created', req.user.id);
    await activityLogger.log('quotation', quotation.id, 'created', 'Created from lead #' + lead.id, req.user.id);

    res.status(201).json({ success: true, data: quotation, message: 'Quotation created' });
  } catch (err) {
    next(err);
  }
};
