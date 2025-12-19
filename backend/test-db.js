import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const testConnection = async () => {
    try {
        console.log('Testing MongoDB connection...');
        console.log('URI:', process.env.MONGODB_URI);

        const conn = await mongoose.connect(process.env.MONGODB_URI);

        console.log('✅ MongoDB Connected Successfully!');
        console.log('Host:', conn.connection.host);
        console.log('Database:', conn.connection.name);
        console.log('Port:', conn.connection.port);

        process.exit(0);
    } catch (error) {
        console.error('❌ MongoDB Connection Failed!');
        console.error('Error:', error.message);
        process.exit(1);
    }
};

testConnection();
