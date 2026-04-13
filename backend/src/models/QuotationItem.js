'use strict';

var DataTypes = require('sequelize').DataTypes;

module.exports = function(sequelize) {
  var QuotationItem = sequelize.define('QuotationItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    quotation_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    product_id: {
      type: DataTypes.INTEGER
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    unit_price: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    total_price: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
    }
  }, {
    tableName: 'quotation_items',
    timestamps: true,
    underscored: true
  });

  return QuotationItem;
};
