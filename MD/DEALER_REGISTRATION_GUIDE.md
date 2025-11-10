# Dealer Registration Guide

## ✅ Dealer Sign Up Flow

When you click the **Dealer** button and fill in the sign-up form, the system will:

1. ✅ **Capture the selected role** - "dealer" is set when you click the Dealer button
2. ✅ **Collect form data** - Company Name (from Name field), Email, Password
3. ✅ **Validate the data** - Email format, password length, required fields
4. ✅ **Send to backend** - POST request to `/api/register` endpoint
5. ✅ **Save to MongoDB Atlas** - Data stored in `dealers` collection
6. ✅ **Return success** - JWT token and redirect to dealer dashboard

## 📋 Step-by-Step Process

### 1. User Action
- Click **"Dealer"** button in the role selector
- Notice: The label changes to "Company Name"
- Fill in:
  - Company Name (required) - Label changes automatically when Dealer is selected
  - Email (required, validated format)
  - Password (required, minimum 6 characters)
- Check "I have read the privacy and terms and conditions"
- Click **"Create Account"** button

### 2. Frontend Processing
```javascript
// Role is set to "dealer"
role: "dealer"

// Data sent to backend
{
  companyName: "Your Company Name",
  email: "dealer@example.com",
  password: "password123",
  role: "dealer"
}
```

### 3. Backend Processing
```javascript
// Backend receives request at POST /api/register
// Validates role is "dealer"
// Checks if email already exists
// Hashes password using bcrypt
// Creates new dealer document in MongoDB
```

### 4. MongoDB Storage
```javascript
// Document saved in "dealers" collection
{
  _id: ObjectId("..."),
  email: "dealer@example.com",
  passwordHash: "$2a$10$...",
  companyName: "Your Company Name",
  createdAt: ISODate("2024-01-15T10:30:00Z"),
  updatedAt: ISODate("2024-01-15T10:30:00Z")
}
```

### 5. Response & Redirect
```javascript
// Success response
{
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  role: "dealer",
  userId: "..."
}

// User redirected to: /dealer (dealer dashboard)
```

## 🔍 Verification Steps

### Check Browser Console
1. Open browser developer tools (F12)
2. Go to Console tab
3. Look for:
   - "Role selected for signup: dealer"
   - "Registering user with role: dealer"
   - "Form data: {companyName: '...', email: '...', role: 'dealer'}"
   - "Registration successful: {token: '...', role: 'dealer'}"

### Check MongoDB Atlas
1. Log in to MongoDB Atlas
2. Navigate to your cluster
3. Click "Browse Collections"
4. Select your database (default: `d2s0001`)
5. Open `dealers` collection
6. Verify the new dealer document appears with:
   - Email address
   - Company Name
   - Hashed password (not plain text)
   - Timestamps (createdAt, updatedAt)

### Test Registration
```bash
# Test with curl
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Test Dealer Company",
    "email": "testdealer@example.com",
    "password": "test123",
    "role": "dealer"
  }'
```

## ✅ Features

- ✅ Role selection (Customer/Dealer toggle)
- ✅ Dynamic label change (Name → Company Name for dealers)
- ✅ Form validation
- ✅ Email format validation
- ✅ Password strength (minimum 6 characters)
- ✅ Duplicate email check
- ✅ Secure password hashing (bcrypt)
- ✅ JWT token generation
- ✅ Automatic redirect to dealer dashboard
- ✅ Error handling with user-friendly messages

## 🎯 Dynamic Label Feature

When you select "Dealer" role:
- Label changes from "Name" to "Company Name"
- Placeholder changes from "Your Name" to "Your Company Name"

When you select "Customer" role:
- Label changes back to "Name"
- Placeholder changes back to "Your Name"

## 🐛 Troubleshooting

### Issue: Data not saving to MongoDB
- **Check:** Backend server is running
- **Check:** MongoDB connection string in `.env` file
- **Check:** Network tab in browser for API errors
- **Check:** Server console for error messages

### Issue: Role not set correctly
- **Check:** Dealer button is clicked (should show as active)
- **Check:** Browser console for "Role selected" message
- **Check:** Hidden input field `signup-role` has value "dealer"

### Issue: Company Name not saving
- **Check:** Label shows "Company Name" when Dealer is selected
- **Check:** Form data includes `companyName` field (not `name`)
- **Check:** Backend receives `companyName` in request body

### Issue: Email already exists error
- **Solution:** Use a different email address
- **Check:** MongoDB Atlas to see if email already registered

### Issue: Validation errors
- **Check:** All required fields are filled
- **Check:** Email format is correct (example@domain.com)
- **Check:** Password is at least 6 characters

## 📊 Data Flow Diagram

```
User clicks "Dealer" button
    ↓
Role set to "dealer"
Label changes to "Company Name"
    ↓
User fills form and clicks "Create Account"
    ↓
Frontend validates data
    ↓
POST /api/register with {companyName, email, password, role: "dealer"}
    ↓
Backend validates role and email
    ↓
Password hashed with bcrypt
    ↓
Dealer document created in MongoDB
    ↓
JWT token generated
    ↓
Response sent to frontend
    ↓
Token stored in localStorage
    ↓
User redirected to /dealer (dealer dashboard)
```

## ✅ Confirmation

The dealer registration flow is **fully functional** and will:
- ✅ Save dealer data to MongoDB Atlas
- ✅ Store company name correctly
- ✅ Hash passwords securely
- ✅ Generate authentication tokens
- ✅ Redirect to dealer dashboard
- ✅ Handle errors gracefully

You can now test the dealer registration by:
1. Going to `http://localhost:3000/auth`
2. Clicking "Dealer" button (label changes to "Company Name")
3. Filling in the form with company name
4. Clicking "Create Account"
5. Verifying data in MongoDB Atlas `dealers` collection

