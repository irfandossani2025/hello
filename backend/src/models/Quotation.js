'use strict';

var DataTypes = require('sequelize').DataTypes;

module.exports = function(sequelize) {
  var Quotation = sequelize.define('Quotation', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    lead_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    quotation_number: {
      type: DataTypes.STRING(50),
      unique: true
    },
    status: {
      type: DataTypes.ENUM('draft', 'sent', 'won', 'lost'),
      defaultValue: 'draft'
    },
    total_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
    },
    discount_percent: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.00
    },
    notes: {
      type: DataTypes.TEXT
    },
    valid_until: {
      type: DataTypes.DATEONLY
    },
    created_by: {
      type: DataTypes.INTEGER
    }
  }, {
    tableName: 'quotations',
    timestamps: true,
    underscored: true
  });

  return Quotation;
};
