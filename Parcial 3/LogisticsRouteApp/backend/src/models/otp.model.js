const { DataTypes } = require('sequelize');
const { hash, compareHash } = require('../utils/encryption');

module.exports = (sequelize) => {
  const OTP = sequelize.define('OTP', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    otp: {
      type: DataTypes.STRING,
      allowNull: false
      // OTP will be hashed before saving (see hook below)
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    isUsed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    timestamps: true,
    hooks: {
      // Hash OTP before creating record
      beforeCreate: async (otpRecord) => {
        if (otpRecord.otp) {
          otpRecord.otp = await hash(otpRecord.otp);
        }
      }
    }
  });

  // Check if OTP is valid
  OTP.prototype.isValid = function() {
    const now = new Date();
    return !this.isUsed && now < this.expiresAt;
  };

  // Verify OTP matches the hashed value
  OTP.prototype.verifyOTP = async function(plainOTP) {
    return await compareHash(plainOTP, this.otp);
  };

  // Mark OTP as used
  OTP.prototype.markAsUsed = async function() {
    this.isUsed = true;
    return await this.save();
  };

  return OTP;
};
