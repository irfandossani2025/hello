'use strict';

var Joi = require('joi');
var Op = require('sequelize').Op;
var models = require('../models/index');
var activityLogger = require('../utils/activityLogger');

var callSchema = Joi.object({
  caller_name: Joi.string().min(2).max(100).required(),
  company_name: Joi.string().max(150).allow('', null).optional(),
  phone: Joi.string().max(20).required(),
  email: Joi.string().email().allow('', null).optional(),
  call_date: Joi.date().allow(null).optional(),
  duration_minutes: Joi.number().integer().min(0).allow(null).optional(),
  status: Joi.string().valid('pending', 'completed', 'follow_up', 'no_answer').default('pending'),
  notes: Joi.string().allow('', null).optional(),
  outcome: Joi.string().allow('', null).optional(),
  assigned_to: Joi.number().integer().allow(null).optional()
});

exports.list = async function(req, res, next) {
  try {
    var page = parseInt(req.query.page || '1', 10);
    var limit = parseInt(req.query.limit || '20', 10);
    var offset = (page - 1) * limit;

    var where = {};
    if (req.query.status) {
      where.status = req.query.status;
    }
    if (req.query.search) {
      where[Op.or] = [
        { caller_name: { [Op.iLike]: '%' + req.query.search + '%' } },
        { company_name: { [Op.iLike]: '%' + req.query.search + '%' } },
        { phone: { [Op.iLike]: '%' + req.query.search + '%' } }
      ];
    }

    var result = await models.Call.findAndCountAll({
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
    var value = await callSchema.validateAsync(req.body);
    value.created_by = req.user.id;

    if (!value.assigned_to) {
      value.assigned_to = req.user.id;
    }

    var call = await models.Call.create(value);
    await activityLogger.log('call', call.id, 'created', 'Call created for ' + value.caller_name, req.user.id);

    res.status(201).json({ success: true, data: call });
  } catch (err) {
    if (err.isJoi) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

exports.get = async function(req, res, next) {
  try {
    var call = await models.Call.findByPk(req.params.id, {
      include: [
        { model: models.User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: models.User, as: 'creator', attributes: ['id', 'name'] },
        { model: models.Lead, as: 'lead', attributes: ['id', 'name', 'status'] }
      ]
    });

    if (!call) {
      return res.status(404).json({ success: false, message: 'Call not found' });
    }

    res.json({ success: true, data: call });
  } catch (err) {
    next(err);
  }
};

exports.update = async function(req, res, next) {
  try {
    var call = await models.Call.findByPk(req.params.id);

    if (!call) {
      return res.status(404).json({ success: false, message: 'Call not found' });
    }

    var value = await callSchema.validateAsync(req.body);
    await call.update(value);

    await activityLogger.log('call', call.id, 'updated', 'Call updated', req.user.id);

    res.json({ success: true, data: call });
  } catch (err) {
    if (err.isJoi) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

exports.remove = async function(req, res, next) {
  try {
    var call = await models.Call.findByPk(req.params.id);

    if (!call) {
      return res.status(404).json({ success: false, message: 'Call not found' });
    }

    await call.destroy();
    await activityLogger.log('call', req.params.id, 'deleted', 'Call deleted', req.user.id);

    res.json({ success: true, message: 'Call deleted' });
  } catch (err) {
    next(err);
  }
};

exports.convertToLead = async function(req, res, next) {
  try {
    var call = await models.Call.findByPk(req.params.id);

    if (!call) {
      return res.status(404).json({ success: false, message: 'Call not found' });
    }

    // Check if already converted
    var existingLead = await models.Lead.findOne({ where: { call_id: call.id } });
    if (existingLead) {
      return res.status(400).json({ success: false, message: 'Call already converted to a lead', lead_id: existingLead.id });
    }

    var lead = await models.Lead.create({
      name: call.caller_name,
      company_name: call.company_name || null,
      phone: call.phone,
      email: call.email || null,
      source: 'call',
      status: 'new',
      notes: call.notes || null,
      assigned_to: call.assigned_to,
      created_by: req.user.id,
      call_id: call.id
    });

    await call.update({ status: 'completed' });

    await activityLogger.log('call', call.id, 'converted', 'Converted to lead #' + lead.id, req.user.id);
    await activityLogger.log('lead', lead.id, 'created', 'Created from call #' + call.id, req.user.id);

    res.status(201).json({ success: true, data: lead, message: 'Lead created successfully' });
  } catch (err) {
    next(err);
  }
};
