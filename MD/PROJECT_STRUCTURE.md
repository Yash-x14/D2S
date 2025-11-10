# Complete Project Structure

## 📁 Folder Structure

```
D2S/
│
├── backend/                          # Node.js + Express Backend
│   ├── src/
│   │   ├── models/
│   │   │   ├── Customer.js          # Customer model
│   │   │   ├── Dealer.js            # Dealer model
│   │   │   ├── Product.js           # Product model
│   │   │   ├── Order.js             # Order model
│   │   │   ├── Contact.js           # Contact model
│   │   │   └── TestSubmission.js    # Test submission model
│   │   ├── middleware/
│   │   │   └── auth.js              # JWT authentication middleware
│   │   └── seed.js                  # Database seed script
│   ├── server.js                    # Main Express server
│   ├── package.json                 # Dependencies
│   ├── package-lock.json
│   └── .env                         # Environment variables
│
├── frontend/                        # Main-site (Customer Frontend)
│   ├── index.html                   # Customer homepage
│   ├── auth.html                    # Login/Signup page
│   ├── auth.js                      # Authentication logic
│   ├── all-products.html            # Product listing
│   ├── cart.html                    # Shopping cart
│   ├── checkout.html                # Checkout page
│   ├── contact.html                 # Contact page
│   ├── login.html                   # Legacy login page
│   ├── test-submission.html         # Test form
│   ├── images/                      # Product images
│   ├── styles.css                   # Main stylesheet
│   ├── script.js                    # Main script
│   └── utils.js                     # Utility functions
│
├── Dealer/                          # Dealer-site (Dealer Frontend)
│   ├── index1.html                  # Dealer dashboard
│   ├── auth.html                    # Dealer login redirect
│   ├── login.html                   # Legacy dealer login
│   ├── admin.html                   # Admin panel
│   ├── dealer-script.js             # Dealer dashboard logic
│   ├── dealer-styles.css            # Dealer styles
│   └── api-config.js                # API configuration
│
└── Documentation Files
    ├── SETUP_SUMMARY.md
    ├── AUTHENTICATION_SYSTEM_COMPLETE.md
    ├── PROJECT_STRUCTURE.md
    └── ...
```

## 🔗 URL Routes

### Customer Side (Main-site)
- Homepage: `http://localhost:3000/` or `http://localhost:3000/main-site/home`
- Login/Signup: `http://localhost:3000/auth`
- All Products: `http://localhost:3000/all-products.html`
- Cart: `http://localhost:3000/cart.html`
- Contact: `http://localhost:3000/contact.html`

### Dealer Side (Dealer-site)
- Dashboard: `http://localhost:3000/dealer` or `http://localhost:3000/dealer-site/dashboard`
- Login/Signup: `http://localhost:3000/auth?role=dealer`

### API Endpoints
- Health: `GET /api/health`
- Signup: `POST /api/signup`
- Login: `POST /api/login`
- Register: `POST /api/register` (alias for signup)
- Products: `GET /api/products`
- Orders: `GET /api/orders`
- Contact: `POST /api/contact/submit`

## 🔐 Authentication Flow

### Signup
1. User selects role (Customer/Dealer)
2. Fills form (Name/Company Name, Email, Password)
3. POST `/api/signup` with role
4. Backend saves to MongoDB (customers or dealers collection)
5. Returns token + redirectUrl
6. Frontend redirects to redirectUrl

### Login
1. User selects role (Customer/Dealer)
2. Enters Email and Password
3. POST `/api/login` with role
4. Backend verifies credentials
5. Returns token + redirectUrl
6. Frontend redirects to redirectUrl

## 📊 MongoDB Collections

- `customers` - Customer accounts
- `dealers` - Dealer accounts
- `products` - Product catalog
- `orders` - Customer orders
- `contacts` - Contact form submissions
- `testsubmissions` - Test form data

