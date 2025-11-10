import mongoose from 'mongoose';

const dealerSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    companyName: { type: String },
}, { timestamps: true });

export const Dealer = mongoose.models.Dealer || mongoose.model('Dealer', dealerSchema);