const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../utils/logger');

// Generate a random OTP of specified length
exports.generateOTP = (length = 4) => {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  
  return otp;
};

// Create a Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: {
    user: config.email.user,
    pass: config.email.password
  }
});

// Send OTP email
exports.sendOTPEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: `LogisticRoute <${config.email.user}>`,
      to: email,
      subject: 'Código de verificación para LogisticRoute',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <div style="background-color: #0047AB; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">LogisticRoute</h1>
          </div>
          <div style="padding: 20px;">
            <h2>Tu código de verificación</h2>
            <p>Usa el siguiente código para completar la verificación:</p>
            <div style="background-color: #f5f5f5; font-size: 24px; font-weight: bold; text-align: center; padding: 20px; margin: 20px 0; letter-spacing: 5px; border-radius: 5px;">
              ${otp}
            </div>
            <p>Este código expirará en 10 minutos.</p>
            <p>Si no solicitaste este código, puedes ignorar este correo.</p>
          </div>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px;">
            &copy; ${new Date().getFullYear()} LogisticRoute. Todos los derechos reservados.
          </div>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    logger.info(`OTP email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};
