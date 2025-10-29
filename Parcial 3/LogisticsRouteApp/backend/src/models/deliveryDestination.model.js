const { DataTypes } = require('sequelize');
const { encrypt, decrypt } = require('../utils/encryption');

module.exports = (sequelize) => {
  const DeliveryDestination = sequelize.define('DeliveryDestination', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    deliveryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Deliveries',
        key: 'id'
      }
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
      // Encrypt address before saving
      set(value) {
        if (value) {
          this.setDataValue('address', encrypt(value));
        }
      },
      // Decrypt address when reading
      get() {
        const rawValue = this.getDataValue('address');
        return rawValue ? decrypt(rawValue) : null;
      }
    },
    lat: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    lng: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    optimizedOrder: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    timestamps: true
  });

  // Mark destination as completed
  DeliveryDestination.prototype.markAsCompleted = async function() {
    this.completed = true;
    this.completedAt = new Date();
    return await this.save();
  };

  return DeliveryDestination;
};
