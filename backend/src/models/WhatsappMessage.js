'use strict';

var DataTypes = require('sequelize').DataTypes;

module.exports = function(sequelize) {
  var WhatsappMessage = sequelize.define('WhatsappMessage', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    from_phone: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    message_body: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    wa_message_id: {
      type: DataTypes.STRING(100),
      unique: true
    },
    status: {
      type: DataTypes.ENUM('received', 'processed', 'ignored'),
      defaultValue: 'received'
    },
    lead_created: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lead_id: {
      type: DataTypes.INTEGER
    },
    received_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'whatsapp_messages',
    timestamps: true,
    underscored: true
  });

  return WhatsappMessage;
};
