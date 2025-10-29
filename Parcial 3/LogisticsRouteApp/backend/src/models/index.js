const { Sequelize } = require('sequelize');
const config = require('../config/config');

// Database configuration
const sequelize = new Sequelize(
  config.database.name,
  config.database.username,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development',
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Import and initialize models
const User = require('./user.model')(sequelize);
const OTP = require('./otp.model')(sequelize);
const Delivery = require('./delivery.model')(sequelize);
const DeliveryDestination = require('./deliveryDestination.model')(sequelize);
const FuelSavingHistory = require('./fuelSavingHistory.model')(sequelize);

// Set up associations
User.hasMany(Delivery, {
  foreignKey: 'userId',
  as: 'deliveries'
});

Delivery.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

Delivery.hasMany(DeliveryDestination, {
  foreignKey: 'deliveryId',
  as: 'destinations'
});

DeliveryDestination.belongsTo(Delivery, {
  foreignKey: 'deliveryId',
  as: 'delivery'
});

User.hasMany(FuelSavingHistory, {
  foreignKey: 'userId',
  as: 'fuelSavings'
});

FuelSavingHistory.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

Delivery.hasOne(FuelSavingHistory, {
  foreignKey: 'deliveryId',
  as: 'fuelSaving'
});

FuelSavingHistory.belongsTo(Delivery, {
  foreignKey: 'deliveryId',
  as: 'delivery'
});

module.exports = {
  sequelize,
  User,
  OTP,
  Delivery,
  DeliveryDestination,
  FuelSavingHistory
};
