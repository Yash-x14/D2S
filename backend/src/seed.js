import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Customer } from './models/Customer.js';
import { Dealer } from './models/Dealer.js';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/d2s0001';

async function run() {
    await mongoose.connect(mongoUri, { dbName: process.env.MONGODB_DB || undefined });
    const password = process.env.SEED_PASSWORD || 'Password123!';
    const hash = await bcrypt.hash(password, 10);

    const seedCustomerEmail = process.env.SEED_CUSTOMER_EMAIL || 'customer@example.com';
    const seedDealerEmail = process.env.SEED_DEALER_EMAIL || 'dealer@example.com';

    await Customer.findOneAndUpdate({ email: seedCustomerEmail.toLowerCase() }, { email: seedCustomerEmail.toLowerCase(), passwordHash: hash, name: 'Seed Customer' }, { upsert: true, new: true });

    await Dealer.findOneAndUpdate({ email: seedDealerEmail.toLowerCase() }, { email: seedDealerEmail.toLowerCase(), passwordHash: hash, companyName: 'Seed Dealer Co.' }, { upsert: true, new: true });

    // eslint-disable-next-line no-console
    console.log('Seed complete:', { seedCustomerEmail, seedDealerEmail, password });
    await mongoose.disconnect();
}

run().catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
});