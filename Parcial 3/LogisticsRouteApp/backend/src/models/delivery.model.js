const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Delivery = sequelize.define('Delivery', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed'),
      defaultValue: 'pending'
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completionTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    originLat: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    originLng: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    totalDistance: {
      type: DataTypes.INTEGER, // Distance in meters
      allowNull: false
    },
    totalDuration: {
      type: DataTypes.INTEGER, // Duration in seconds
      allowNull: false
    },
    nonOptimizedDistance: {
      type: DataTypes.INTEGER, // Non-optimized distance in meters
      allowNull: true
    }
  }, {
    timestamps: true
  });

  // Method to start delivery
  Delivery.prototype.startDelivery = async function() {
    this.status = 'in_progress';
    this.startTime = new Date();
    return await this.save();
  };

  // Method to complete delivery
  Delivery.prototype.completeDelivery = async function() {
    this.status = 'completed';
    this.completionTime = new Date();
    return await this.save();
  };

  return Delivery;
};
