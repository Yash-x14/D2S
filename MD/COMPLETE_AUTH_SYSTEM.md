# Complete Authentication System - Implementation Guide

## ✅ System Overview

A complete authentication system with role-based access (Customer/Dealer) using Node.js, Express, MongoDB Atlas, and JWT.

## 📁 Project Structure

```
D2S/
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   ├── Customer.js
│   │   │   └── Dealer.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   └── seed.js
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── frontend/ (Main-site - Customer Frontend)
│   ├── index.html
│   ├── auth.html
│   └── auth.js
│
└── Dealer/ (Dealer-site - Dealer Frontend)
    ├── index1.html
    └── ...
```

## 🔐 API Endpoints

### POST /api/signup
Register new user with role selection.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "role": "customer"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "role": "customer",
    "userId": "...",
    "redirectUrl": "/main-site/home"
  }
}
```

### POST /api/login
Login with credentials and get redirect URL.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123",
  "role": "customer"
}
```

**Response (200):**
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

## 🔄 Role-Based Redirects

- **Customer:** `/main-site/home`
- **Dealer:** `/dealer-site/dashboard`

## 🚀 Setup Instructions

### 1. Environment Variables (.env)

Create `backend/.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/d2s0001
JWT_SECRET=your_super_secret_jwt_key_change_me
PORT=3000
```

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Start Server

```bash
npm start        # Production
npm run dev      # Development (with nodemon)
```

### 4. Seed Database (Optional)

```bash
npm run seed
```

Creates test users:
- Customer: `customer@example.com` / `Password123!`
- Dealer: `dealer@example.com` / `Password123!`

## 📊 MongoDB Collections

### customers
```javascript
{
  _id: ObjectId,
  email: String (unique),
  passwordHash: String (bcrypt),
  name: String,
  createdAt: Date,
  updatedAt: Date
}
```

### dealers
```javascript
{
  _id: ObjectId,
  email: String (unique),
  passwordHash: String (bcrypt),
  companyName: String,
  createdAt: Date,
  updatedAt: Date
}
```

## ✅ Features Implemented

- ✅ Role selection (Customer/Dealer dropdown)
- ✅ Secure password hashing (bcrypt)
- ✅ JWT authentication (7-day expiry)
- ✅ MongoDB Atlas integration
- ✅ Role-based redirects
- ✅ Error handling
- ✅ Success messages
- ✅ Form validation
- ✅ Email format validation
- ✅ Duplicate email prevention

## 🧪 Testing

### Test Signup
```bash
curl -X POST http://localhost:3000/api/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "test123",
    "role": "customer"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "Password123!",
    "role": "customer"
  }'
```

## ✅ Complete System Ready!

The authentication system is fully implemented and ready to use!

