# Redirect Logic After Account Creation

## ✅ How Redirects Work

After successfully creating an account, the system automatically redirects users based on their role:

### Customer Account
- **When:** User selects "Customer" role and creates account
- **Redirects to:** `/index.html` (Customer Homepage)
- **Action:** User is taken to the main customer site

### Dealer Account
- **When:** User selects "Dealer" role and creates account
- **Redirects to:** `/dealer` (Dealer Dashboard)
- **Action:** User is taken to the dealer dashboard

## 🔄 Flow Diagram

```
User fills signup form
    ↓
Selects role (Customer or Dealer)
    ↓
Clicks "Create Account"
    ↓
Backend creates account in MongoDB
    ↓
Backend returns: token, role, redirectUrl
    ↓
Frontend stores token in localStorage
    ↓
Frontend redirects based on role:
    • Customer → /index.html
    • Dealer → /dealer
```

## 📋 Implementation Details

### Frontend (auth.js)
```javascript
// After successful signup
if (accountRole === 'customer') {
    redirectUrl = '/index.html'; // Customer homepage
} else if (accountRole === 'dealer') {
    redirectUrl = '/dealer'; // Dealer dashboard
}

// Redirect after 1.5 seconds
setTimeout(() => {
    window.location.href = redirectUrl;
}, 1500);
```

### Backend (server.js)
```javascript
// Determines redirect URL based on role
const redirectUrl = normalizedRole === 'customer' 
    ? '/index.html' 
    : '/dealer';

// Returns in response
return res.json({
    success: true,
    data: {
        token,
        role: normalizedRole,
        userId: user._id,
        redirectUrl  // Customer or Dealer URL
    }
});
```

## ✅ Verification

### Test Customer Account Creation
1. Go to `/auth`
2. Click "Customer" button
3. Fill form and submit
4. ✅ Account created in MongoDB `customers` collection
5. ✅ Redirects to `/index.html` (Customer Homepage)

### Test Dealer Account Creation
1. Go to `/auth`
2. Click "Dealer" button
3. Fill form and submit
4. ✅ Account created in MongoDB `dealers` collection
5. ✅ Redirects to `/dealer` (Dealer Dashboard)

## 🎯 Summary

- ✅ **Customer accounts** → Redirect to `/index.html`
- ✅ **Dealer accounts** → Redirect to `/dealer`
- ✅ Redirect happens automatically after 1.5 seconds
- ✅ Token stored in localStorage for authentication
- ✅ Role stored for future access control

**Everything works automatically based on the user's selected role!** 🚀

