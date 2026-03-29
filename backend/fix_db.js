import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const fixDb = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const result = await User.updateMany({}, { isLoggedIn: false, lastActiveAt: new Date(0) });
        console.log(`Updated ${result.modifiedCount} users to offline status.`);
        process.exit(0);
    } catch (error) {
        console.error('Error fixing DB:', error);
        process.exit(1);
    }
};

fixDb();
