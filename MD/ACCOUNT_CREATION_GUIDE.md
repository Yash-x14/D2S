# Account Creation Guide - Role-Based Signup

## ✅ How Account Creation Works

When you fill out the signup form on the login page, the system automatically creates the account in the correct MongoDB collection based on your selected role.

## 📋 Step-by-Step Process

### 1. **Select Your Role**
   - Click **"Customer"** button → Creates account as Customer
   - Click **"Dealer"** button → Creates account as Dealer

### 2. **Fill Form Details**
   - **For Customer:** Enter your Name, Email, Password
   - **For Dealer:** Enter your Company Name, Email, Password

### 3. **Submit Form**
   - Click "Create Account" button
   - System automatically:
     - ✅ Detects selected role
     - ✅ Sends data to `/api/signup` endpoint
     - ✅ Backend saves to correct MongoDB collection
     - ✅ Returns JWT token and redirect URL
     - ✅ Redirects to appropriate dashboard

## 🔍 What Happens Behind the Scenes

### Frontend (auth.js)
```javascript
// 1. User selects role
selectRole('customer') or selectRole('dealer')

// 2. Form submission
handleSignup() {
  - Gets selected role from form
  - Prepares data (name/companyName based on role)
  - Sends to /api/signup endpoint
  - Receives response with token and redirectUrl
  - Stores token in localStorage
  - Redirects to appropriate page
}
```

### Backend (server.js)
```javascript
// POST /api/signup
{
  - Receives: email, password, role, name/companyName
  - Validates role (customer or dealer)
  - Selects MongoDB model:
    * Customer role → Customer model → customers collection
    * Dealer role → Dealer model → dealers collection
  - Checks for duplicate email
  - Hashes password with bcrypt
  - Creates user in MongoDB
  - Generates JWT token
  - Returns: token, role, userId, redirectUrl
}
```

## 📊 MongoDB Collections

### customers Collection
**Created when:** User selects "Customer" role
**Stores:**
```javascript
{
  email: "customer@example.com",
  passwordHash: "$2a$10$...",
  name: "John Doe",
  createdAt: Date,
  updatedAt: Date
}
```

### dealers Collection
**Created when:** User selects "Dealer" role
**Stores:**
```javascript
{
  email: "dealer@example.com",
  passwordHash: "$2a$10$...",
  companyName: "ABC Company",
  createdAt: Date,
  updatedAt: Date
}
```

## ✅ Verification

### Console Logs (Frontend)
When you sign up, check browser console:
```
=== Account Registration ===
Selected Role: customer
Account Type: CUSTOMER
Will create account in MongoDB: customers collection
...
=== Registration Successful ===
Account created in MongoDB: customer
User ID: ...
Token received: Yes
```

### Server Logs (Backend)
Check server terminal:
```
=== Account Signup Request ===
Received role: customer
Creating account as: CUSTOMER
Will save to MongoDB collection: customers
Saving to MongoDB...
✅ Account created successfully!
   Collection: customers
   User ID: ...
   Email: customer@example.com
```

## 🧪 Test Examples

### Create Customer Account
1. Go to `/auth`
2. Click "Customer" button
3. Fill:
   - Name: "John Doe"
   - Email: "john@example.com"
   - Password: "test123"
4. Click "Create Account"
5. ✅ Account saved in `customers` collection
6. ✅ Redirects to `/main-site/home`

### Create Dealer Account
1. Go to `/auth`
2. Click "Dealer" button
3. Fill:
   - Company Name: "ABC Company"
   - Email: "abc@example.com"
   - Password: "test123"
4. Click "Create Account"
5. ✅ Account saved in `dealers` collection
6. ✅ Redirects to `/dealer-site/dashboard`

## ✅ System Status

- ✅ Role selection working
- ✅ Form data correctly formatted
- ✅ Backend saves to correct collection
- ✅ Token generation working
- ✅ Redirect URLs correct
- ✅ All data stored in MongoDB Atlas

## 🎯 Summary

The system automatically:
1. Detects your selected role (Customer/Dealer)
2. Uses the correct field name (name/companyName)
3. Saves to the correct MongoDB collection
4. Generates authentication token
5. Redirects to the appropriate dashboard

**Everything works automatically based on your role selection!** 🚀

