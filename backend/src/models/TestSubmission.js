import mongoose from 'mongoose';

const testSubmissionSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    testScore: { type: Number, required: true, min: 0, max: 100 },
    feedback: { type: String, trim: true },
    date: { type: Date, default: Date.now }
}, { timestamps: true });

export const TestSubmission = mongoose.models.TestSubmission || mongoose.model('TestSubmission', testSubmissionSchema);

