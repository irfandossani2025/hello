'use strict';

var Op = require('sequelize').Op;
var models = require('../models/index');

exports.stats = async function(req, res, next) {
  try {
    var now = new Date();
    var startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Calls
    var totalCalls = await models.Call.count();
    var callsThisMonth = await models.Call.count({
      where: { created_at: { [Op.gte]: startOfMonth } }
    });
    var pendingCalls = await models.Call.count({ where: { status: 'pending' } });

    // Leads
    var totalLeads = await models.Lead.count();
    var newLeads = await models.Lead.count({ where: { status: 'new' } });
    var leadsThisMonth = await models.Lead.count({
      where: { created_at: { [Op.gte]: startOfMonth } }
    });

    // Quotations
    var totalQuotations = await models.Quotation.count();
    var wonQuotations = await models.Quotation.count({ where: { status: 'won' } });
    var lostQuotations = await models.Quotation.count({ where: { status: 'lost' } });
    var sentQuotations = await models.Quotation.count({ where: { status: 'sent' } });
    var draftQuotations = await models.Quotation.count({ where: { status: 'draft' } });

    // Revenue
    var totalRevenue = await models.Quotation.sum('total_amount', { where: { status: 'won' } });
    var revenueThisMonth = await models.Quotation.sum('total_amount', {
      where: { status: 'won', updated_at: { [Op.gte]: startOfMonth } }
    });

    var winRate = totalQuotations > 0 ? Math.round((wonQuotations / totalQuotations) * 100) : 0;

    // Recent records
    var recentCalls = await models.Call.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      include: [{ model: models.User, as: 'assignee', attributes: ['name'] }]
    });

    var recentLeads = await models.Lead.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      include: [{ model: models.User, as: 'assignee', attributes: ['name'] }]
    });

    var recentQuotations = await models.Quotation.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      include: [{ model: models.Lead, as: 'lead', attributes: ['name', 'company_name'] }]
    });

    res.json({
      success: true,
      data: {
        calls: {
          total: totalCalls,
          this_month: callsThisMonth,
          pending: pendingCalls
        },
        leads: {
          total: totalLeads,
          new: newLeads,
          this_month: leadsThisMonth
        },
        quotations: {
          total: totalQuotations,
          won: wonQuotations,
          lost: lostQuotations,
          sent: sentQuotations,
          draft: draftQuotations,
          win_rate: winRate
        },
        revenue: {
          total: parseFloat(totalRevenue || 0),
          this_month: parseFloat(revenueThisMonth || 0)
        },
        recent: {
          calls: recentCalls,
          leads: recentLeads,
          quotations: recentQuotations
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.users = async function(req, res, next) {
  try {
    var users = await models.User.findAll({
      attributes: ['id', 'name', 'email', 'role'],
      where: { active: true },
      order: [['name', 'ASC']]
    });
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};
