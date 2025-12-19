import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Patient from './models/Patient.js';

dotenv.config();

const checkPatients = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get ALL patients
        const allPatients = await Patient.find({}).select('name patientId status');

        console.log('📊 Total Patients in Database:', allPatients.length);
        console.log('\n📋 Patient List:');
        console.log('─'.repeat(60));

        allPatients.forEach((p, i) => {
            console.log(`${i + 1}. Name: ${p.name}`);
            console.log(`   ID: ${p.patientId}`);
            console.log(`   Status: "${p.status}" (${typeof p.status})`);
            console.log('');
        });

        // Check status counts
        const statuses = await Patient.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        console.log('📈 Status Breakdown:');
        console.log('─'.repeat(60));
        statuses.forEach(s => {
            console.log(`   ${s._id || '(empty/null)'}: ${s.count}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

checkPatients();
