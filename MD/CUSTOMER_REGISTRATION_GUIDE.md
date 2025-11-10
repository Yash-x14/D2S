# Customer Registration Guide

## ✅ Customer Sign Up Flow

When you click the **Customer** button and fill in the sign-up form, the system will:

1. ✅ **Capture the selected role** - "customer" is set when you click the Customer button
2. ✅ **Collect form data** - Name, Email, Password
3. ✅ **Validate the data** - Email format, password length, required fields
4. ✅ **Send to backend** - POST request to `/api/register` endpoint
5. ✅ **Save to MongoDB Atlas** - Data stored in `customers` collection
6. ✅ **Return success** - JWT token and redirect to customer homepage

## 📋 Step-by-Step Process

### 1. User Action
- Click **"Customer"** button in the role selector
- Fill in:
  - Name (required)
  - Email (required, validated format)
  - Password (required, minimum 6 characters)
- Check "I have read the privacy and terms and conditions"
- Click **"Create Account"** button

### 2. Frontend Processing
```javascript
// Role is set to "customer"
role: "customer"

// Data sent to backend
{
  name: "John Doe",
  email: "john@example.com",
  password: "password123",
  role: "customer"
}
```

### 3. Backend Processing
```javascript
// Backend receives request at POST /api/register
// Validates role is "customer"
// Checks if email already exists
// Hashes password using bcrypt
// Creates new customer document in MongoDB
```

### 4. MongoDB Storage
```javascript
// Document saved in "customers" collection
{
  _id: ObjectId("..."),
  email: "john@example.com",
  passwordHash: "$2a$10$...",
  name: "John Doe",
  createdAt: ISODate("2024-01-15T10:30:00Z"),
  updatedAt: ISODate("2024-01-15T10:30:00Z")
}
```

### 5. Response & Redirect
```javascript
// Success response
{
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  role: "customer",
  userId: "..."
}

// User redirected to: /index.html (customer homepage)
```

## 🔍 Verification Steps

### Check Browser Console
1. Open browser developer tools (F12)
2. Go to Console tab
3. Look for:
   - "Role selected for signup: customer"
   - "Registering user with role: customer"
   - "Form data: {name: '...', email: '...', role: 'customer'}"
   - "Registration successful: {token: '...', role: 'customer'}"

### Check MongoDB Atlas
1. Log in to MongoDB Atlas
2. Navigate to your cluster
3. Click "Browse Collections"
4. Select your database (default: `d2s0001`)
5. Open `customers` collection
6. Verify the new customer document appears with:
   - Email address
   - Name
   - Hashed password (not plain text)
   - Timestamps (createdAt, updatedAt)

### Test Registration
```bash
# Test with curl
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "email": "testcustomer@example.com",
    "password": "test123",
    "role": "customer"
  }'
```

## ✅ Features

- ✅ Role selection (Customer/Dealer toggle)
- ✅ Form validation
- ✅ Email format validation
- ✅ Password strength (minimum 6 characters)
- ✅ Duplicate email check
- ✅ Secure password hashing (bcrypt)
- ✅ JWT token generation
- ✅ Automatic redirect after registration
- ✅ Error handling with user-friendly messages

## 🐛 Troubleshooting

### Issue: Data not saving to MongoDB
- **Check:** Backend server is running
- **Check:** MongoDB connection string in `.env` file
- **Check:** Network tab in browser for API errors
- **Check:** Server console for error messages

### Issue: Role not set correctly
- **Check:** Customer button is clicked (should show as active)
- **Check:** Browser console for "Role selected" message
- **Check:** Hidden input field `signup-role` has value "customer"

### Issue: Email already exists error
- **Solution:** Use a different email address
- **Check:** MongoDB Atlas to see if email already registered

### Issue: Validation errors
- **Check:** All required fields are filled
- **Check:** Email format is correct (example@domain.com)
- **Check:** Password is at least 6 characters

## 📊 Data Flow Diagram

```
User clicks "Customer" button
    ↓
Role set to "customer"
    ↓
User fills form and clicks "Create Account"
    ↓
Frontend validates data
    ↓
POST /api/register with {name, email, password, role: "customer"}
    ↓
Backend validates role and email
    ↓
Password hashed with bcrypt
    ↓
Customer document created in MongoDB
    ↓
JWT token generated
    ↓
Response sent to frontend
    ↓
Token stored in localStorage
    ↓
User redirected to /index.html
```

## ✅ Confirmation

The customer registration flow is **fully functional** and will:
- ✅ Save customer data to MongoDB Atlas
- ✅ Hash passwords securely
- ✅ Generate authentication tokens
- ✅ Redirect to customer homepage
- ✅ Handle errors gracefully

You can now test the customer registration by:
1. Going to `http://localhost:3000/auth`
2. Clicking "Customer" button
3. Filling in the form
4. Clicking "Create Account"
5. Verifying data in MongoDB Atlas

