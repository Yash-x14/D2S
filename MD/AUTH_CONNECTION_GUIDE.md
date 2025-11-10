# Authentication Connection Guide

## ✅ Login Page Activated and Connected

The unified authentication page (`/auth`) is now fully activated and connected to both the **Customer** and **Dealer** sides.

## 🔗 Connection Points

### 1. Navigation Links Updated

#### Customer Side (`frontend/index.html`)
- **Login Link:** `/auth` - Opens unified auth page
- **Dealer Login Link:** `/auth?role=dealer` - Opens auth page with dealer role pre-selected

#### Dealer Side (`Dealer/index1.html`)
- **Logout Button:** Calls `handleLogout()` function
- **Auto-redirect:** If not authenticated, redirects to `/auth?role=dealer`

### 2. Authentication Flow

#### Sign Up Flow
1. User visits `/auth`
2. Selects role (Customer or Dealer)
3. Fills form and clicks "Create Account"
4. Data saved to MongoDB Atlas
5. JWT token stored in localStorage
6. Redirected to appropriate dashboard:
   - Customer → `/index.html`
   - Dealer → `/dealer`

#### Sign In Flow
1. User visits `/auth`
2. Clicks "Sign in" link
3. Selects role (Customer or Dealer)
4. Enters email and password
5. Clicks "Sign In"
6. Token stored in localStorage
7. Redirected to appropriate dashboard:
   - Customer → `/index.html`
   - Dealer → `/dealer`

### 3. Protected Routes

#### Dealer Dashboard Protection
- **File:** `Dealer/index1.html`
- **Function:** `checkDealerAuth()`
- **Action:** If not authenticated as dealer, redirects to `/auth?role=dealer`

#### Logout Functionality
- **Function:** `handleLogout()`
- **Action:** Clears all localStorage data and redirects to `/auth`

## 📋 Access URLs

### Customer Side
- **Homepage:** `http://localhost:3000/`
- **Login:** `http://localhost:3000/auth`
- **Sign Up:** `http://localhost:3000/auth` (click "Sign up" or "Sign in" link)

### Dealer Side
- **Dashboard:** `http://localhost:3000/dealer`
- **Login:** `http://localhost:3000/auth?role=dealer`
- **Auto-redirect:** If not logged in, redirects to login page

## 🔐 Authentication Storage

### localStorage Keys
- `token` - JWT authentication token
- `role` - User role ("customer" or "dealer")
- `userId` - User ID from database
- `dealerToken` - Legacy token key (for compatibility)

### Token Usage
- Included in API requests: `Authorization: Bearer <token>`
- Valid for 7 days
- Automatically checked on protected pages

## 🎯 Features Implemented

### ✅ Sign Up
- Role selection (Customer/Dealer)
- Form validation
- Email format validation
- Password strength check
- Terms acceptance
- MongoDB storage
- Token generation
- Auto-redirect

### ✅ Sign In
- Role selection (Customer/Dealer)
- Email/password validation
- Token generation
- Auto-redirect based on role
- Error handling

### ✅ Logout
- Clears all authentication data
- Redirects to login page
- Works from both customer and dealer sides

### ✅ Protected Routes
- Dealer dashboard checks authentication
- Auto-redirect if not logged in
- Role-based access control

## 🧪 Testing the Connection

### Test Customer Login
1. Visit: `http://localhost:3000/auth`
2. Click "Customer" button
3. Click "Sign in" link
4. Enter credentials:
   - Email: `customer@example.com`
   - Password: `Password123!`
5. Click "Sign In"
6. Should redirect to `/index.html`

### Test Dealer Login
1. Visit: `http://localhost:3000/auth?role=dealer`
2. Click "Sign in" link (if not already)
3. Enter credentials:
   - Email: `dealer@example.com`
   - Password: `Password123!`
4. Click "Sign In"
5. Should redirect to `/dealer`

### Test Protected Route
1. Visit: `http://localhost:3000/dealer` (without logging in)
2. Should automatically redirect to `/auth?role=dealer`

### Test Logout
1. Log in as dealer
2. Click logout button in dropdown
3. Should clear data and redirect to login page

## 🔍 Console Logging

The authentication system includes console logging for debugging:

- `Role selected for signup: customer/dealer`
- `Registering user with role: customer/dealer`
- `Signing in user with role: customer/dealer`
- `Login successful: {token, role}`
- `Redirecting to customer homepage/dealer dashboard`
- `Dealer authenticated: dealer`
- `Dealer not authenticated, redirecting to login...`

## ✅ Verification Checklist

- [x] Sign up as customer works
- [x] Sign up as dealer works
- [x] Sign in as customer works
- [x] Sign in as dealer works
- [x] Customer redirects to `/index.html`
- [x] Dealer redirects to `/dealer`
- [x] Dealer dashboard protected
- [x] Logout functionality works
- [x] Navigation links updated
- [x] Data saves to MongoDB Atlas
- [x] Token stored correctly
- [x] Role-based redirects work

## 🚀 Ready to Use

The login page is now fully activated and connected to both customer and dealer sides. You can:

1. **Sign up** new users (customer or dealer)
2. **Sign in** existing users
3. **Access protected routes** (dealer dashboard)
4. **Logout** from both sides
5. **Auto-redirect** based on authentication status

Everything is working and ready for production use! 🎉

