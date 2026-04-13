'use strict';

var DataTypes = require('sequelize').DataTypes;

module.exports = function(sequelize) {
  var Lead = sequelize.define('Lead', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    company_name: {
      type: DataTypes.STRING(150)
    },
    phone: {
      type: DataTypes.STRING(20)
    },
    email: {
      type: DataTypes.STRING(150)
    },
    source: {
      type: DataTypes.ENUM('call', 'whatsapp', 'direct', 'referral', 'other'),
      defaultValue: 'direct'
    },
    status: {
      type: DataTypes.ENUM('new', 'contacted', 'qualified', 'unqualified', 'converted'),
      defaultValue: 'new'
    },
    notes: {
      type: DataTypes.TEXT
    },
    assigned_to: {
      type: DataTypes.INTEGER
    },
    created_by: {
      type: DataTypes.INTEGER
    },
    call_id: {
      type: DataTypes.INTEGER
    },
    whatsapp_message_id: {
      type: DataTypes.INTEGER
    }
  }, {
    tableName: 'leads',
    timestamps: true,
    underscored: true
  });

  return Lead;
};
