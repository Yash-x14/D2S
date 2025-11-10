import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, trim: true, default: 'India' },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'], trim: true },
    language: { type: String, default: 'en' },
    currency: { type: String, default: 'INR' },
    newsletter: { type: Boolean, default: false },
    smsNotifications: { type: Boolean, default: false },
    emailNotifications: { type: Boolean, default: true }
}, { timestamps: true });

export const Customer = mongoose.models.Customer || mongoose.model('Customer', customerSchema);