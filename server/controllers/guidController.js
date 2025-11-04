const User = require('../models/User');
const { 
  sendWelcomeEmailWithGUID, 
  sendGUIDUpdateEmail,
  generateGUID,
  generateShortGUID,
  generateNumericGUID,
  testEmailConnection
} = require('../services/emailService');

/**
 * Generate and send GUID email to a specific user
 */
const generateAndSendGUID = async (req, res) => {
  try {
    const { userId, guidType = 'full' } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new GUID based on type
    let newGuid;
    switch (guidType) {
      case 'short':
        newGuid = generateShortGUID();
        break;
      case 'numeric':
        newGuid = generateNumericGUID();
        break;
      default:
        newGuid = generateGUID();
    }

    // Update user's GUID
    user.guid = newGuid;
    await user.save();

    // Send email with new GUID
    const emailResult = await sendWelcomeEmailWithGUID({
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    }, newGuid, guidType);

    if (emailResult.success) {
      res.json({
        success: true,
        message: 'GUID generated and email sent successfully',
        data: {
          userId: user._id,
          username: user.username,
          email: user.email,
          newGuid: newGuid,
          guidType: guidType,
          emailMessageId: emailResult.messageId
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'GUID generated but email failed to send',
        data: {
          userId: user._id,
          newGuid: newGuid,
          guidType: guidType
        },
        error: emailResult.error
      });
    }
  } catch (error) {
    console.error('Error generating and sending GUID:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Send GUID email to existing user (without generating new GUID)
 */
const sendGUIDEmail = async (req, res) => {
  try {
    const { userId, guidType = 'full' } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.guid) {
      return res.status(400).json({
        success: false,
        message: 'User does not have a GUID assigned'
      });
    }

    // Send email with existing GUID
    const emailResult = await sendWelcomeEmailWithGUID({
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    }, user.guid, guidType);

    if (emailResult.success) {
      res.json({
        success: true,
        message: 'GUID email sent successfully',
        data: {
          userId: user._id,
          username: user.username,
          email: user.email,
          guid: user.guid,
          guidType: guidType,
          emailMessageId: emailResult.messageId
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send GUID email',
        error: emailResult.error
      });
    }
  } catch (error) {
    console.error('Error sending GUID email:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get user's GUID information
 */
const getUserGUID = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find the user
    const user = await User.findById(userId).select('username email firstName lastName guid referralCode');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        userId: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        guid: user.guid,
        referralCode: user.referralCode
      }
    });
  } catch (error) {
    console.error('Error getting user GUID:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Test email configuration
 */
const testEmail = async (req, res) => {
  try {
    const result = await testEmailConnection();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Email configuration is working correctly',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Email configuration test failed',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error testing email configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Generate GUID for multiple users
 */
const generateBulkGUID = async (req, res) => {
  try {
    const { userIds, guidType = 'full' } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array is required'
      });
    }

    const results = [];
    const errors = [];

    for (const userId of userIds) {
      try {
        const user = await User.findById(userId);
        if (!user) {
          errors.push({ userId, error: 'User not found' });
          continue;
        }

        // Generate new GUID
        let newGuid;
        switch (guidType) {
          case 'short':
            newGuid = generateShortGUID();
            break;
          case 'numeric':
            newGuid = generateNumericGUID();
            break;
          default:
            newGuid = generateGUID();
        }

        // Update user's GUID
        user.guid = newGuid;
        await user.save();

        // Send email
        const emailResult = await sendWelcomeEmailWithGUID({
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }, newGuid, guidType);

        results.push({
          userId: user._id,
          username: user.username,
          email: user.email,
          newGuid: newGuid,
          emailSent: emailResult.success,
          emailError: emailResult.error
        });
      } catch (error) {
        errors.push({ userId, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `Processed ${userIds.length} users`,
      data: {
        results,
        errors,
        summary: {
          total: userIds.length,
          successful: results.length,
          failed: errors.length
        }
      }
    });
  } catch (error) {
    console.error('Error in bulk GUID generation:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  generateAndSendGUID,
  sendGUIDEmail,
  getUserGUID,
  testEmail,
  generateBulkGUID
};
