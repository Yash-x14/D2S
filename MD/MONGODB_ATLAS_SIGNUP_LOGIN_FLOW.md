# MongoDB Atlas Signup & Login Flow

## ✅ Complete Flow: Account Creation → MongoDB Atlas → Login

This document explains how user data flows from account creation to MongoDB Atlas storage, and then how users can login with the same credentials.

## 📋 Step-by-Step Flow

### 1. Account Creation (Signup)

#### User Action:
1. User visits `/auth`
2. Selects role (Customer or Dealer)
3. Fills form:
   - Name/Company Name
   - Email
   - Password
4. Clicks "Create Account"

#### Backend Process:
```
POST /api/signup
    ↓
1. Receives: email, password, role, name/companyName
    ↓
2. Validates role (customer or dealer)
    ↓
3. Selects MongoDB Model:
   - Customer → Customer model → customers collection
   - Dealer → Dealer model → dealers collection
    ↓
4. Checks if email already exists
    ↓
5. Hashes password with bcrypt (10 salt rounds)
    ↓
6. Saves to MongoDB Atlas:
   {
     email: "user@example.com",
     passwordHash: "$2a$10$...",
     name: "John Doe" (for customer) OR
     companyName: "ABC Company" (for dealer),
     createdAt: Date,
     updatedAt: Date
   }
    ↓
7. Returns: token, role, userId, redirectUrl
```

#### What Gets Saved in MongoDB Atlas:

**Customer Account:**
```javascript
{
  _id: ObjectId("..."),
  email: "customer@example.com",
  passwordHash: "$2a$10$hashed_password_here",
  name: "John Doe",
  createdAt: ISODate("2024-01-01T00:00:00.000Z"),
  updatedAt: ISODate("2024-01-01T00:00:00.000Z")
}
```

**Dealer Account:**
```javascript
{
  _id: ObjectId("..."),
  email: "dealer@example.com",
  passwordHash: "$2a$10$hashed_password_here",
  companyName: "ABC Company",
  createdAt: ISODate("2024-01-01T00:00:00.000Z"),
  updatedAt: ISODate("2024-01-01T00:00:00.000Z")
}
```

### 2. Login with Same Credentials

#### User Action:
1. User visits `/auth`
2. Selects role (Customer or Dealer)
3. Enters the **same email and password** used during signup
4. Clicks "Sign In"

#### Backend Process:
```
POST /api/login
    ↓
1. Receives: email, password, role
    ↓
2. Determines collection:
   - Customer → customers collection
   - Dealer → dealers collection
    ↓
3. Looks up user in MongoDB Atlas:
   Model.findOne({ email: email })
    ↓
4. If user found:
   - Retrieves stored passwordHash
   - Compares provided password with stored hash using bcrypt
    ↓
5. If password matches:
   - Generates JWT token
   - Returns: token, role, userId, redirectUrl
    ↓
6. If password doesn't match:
   - Returns error: "Invalid credentials"
```

## 🔐 Security Features

### Password Hashing
- **Algorithm:** bcrypt
- **Salt Rounds:** 10
- **Storage:** Only hashed password stored, never plain text
- **Verification:** bcrypt.compare() used to verify login passwords

### Data Storage
- **Database:** MongoDB Atlas (Cloud)
- **Collections:**
  - `customers` - Customer accounts
  - `dealers` - Dealer accounts
- **Unique Email:** Each email can only be used once per role

## ✅ Verification Steps

### Test Complete Flow:

#### 1. Create Account
```bash
1. Go to: http://localhost:3000/auth
2. Click "Customer" (or "Dealer")
3. Fill form:
   - Name/Company: "Test User"
   - Email: "test@example.com"
   - Password: "test123"
4. Click "Create Account"
5. ✅ Check server console - should show:
   "💾 Saving to MongoDB Atlas..."
   "✅ Account saved successfully in MongoDB Atlas!"
   "Collection: customers" (or "dealers")
   "✅ User can now login with this email and password"
```

#### 2. Verify in MongoDB Atlas
```bash
1. Open MongoDB Atlas dashboard
2. Navigate to your database
3. Check collection:
   - customers (for customer accounts)
   - dealers (for dealer accounts)
4. ✅ Should see the new user document with:
   - email
   - passwordHash (hashed)
   - name/companyName
   - createdAt, updatedAt
```

#### 3. Login with Same Credentials
```bash
1. Go to: http://localhost:3000/auth
2. Click "Customer" (or "Dealer")
3. Enter:
   - Email: "test@example.com" (same as signup)
   - Password: "test123" (same as signup)
4. Click "Sign In"
5. ✅ Check server console - should show:
   "Looking up user in MongoDB Atlas collection: customers"
   "✅ User found in MongoDB Atlas"
   "Verifying password..."
   "✅ Password verified successfully"
   "✅ Login successful"
6. ✅ Should redirect to appropriate page
```

## 📊 Console Logs

### During Signup:
```
=== Account Signup Request ===
Received role: customer
Email: test@example.com
Creating account as: CUSTOMER
Will save to MongoDB collection: customers
💾 Saving to MongoDB Atlas...
✅ Account saved successfully in MongoDB Atlas!
   Database: MongoDB Atlas
   Collection: customers
   User ID: ...
   Email: test@example.com
   Password: Hashed and stored securely
   Name: Test User
   ✅ User can now login with this email and password
=== Signup Complete ===
```

### During Login:
```
=== Login Request ===
Looking up user in MongoDB Atlas collection: customers
Email: test@example.com
Role: customer
✅ User found in MongoDB Atlas
   User ID: ...
   Email: test@example.com
   Verifying password...
✅ Password verified successfully
✅ Login successful for: CUSTOMER
   Redirect URL: /index.html
```

## 🎯 Summary

✅ **Signup Flow:**
1. User creates account
2. Data saved to MongoDB Atlas
3. Password hashed with bcrypt
4. User can now login

✅ **Login Flow:**
1. User enters email/password
2. System looks up user in MongoDB Atlas
3. Password verified against stored hash
4. User logged in successfully

✅ **Data Persistence:**
- All user data stored in MongoDB Atlas
- Passwords securely hashed
- Email must be unique
- Users can login anytime with same credentials

**The complete flow is working: Signup → MongoDB Atlas → Login!** 🚀

