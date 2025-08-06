const cron = require('node-cron');
const nodemailer = require('nodemailer');
const logger = require('../utils/logger.util');
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};
const sendVerificationEmail = async (email, token) => {
  try {
    const transporter = createTransporter();
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Email Verification - Smart Content Curator',
      text: `Welcome to Smart Content Curator!\n\nPlease verify your email address by clicking this link:\n${verificationUrl}\n\nThis link expires in 24 hours.`
    };
    
    await transporter.sendMail(mailOptions);
    logger.log(`Verification email sent successfully to: ${email}`);
    return true;
  } catch (error) {
    logger.log(`Error sending verification email to ${email}: ${error.message}`);
    throw error;
  }
};

function startScheduledTasks() {
  cron.schedule('*/10 * * * *', () => {
    logger.log('Running scheduled post publishing task...');
    
  });

  cron.schedule('0 8 * * *', () => {
    logger.log('Running daily draft reminder task...');
    
  });

  cron.schedule('0 9 * * 1', () => {
    logger.log('Running weekly digest task...');
    
  });
}

module.exports = { 
  startScheduledTasks,
  sendVerificationEmail
};
