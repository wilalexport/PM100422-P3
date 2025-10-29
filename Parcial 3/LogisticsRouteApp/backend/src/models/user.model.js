const { DataTypes } = require('sequelize');
const { encrypt, decrypt } = require('../utils/encryption');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
      // Encrypt full name before saving
      set(value) {
        if (value) {
          this.setDataValue('fullName', encrypt(value));
        }
      },
      // Decrypt full name when reading
      get() {
        const rawValue = this.getDataValue('fullName');
        return rawValue ? decrypt(rawValue) : null;
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
      // Email se mantiene sin encriptar para búsquedas y login
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      // Encrypt phone before saving
      set(value) {
        if (value) {
          this.setDataValue('phone', encrypt(value));
        }
      },
      // Decrypt phone when reading
      get() {
        const rawValue = this.getDataValue('phone');
        return rawValue ? decrypt(rawValue) : null;
      }
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: false,
      // Encrypt company name before saving
      set(value) {
        if (value) {
          this.setDataValue('companyName', encrypt(value));
        }
      },
      // Decrypt company name when reading
      get() {
        const rawValue = this.getDataValue('companyName');
        return rawValue ? decrypt(rawValue) : null;
      }
    },
    companyRole: {
      type: DataTypes.STRING,
      allowNull: true,
      // Encrypt company role before saving
      set(value) {
        if (value) {
          this.setDataValue('companyRole', encrypt(value));
        } else {
          this.setDataValue('companyRole', null);
        }
      },
      // Decrypt company role when reading
      get() {
        const rawValue = this.getDataValue('companyRole');
        return rawValue ? decrypt(rawValue) : null;
      }
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    timestamps: true
  });

  // Method to update last login time
  User.prototype.updateLastLogin = async function() {
    this.lastLogin = new Date();
    return await this.save();
  };

  return User;
};
