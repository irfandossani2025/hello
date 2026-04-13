'use strict';

var DataTypes = require('sequelize').DataTypes;

module.exports = function(sequelize) {
  var Product = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    sku: {
      type: DataTypes.STRING(50),
      unique: true
    },
    description: {
      type: DataTypes.TEXT
    },
    unit_price: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    category: {
      type: DataTypes.STRING(100)
    },
    unit: {
      type: DataTypes.STRING(50),
      defaultValue: 'piece'
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'products',
    timestamps: true,
    underscored: true
  });

  return Product;
};
