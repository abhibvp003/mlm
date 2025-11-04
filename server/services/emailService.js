const nodemailer = require('nodemailer');
const { generateGUID, generateShortGUID, generateNumericGUID } = require('../utils/guidGenerator');

// Email configuration
const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

/**
 * Send welcome email with GUID to new user
 * @param {Object} userData - User information
 * @param {string} guid - Generated GUID
 * @param {string} guidType - Type of GUID (full, short, numeric)
 */
const sendWelcomeEmailWithGUID = async (userData, guid, guidType = 'full') => {
  try {
    const guidDisplay = guidType === 'short' ? generateShortGUID() : 
                       guidType === 'numeric' ? generateNumericGUID() : 
                       guid;

    const mailOptions = {
      from: `"SAATHIYA SYSTEM" <${emailConfig.auth.user}>`,
      to: userData.email,
      subject: '🎉 Welcome to SAATHIYA SYSTEM - Your Unique ID',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to SAATHIYA SYSTEM</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f4f4f4;
            }
            .container {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 15px;
              padding: 30px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              color: white;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .content {
              background: white;
              padding: 30px;
              border-radius: 10px;
              margin-bottom: 20px;
            }
            .guid-box {
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
              color: white;
              padding: 20px;
              border-radius: 10px;
              text-align: center;
              margin: 20px 0;
              font-size: 24px;
              font-weight: bold;
              letter-spacing: 2px;
            }
            .info-box {
              background: #f8f9fa;
              border-left: 4px solid #667eea;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .footer {
              text-align: center;
              color: white;
              font-size: 14px;
              opacity: 0.8;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 25px;
              margin: 20px 0;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">⚡ SAATHIYA SYSTEM</div>
              <p>Multi-Level Marketing Platform</p>
            </div>
            
            <div class="content">
              <h2>🎉 Welcome ${userData.firstName} ${userData.lastName}!</h2>
              
              <p>Congratulations on joining SAATHIYA SYSTEM! We're excited to have you as part of our network marketing family.</p>
              
              <div class="guid-box">
                Your Unique ID: ${guidDisplay}
              </div>
              
              <div class="info-box">
                <h3>📋 Your Account Details:</h3>
                <ul>
                  <li><strong>Username:</strong> ${userData.username}</li>
                  <li><strong>Email:</strong> ${userData.email}</li>
                  <li><strong>Unique ID:</strong> ${guidDisplay}</li>
                  <li><strong>Join Date:</strong> ${new Date().toLocaleDateString()}</li>
                </ul>
              </div>
              
              <h3>🚀 What's Next?</h3>
              <ul>
                <li>Complete your profile setup</li>
                <li>Explore your dashboard</li>
                <li>Start building your network</li>
                <li>Invite friends and family</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="button">
                  Access Your Dashboard
                </a>
              </div>
              
              <p><strong>Important:</strong> Keep your Unique ID safe. You'll need it for account verification and support requests.</p>
            </div>
            
            <div class="footer">
              <p>© 2024 SAATHIYA SYSTEM. All rights reserved.</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to SAATHIYA SYSTEM!
        
        Hello ${userData.firstName} ${userData.lastName},
        
        Congratulations on joining SAATHIYA SYSTEM! We're excited to have you as part of our network marketing family.
        
        Your Unique ID: ${guidDisplay}
        
        Account Details:
        - Username: ${userData.username}
        - Email: ${userData.email}
        - Unique ID: ${guidDisplay}
        - Join Date: ${new Date().toLocaleDateString()}
        
        What's Next?
        - Complete your profile setup
        - Explore your dashboard
        - Start building your network
        - Invite friends and family
        
        Access your dashboard: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard
        
        Important: Keep your Unique ID safe. You'll need it for account verification and support requests.
        
        © 2024 SAATHIYA SYSTEM. All rights reserved.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId, guid: guidDisplay };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send GUID update email to existing user
 * @param {Object} userData - User information
 * @param {string} newGuid - New generated GUID
 */
const sendGUIDUpdateEmail = async (userData, newGuid) => {
  try {
    const mailOptions = {
      from: `"SAATHIYA SYSTEM" <${emailConfig.auth.user}>`,
      to: userData.email,
      subject: '🔄 Your SAATHIYA SYSTEM Unique ID Has Been Updated',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>GUID Updated - SAATHIYA SYSTEM</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f4f4f4;
            }
            .container {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 15px;
              padding: 30px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              color: white;
              margin-bottom: 30px;
            }
            .content {
              background: white;
              padding: 30px;
              border-radius: 10px;
              margin-bottom: 20px;
            }
            .guid-box {
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
              color: white;
              padding: 20px;
              border-radius: 10px;
              text-align: center;
              margin: 20px 0;
              font-size: 24px;
              font-weight: bold;
              letter-spacing: 2px;
            }
            .warning-box {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              color: #856404;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔄 GUID Updated</h1>
              <p>SAATHIYA SYSTEM</p>
            </div>
            
            <div class="content">
              <h2>Hello ${userData.firstName}!</h2>
              
              <p>Your Unique ID has been successfully updated in SAATHIYA SYSTEM.</p>
              
              <div class="guid-box">
                New Unique ID: ${newGuid}
              </div>
              
              <div class="warning-box">
                <strong>⚠️ Important:</strong> Please update your records with the new Unique ID. 
                The old ID is no longer valid.
              </div>
              
              <p>If you didn't request this change, please contact our support team immediately.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('GUID update email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending GUID update email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Test email configuration
 */
const testEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log('Email server connection verified successfully');
    return { success: true, message: 'Email server connection verified' };
  } catch (error) {
    console.error('Email server connection failed:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendWelcomeEmailWithGUID,
  sendGUIDUpdateEmail,
  testEmailConnection,
  generateGUID,
  generateShortGUID,
  generateNumericGUID
};
