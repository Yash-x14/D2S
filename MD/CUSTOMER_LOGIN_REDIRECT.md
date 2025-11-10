# Customer Login Redirect - Main-site

## ✅ How Customer Login Works

When a user **creates their account as a CUSTOMER** and then **logs in**, they are automatically redirected to the **main-site** (Customer Homepage).

## 🔄 Login Flow for Customers

### Step 1: User Logs In
- User visits `/auth`
- Selects "Customer" role
- Enters email and password
- Clicks "Sign In"

### Step 2: Backend Verification
- Backend checks credentials in `customers` collection
- Verifies password
- Returns user role: `"customer"`

### Step 3: Frontend Redirect
- Frontend receives role: `"customer"`
- Determines redirect URL: `/index.html` (Main-site)
- Stores token and role in localStorage
- Redirects to Main-site (Customer Homepage)

## 📋 Code Implementation

### Frontend (auth.js)
```javascript
// After successful login
if (accountRole === 'customer') {
    redirectUrl = '/index.html'; // Main-site (Customer Homepage)
    console.log('✅ Customer account detected - Redirecting to MAIN-SITE');
}

// Redirect after 1.5 seconds
setTimeout(() => {
    window.location.href = redirectUrl; // /index.html for customers
}, 1500);
```

### Backend (server.js)
```javascript
// Login endpoint returns role and redirect URL
const redirectUrl = normalizedRole === 'customer' 
    ? '/index.html'  // Main-site for customers
    : '/dealer';     // Dealer dashboard for dealers

return res.json({
    success: true,
    data: {
        token,
        role: 'customer',  // User's account type
        userId: user._id,
        redirectUrl: '/index.html'  // Main-site redirect
    }
});
```

## ✅ Verification Steps

### Test Customer Login
1. **Create Customer Account:**
   - Go to `/auth`
   - Click "Customer" button
   - Fill form and create account
   - Account saved in MongoDB `customers` collection

2. **Login as Customer:**
   - Go to `/auth`
   - Click "Customer" button
   - Enter email and password
   - Click "Sign In"
   - ✅ Should redirect to `/index.html` (Main-site)

### Console Logs
When customer logs in, you'll see:
```
=== Login Successful ===
User role from server: customer
User account type: CUSTOMER (Main-site)
✅ Customer account detected - Redirecting to MAIN-SITE (Customer Homepage)
Stored in localStorage: {
  role: 'customer',
  redirectDestination: 'Main-site'
}
🚀 Redirecting CUSTOMER to: /index.html
   Destination: MAIN-SITE (Customer Homepage)
```

## 🎯 Summary

- ✅ **Customer accounts** → Login redirects to `/index.html` (Main-site)
- ✅ **Dealer accounts** → Login redirects to `/dealer` (Dealer Dashboard)
- ✅ Role is checked from the database (from account creation)
- ✅ Redirect happens automatically based on account type
- ✅ Token stored for authentication

**When a customer logs in, they are automatically taken to the main-site!** 🚀

