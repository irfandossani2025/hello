'use strict';

var sequelize = require('../config/database');

var User = require('./User')(sequelize);
var Call = require('./Call')(sequelize);
var Lead = require('./Lead')(sequelize);
var Product = require('./Product')(sequelize);
var Quotation = require('./Quotation')(sequelize);
var QuotationItem = require('./QuotationItem')(sequelize);
var WhatsappMessage = require('./WhatsappMessage')(sequelize);
var ActivityLog = require('./ActivityLog')(sequelize);

// ── User ↔ Call ─────────────────────────────────────────────────────────────
User.hasMany(Call, { foreignKey: 'assigned_to', as: 'assignedCalls' });
User.hasMany(Call, { foreignKey: 'created_by', as: 'createdCalls' });
Call.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignee' });
Call.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// ── User ↔ Lead ──────────────────────────────────────────────────────────────
User.hasMany(Lead, { foreignKey: 'assigned_to', as: 'assignedLeads' });
User.hasMany(Lead, { foreignKey: 'created_by', as: 'createdLeads' });
Lead.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignee' });
Lead.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// ── Call ↔ Lead ───────────────────────────────────────────────────────────────
Call.hasOne(Lead, { foreignKey: 'call_id', as: 'lead' });
Lead.belongsTo(Call, { foreignKey: 'call_id', as: 'call' });

// ── WhatsappMessage ↔ Lead ────────────────────────────────────────────────────
WhatsappMessage.hasOne(Lead, { foreignKey: 'whatsapp_message_id', as: 'lead' });
Lead.belongsTo(WhatsappMessage, { foreignKey: 'whatsapp_message_id', as: 'whatsappMessage' });

// ── Lead ↔ Quotation ─────────────────────────────────────────────────────────
Lead.hasMany(Quotation, { foreignKey: 'lead_id', as: 'quotations' });
Quotation.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });

// ── User ↔ Quotation ─────────────────────────────────────────────────────────
User.hasMany(Quotation, { foreignKey: 'created_by', as: 'quotations' });
Quotation.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// ── Quotation ↔ QuotationItem ────────────────────────────────────────────────
Quotation.hasMany(QuotationItem, { foreignKey: 'quotation_id', as: 'items' });
QuotationItem.belongsTo(Quotation, { foreignKey: 'quotation_id', as: 'quotation' });

// ── Product ↔ QuotationItem ──────────────────────────────────────────────────
Product.hasMany(QuotationItem, { foreignKey: 'product_id', as: 'quotationItems' });
QuotationItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// ── User ↔ ActivityLog ───────────────────────────────────────────────────────
User.hasMany(ActivityLog, { foreignKey: 'user_id', as: 'activities' });
ActivityLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize: sequelize,
  User: User,
  Call: Call,
  Lead: Lead,
  Product: Product,
  Quotation: Quotation,
  QuotationItem: QuotationItem,
  WhatsappMessage: WhatsappMessage,
  ActivityLog: ActivityLog
};
