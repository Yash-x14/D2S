import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: String,
        required: true,
        trim: true,
        default: 'General'
    },
    image: {
        type: String,
        trim: true
    },
    primaryImage: {
        type: String,
        trim: true
    },
    stock: {
        quantity: {
            type: Number,
            required: true,
            default: 0,
            min: 0
        },
        lowStockThreshold: {
            type: Number,
            default: 10
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    weight: {
        type: String,
        trim: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    dealerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Dealer',
        required: true
    },
    imageURL: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

export const Product = mongoose.models.Product || mongoose.model('Product', productSchema);