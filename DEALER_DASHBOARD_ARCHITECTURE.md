# 🏪 Dealer Dashboard Architecture

## 📋 Overview

This document describes the complete architecture of the dealer dashboard (admin panel) and customer interface system. The dealer dashboard is **password-protected** and allows dealers to manage products (Add, Update, Delete), while customers can view these products in real-time.

---

## 🏗️ System Architecture

### **1. Dealer Dashboard (Admin Panel)**
- **Location**: `Dealer2/` folder
- **Access**: Password-protected, dealer authentication required
- **URL**: `http://localhost:3000/dealer2`
- **Purpose**: Dealer-only interface for product management

### **2. Customer Interface**
- **Location**: `frontend/` folder
- **Access**: Public (no authentication required for viewing)
- **URL**: `http://localhost:3000/variety.html`
- **Purpose**: Customer-facing product display

### **3. Backend API**
- **Location**: `backend/` folder
- **Database**: MongoDB Atlas
- **URL**: `http://localhost:3000`
- **Purpose**: Handles authentication, product CRUD, real-time updates

---

## 🔐 Authentication & Security

### **Dealer Dashboard Protection**

#### **1. Frontend Authentication Check**
**File**: `Dealer2/js/main.js`

```javascript
function checkAuth() {
    const token = getToken();
    const role = localStorage.getItem('role');

    if (!token || role !== 'dealer') {
        console.log('Dealer not authenticated, redirecting to login...');
        window.location.href = '/auth?role=dealer';
        return false;
    }
    return true;
}
```

**How it works**:
- Checks for JWT token in localStorage
- Verifies role is 'dealer'
- Redirects to login page if not authenticated
- Runs on every page load

#### **2. Backend Authentication Middleware**
**File**: `backend/server.js`

```javascript
// JWT Verification
const verifyJwt = (req, res, next) => {
    // Validates JWT token from Authorization header
    // Sets req.auth with userId and role
};

// Dealer Role Verification
const verifyDealer = (req, res, next) => {
    if (req.auth.role !== 'dealer') {
        return res.status(403).json({
            error: 'Access denied. Dealer role required.'
        });
    }
    next();
};
```

**Protected Routes**:
- `POST /api/dealer/products` - Requires `verifyJwt` + `verifyDealer`
- `PUT /api/dealer/products/:id` - Requires `verifyJwt` + `verifyDealer`
- `DELETE /api/dealer/products/:id` - Requires `verifyJwt` + `verifyDealer`

#### **3. Login Flow**
1. Dealer visits `/dealer2` or `/auth?role=dealer`
2. Enters email and password
3. Backend validates credentials
4. Backend returns JWT token
5. Frontend stores token in localStorage
6. Redirects to dealer dashboard
7. Dashboard checks authentication on load

---

## 📦 Product Management (CRUD Operations)

### **1. Create Product (Add)**

**Frontend**: `Dealer2/js/products.js`
```javascript
async saveProduct() {
    const productData = {
        name: formData.get('name'),
        description: formData.get('description'),
        price: parseFloat(formData.get('price')),
        category: formData.get('category'),
        imageURL: formData.get('image'),
        stock: { quantity: parseInt(formData.get('stock')) },
        isActive: true
    };
    
    const response = await productsAPI.create(productData);
}
```

**API Call**: `POST /api/dealer/products`
- **Authentication**: Required (JWT + Dealer role)
- **Request Body**: Product data (name, description, price, category, imageURL, stock)
- **Response**: Created product object
- **Backend Action**: 
  - Validates required fields
  - Sets `dealerId` from authenticated user
  - Saves to MongoDB Atlas
  - Emits Socket.IO `productAdded` event

**Database**: Product saved to MongoDB with:
- `dealerId` (ObjectId reference to Dealer)
- `name`, `description`, `price`, `category`
- `imageURL`, `stock.quantity`
- `isActive: true`
- `createdAt`, `updatedAt` (timestamps)

---

### **2. Read Products (View List)**

**Frontend**: `Dealer2/js/products.js`
```javascript
async loadProducts() {
    const data = await productsAPI.getAll();
    // Displays products in table
    this.renderProducts();
}
```

**API Call**: `GET /api/products`
- **Authentication**: Not required (public endpoint)
- **Query Parameters**: 
  - `category` - Filter by category
  - `featured` - Filter featured products
  - `active` - Filter active products (default: true)
- **Response**: Array of products
- **Backend Action**: 
  - Queries MongoDB
  - Filters by query parameters
  - Sorts by `createdAt` (newest first)
  - Returns products

**Display**: Products shown in table with:
- Product image
- Name, Price, Category
- Stock quantity
- Edit/Delete buttons

---

### **3. Update Product (Edit)**

**Frontend**: `Dealer2/js/products.js`
```javascript
async editProduct(productId) {
    // Loads product data into form
    const data = await productsAPI.getById(productId);
    // User edits and saves
    await productsAPI.update(productId, productData);
}
```

**API Call**: `PUT /api/dealer/products/:id`
- **Authentication**: Required (JWT + Dealer role)
- **Request Body**: Updated product data
- **Response**: Updated product object
- **Backend Action**: 
  - Verifies dealer owns the product
  - Updates product in MongoDB
  - Emits Socket.IO `productUpdated` event

**Security**: Only the dealer who created the product can update it

---

### **4. Delete Product**

**Frontend**: `Dealer2/js/products.js`
```javascript
async deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }
    await productsAPI.delete(productId);
    this.removeProduct(productId);
}
```

**API Call**: `DELETE /api/dealer/products/:id`
- **Authentication**: Required (JWT + Dealer role)
- **Response**: Success message
- **Backend Action**: 
  - Verifies dealer owns the product
  - Deletes product from MongoDB
  - Emits Socket.IO `productDeleted` event

**Security**: Only the dealer who created the product can delete it

---

## 🛒 Customer Interface

### **Product Display**

**File**: `frontend/variety.html`

**API Call**: `GET /api/products`
- **Authentication**: Not required
- **Query**: `active=true` (default)
- **Response**: Array of active products
- **Display**: Product cards with:
  - Product image
  - Name, Description, Price
  - Category badge
  - "Add to Cart" button

**Real-time Updates**: Uses Socket.IO to receive:
- `productAdded` - New product appears instantly
- `productUpdated` - Product updates instantly
- `productDeleted` - Product removed instantly

---

## 🔄 Data Flow

### **Complete Flow: Dealer Adds Product**

```
1. Dealer logs into dashboard
   ↓
2. Dealer fills product form
   ↓
3. Frontend sends POST /api/dealer/products
   ↓
4. Backend validates authentication (JWT + Dealer role)
   ↓
5. Backend validates product data
   ↓
6. Backend saves to MongoDB Atlas
   ↓
7. Backend emits Socket.IO event: productAdded
   ↓
8. Customer variety.html receives event
   ↓
9. Product appears instantly on customer page
   ↓
10. No page reload needed ✅
```

---

## 🔌 Real-time Updates (Socket.IO)

### **How It Works**

1. **Backend** (`backend/server.js`):
   - When product is created/updated/deleted
   - Emits Socket.IO event to all connected clients
   - Events: `productAdded`, `productUpdated`, `productDeleted`

2. **Dealer Dashboard** (`Dealer2/js/socket.js`):
   - Listens for product events
   - Updates product table in real-time
   - No page reload needed

3. **Customer Interface** (`frontend/variety.html`):
   - Listens for product events
   - Adds/updates/removes products in real-time
   - Shows notification to customer
   - No page reload needed

---

## 📁 File Structure

```
D2S/
├── Dealer2/                    # Dealer Dashboard (Admin Panel)
│   ├── index.html              # Main dashboard page
│   ├── js/
│   │   ├── main.js             # Authentication check
│   │   ├── products.js         # Product CRUD logic
│   │   ├── api.js              # API calls
│   │   └── socket.js           # Socket.IO client
│   └── ...
│
├── frontend/                    # Customer Interface
│   ├── variety.html            # Product display page
│   ├── index.html              # Homepage
│   └── ...
│
└── backend/                     # Backend API
    ├── server.js                # Express server, routes, Socket.IO
    └── src/
        └── models/
            └── Product.js       # Product schema
```

---

## 🔗 API Endpoints

### **Public Endpoints** (No Authentication)
- `GET /api/products` - Get all products (for customers)
- `GET /api/products/:id` - Get single product

### **Protected Endpoints** (Dealer Authentication Required)
- `POST /api/dealer/products` - Create product
- `PUT /api/dealer/products/:id` - Update product
- `DELETE /api/dealer/products/:id` - Delete product

### **Authentication Endpoints**
- `POST /api/login` - Login (returns JWT token)
- `POST /api/register` - Register new dealer/customer

---

## ✅ Security Features

1. **JWT Authentication**: All dealer operations require valid JWT token
2. **Role-Based Access**: Only users with 'dealer' role can access dealer routes
3. **Product Ownership**: Dealers can only update/delete their own products
4. **Frontend Protection**: Dashboard redirects to login if not authenticated
5. **Backend Protection**: API routes reject unauthorized requests

---

## 🧪 Testing Checklist

### **Dealer Dashboard**
- [ ] Login page requires email/password
- [ ] Dashboard redirects to login if not authenticated
- [ ] Can add new product
- [ ] Can view product list
- [ ] Can edit existing product
- [ ] Can delete product
- [ ] Products save to MongoDB Atlas
- [ ] Real-time updates work (Socket.IO)

### **Customer Interface**
- [ ] Can view products without login
- [ ] Products load from MongoDB
- [ ] New products appear instantly (Socket.IO)
- [ ] Updated products reflect instantly
- [ ] Deleted products disappear instantly
- [ ] No console errors
- [ ] No network errors

---

## 🎯 Key Features

✅ **Password-Protected Dealer Dashboard**
- JWT authentication
- Role-based access control
- Secure API endpoints

✅ **Full Product CRUD**
- Create: Add new products
- Read: View product list
- Update: Edit existing products
- Delete: Remove products

✅ **Real-time Synchronization**
- Socket.IO for instant updates
- No page reload needed
- Automatic UI updates

✅ **Database Integration**
- MongoDB Atlas storage
- Product ownership tracking
- Timestamp tracking

✅ **Customer Interface**
- Public product viewing
- Real-time product updates
- Clean, responsive design

---

## 📝 Summary

The system provides:
1. **Secure dealer dashboard** with password protection
2. **Complete product management** (Add, Update, Delete, View)
3. **Real-time updates** between dealer and customer interfaces
4. **MongoDB Atlas integration** for persistent storage
5. **Role-based security** ensuring only dealers can manage products

**Status**: ✅ **Fully Functional and Ready for Use**

