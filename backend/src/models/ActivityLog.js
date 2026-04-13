'use strict';

var DataTypes = require('sequelize').DataTypes;

module.exports = function(sequelize) {
  var ActivityLog = sequelize.define('ActivityLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    entity_type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    entity_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    user_id: {
      type: DataTypes.INTEGER
    }
  }, {
    tableName: 'activity_logs',
    timestamps: true,
    underscored: true,
    updatedAt: false
  });

  return ActivityLog;
};
