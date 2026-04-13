'use strict';

var DataTypes = require('sequelize').DataTypes;

module.exports = function(sequelize) {
  var Call = sequelize.define('Call', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    caller_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    company_name: {
      type: DataTypes.STRING(150)
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(150)
    },
    call_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    duration_minutes: {
      type: DataTypes.INTEGER
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'follow_up', 'no_answer'),
      defaultValue: 'pending'
    },
    notes: {
      type: DataTypes.TEXT
    },
    outcome: {
      type: DataTypes.TEXT
    },
    assigned_to: {
      type: DataTypes.INTEGER
    },
    created_by: {
      type: DataTypes.INTEGER
    }
  }, {
    tableName: 'calls',
    timestamps: true,
    underscored: true
  });

  return Call;
};
