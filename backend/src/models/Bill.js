import mongoose from 'mongoose';

const billItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    total: {
        type: Number,
        required: true,
        min: 0
    }
});

const dealerDetailsSchema = new mongoose.Schema({
    companyName: {
        type: String,
        default: 'Svasthyaa E-Commerce'
    },
    email: {
        type: String,
        default: 'info@svasthyaa.com'
    },
    phone: {
        type: String,
        default: '+91 98765 43210'
    },
    address: {
        type: String,
        default: '123 Health Street'
    },
    city: {
        type: String,
        default: 'Mumbai'
    },
    state: {
        type: String,
        default: 'Maharashtra'
    },
    zipCode: {
        type: String,
        default: '400001'
    },
    gstNumber: {
        type: String,
        default: ''
    }
});

const customerDetailsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        default: ''
    },
    address: {
        type: String,
        default: ''
    },
    city: {
        type: String,
        default: ''
    },
    state: {
        type: String,
        default: ''
    },
    zipCode: {
        type: String,
        default: ''
    }
});

const billSchema = new mongoose.Schema({
    billNumber: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        index: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        index: true
    },
    items: [billItemSchema],
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    tax: {
        type: Number,
        required: true,
        min: 0
    },
    shipping: {
        type: Number,
        required: true,
        min: 0
    },
    total: {
        type: Number,
        required: true,
        min: 0
    },
    paymentMethod: {
        type: String,
        default: 'COD'
    },
    dealerDetails: {
        type: dealerDetailsSchema,
        default: () => ({})
    },
    customerDetails: {
        type: customerDetailsSchema,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'delivered', 'cancelled'],
        default: 'confirmed'
    }
}, {
    timestamps: true
});

// Generate bill number before saving
billSchema.pre('save', async function(next) {
    if (!this.billNumber) {
        const count = await mongoose.models.Bill?.countDocuments() || 0;
        const year = new Date().getFullYear();
        const billNumber = `BILL-${year}-${String(count + 1).padStart(4, '0')}`;
        this.billNumber = billNumber;
    }
    next();
});

export const Bill = mongoose.models.Bill || mongoose.model('Bill', billSchema);

