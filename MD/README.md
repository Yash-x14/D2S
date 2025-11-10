# Complete Authentication System - E-Commerce Platform

## 🎯 Project Overview

A full-stack e-commerce platform with dual frontend sites (Customer and Dealer) and a unified authentication system using Node.js, Express, MongoDB Atlas, and JWT.

## 📁 Project Structure

```
D2S/
├── backend/                    # Node.js + Express Backend
│   ├── src/
│   │   ├── models/            # MongoDB Models
│   │   ├── middleware/        # Auth Middleware
│   │   └── seed.js           # Database Seeder
│   ├── server.js              # Main Server File
│   ├── package.json
│   └── .env                   # Environment Variables
│
├── frontend/                   # Main-site (Customer Frontend)
│   ├── index.html             # Homepage
│   ├── auth.html              # Login/Signup Page
│   ├── auth.js                # Auth Logic
│   └── ...
│
└── Dealer/                     # Dealer-site (Dealer Frontend)
    ├── index1.html            # Dealer Dashboard
    └── ...
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Create `backend/.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/d2s0001
JWT_SECRET=your_super_secret_jwt_key_change_me_in_production
PORT=3000
```

### 3. Seed Database (Optional)

```bash
npm run seed
```

### 4. Start Server

```bash
npm start        # Production
npm run dev      # Development (auto-reload)
```

## 🔐 Authentication System

### Signup Endpoint
**POST** `/api/signup`

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "role": "customer"  // or "dealer"
}
```

### Login Endpoint
**POST** `/api/login`

```json
{
  "email": "john@example.com",
  "password": "securepassword123",
  "role": "customer"  // or "dealer"
}
```

### Response Format
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "role": "customer",
    "userId": "...",
    "redirectUrl": "/main-site/home"
  }
}
```

## 🌐 Access URLs

- **Main-site Home:** `http://localhost:3000/main-site/home`
- **Dealer Dashboard:** `http://localhost:3000/dealer-site/dashboard`
- **Login/Signup:** `http://localhost:3000/auth`
- **Dealer Login:** `http://localhost:3000/auth?role=dealer`

## 📊 MongoDB Collections

- `customers` - Customer accounts
- `dealers` - Dealer accounts
- `products` - Product catalog
- `orders` - Customer orders
- `contacts` - Contact submissions

## ✅ Features

- ✅ Role-based authentication (Customer/Dealer)
- ✅ Secure password hashing (bcrypt)
- ✅ JWT token authentication
- ✅ MongoDB Atlas integration
- ✅ Role-based redirects
- ✅ Protected routes
- ✅ Error handling
- ✅ Form validation

## 🧪 Test Credentials

- **Customer:** `customer@example.com` / `Password123!`
- **Dealer:** `dealer@example.com` / `Password123!`

## 📝 API Documentation

See `AUTHENTICATION_SYSTEM_COMPLETE.md` for detailed API documentation.

## 🔧 Troubleshooting

- **MongoDB Connection:** Check `.env` file for correct connection string
- **Port Issues:** Ensure port 3000 is available
- **CORS Errors:** Verify CORS configuration in `server.js`
- **Token Issues:** Check JWT_SECRET in `.env` file

