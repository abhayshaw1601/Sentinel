import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const fixRole = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const email = 'bera1234@gmail.com';
        const user = await User.findOne({ email });

        if (user) {
            console.log(`User found: ${user.name} (${user.role})`);
            user.role = 'admin';
            await user.save();
            console.log('SUCCESS: User role updated to ADMIN');
        } else {
            console.log('User not found');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

fixRole();
