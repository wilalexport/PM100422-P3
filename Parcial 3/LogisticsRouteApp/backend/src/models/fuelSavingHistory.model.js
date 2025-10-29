const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const FuelSavingHistory = sequelize.define('FuelSavingHistory', {
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
    deliveryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Deliveries',
        key: 'id'
      }
    },
    optimizedDistance: {
      type: DataTypes.INTEGER, // Distance in meters
      allowNull: false
    },
    nonOptimizedDistance: {
      type: DataTypes.INTEGER, // Non-optimized distance in meters
      allowNull: false
    },
    fuelSaved: {
      type: DataTypes.FLOAT, // Amount of fuel saved in liters
      allowNull: false
    },
    fuelPrice: {
      type: DataTypes.FLOAT, // Price per liter (optional)
      allowNull: true
    },
    moneySaved: {
      type: DataTypes.FLOAT, // Money saved (if fuel price is provided)
      allowNull: true
    }
  }, {
    timestamps: true
  });

  return FuelSavingHistory;
};
