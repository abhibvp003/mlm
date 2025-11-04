# SAATHIYA SYSTEM - GUID API Documentation

## Overview
The GUID API provides functionality to generate unique identifiers (GUIDs) and send them via email to users. This system automatically generates GUIDs during user registration and network member creation.

## Features
- ✅ Automatic GUID generation during user registration
- ✅ Automatic GUID generation during network member creation
- ✅ Multiple GUID types (full UUID, short, numeric)
- ✅ Email notifications with beautiful HTML templates
- ✅ Bulk GUID generation for multiple users
- ✅ GUID management and retrieval

## API Endpoints

### 1. Get User GUID Information
**GET** `/api/guid/user/:userId`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "68ea313040f481d2cc8d7ce0",
    "username": "john_doe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "guid": "4662e88b-c0ee-490e-aa03-ee462f26682e",
    "referralCode": "JOHN01"
  }
}
```

### 2. Generate and Send New GUID
**POST** `/api/guid/generate`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "userId": "68ea313040f481d2cc8d7ce0",
  "guidType": "full"  // "full", "short", or "numeric"
}
```

**Response:**
```json
{
  "success": true,
  "message": "GUID generated and email sent successfully",
  "data": {
    "userId": "68ea313040f481d2cc8d7ce0",
    "username": "john_doe",
    "email": "john@example.com",
    "newGuid": "771d07f7-daf5-4ddc-b22c-1d6aaebcb195",
    "guidType": "full",
    "emailMessageId": "message_id_here"
  }
}
```

### 3. Send GUID Email (Existing GUID)
**POST** `/api/guid/send`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "userId": "68ea313040f481d2cc8d7ce0",
  "guidType": "full"
}
```

### 4. Test Email Configuration (Admin Only)
**GET** `/api/guid/test-email`

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

### 5. Bulk GUID Generation (Admin Only)
**POST** `/api/guid/bulk-generate`

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "userIds": ["68ea313040f481d2cc8d7ce0", "68eaa5cde86ae19d50a7f0e8"],
  "guidType": "full"
}
```

## GUID Types

### 1. Full GUID (Default)
- **Format:** Standard UUID v4
- **Example:** `4662e88b-c0ee-490e-aa03-ee462f26682e`
- **Length:** 36 characters

### 2. Short GUID
- **Format:** 8-character alphanumeric
- **Example:** `A1B2C3D4`
- **Length:** 8 characters

### 3. Numeric GUID
- **Format:** 8-digit number
- **Example:** `12345678`
- **Length:** 8 characters

## Email Configuration

### Environment Variables
Add these to your `config.env` file:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=http://localhost:3000
```

### Gmail Setup
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
3. Use the app password in `EMAIL_PASS`

### Other Email Providers
- **Outlook/Hotmail:** `smtp-mail.outlook.com:587`
- **Yahoo:** `smtp.mail.yahoo.com:587`
- **Custom SMTP:** Configure according to your provider

## Automatic GUID Generation

### During Registration
When a user registers via `/api/auth/register`, the system automatically:
1. Generates a unique GUID
2. Saves it to the user record
3. Sends a welcome email with the GUID
4. Returns the GUID in the response

### During Network Member Creation
When adding a network member via `/api/network/add-member`, the system automatically:
1. Generates a unique GUID
2. Saves it to the new user record
3. Sends a welcome email with the GUID
4. Returns the GUID in the response

## Email Templates

### Welcome Email Features
- 🎨 Beautiful HTML design with gradients
- 📱 Mobile-responsive layout
- ⚡ SAATHIYA SYSTEM branding
- 📋 User account details
- 🔗 Dashboard access link
- ⚠️ Security reminders

### Email Content Includes
- User's unique GUID
- Account information
- Welcome message
- Next steps
- Dashboard access link
- Security information

## Error Handling

### Common Errors
1. **Email Configuration Issues**
   - Invalid credentials
   - SMTP server connection failed
   - Authentication failed

2. **User Not Found**
   - Invalid user ID
   - User doesn't exist

3. **GUID Generation Issues**
   - Duplicate GUID (automatically retried)
   - Database connection issues

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## Security Features

- 🔐 JWT authentication required for all endpoints
- 👑 Admin-only endpoints for bulk operations
- 🛡️ Input validation and sanitization
- 🔒 Secure email transmission
- 📝 Comprehensive logging

## Usage Examples

### Test the API
```bash
# 1. Login to get token
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'

# 2. Get user GUID
curl -X GET http://localhost:5001/api/guid/user/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Generate new GUID and send email
curl -X POST http://localhost:5001/api/guid/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID","guidType":"full"}'
```

## Database Schema

### User Model Updates
```javascript
{
  // ... existing fields
  guid: {
    type: String,
    unique: true,
    required: false
  }
  // ... other fields
}
```

## Dependencies

- `uuid@8.3.2` - GUID generation
- `nodemailer` - Email sending
- `express` - API framework
- `mongoose` - Database ORM

## Support

For issues or questions:
1. Check the server logs for detailed error messages
2. Verify email configuration
3. Test email connection using `/api/guid/test-email`
4. Ensure proper authentication tokens

---

**SAATHIYA SYSTEM** - Multi-Level Marketing Platform
© 2024 All rights reserved.
