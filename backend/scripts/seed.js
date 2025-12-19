import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import Vital from '../models/Vital.js';
import Report from '../models/Report.js';

dotenv.config();

// Connect to database
connectDB();

const seedData = async () => {
    try {
        // Clear existing data
        await User.deleteMany();
        await Patient.deleteMany();
        await Vital.deleteMany();
        await Report.deleteMany();

        console.log('🗑️  Data cleared');

        // Create admin user
        const admin = await User.create({
            email: 'admin@icu.com',
            password: 'admin123',
            name: 'Admin User',
            role: 'admin',
            phone: '+1234567890'
        });

        console.log('✅ Admin user created');

        // Create staff users
        const staff1 = await User.create({
            email: 'staff1@icu.com',
            password: 'staff123',
            name: 'Dr. Sarah Johnson',
            role: 'staff',
            phone: '+1234567891'
        });

        const staff2 = await User.create({
            email: 'staff2@icu.com',
            password: 'staff123',
            name: 'Dr. Michael Chen',
            role: 'staff',
            phone: '+1234567892'
        });

        console.log('✅ Staff users created');

        // Create sample patients
        const patient1 = await Patient.create({
            name: 'John Doe',
            age: 45,
            dateOfBirth: new Date('1979-05-15'),
            gender: 'male',
            reasonForAdmission: 'Acute respiratory distress syndrome (ARDS)',
            roomNumber: '101',
            bedNumber: 'A',
            assignedDoctor: 'Dr. Sarah Johnson',
            status: 'admitted',
            medicalHistory: 'Hypertension, Type 2 Diabetes',
            allergies: ['Penicillin'],
            bloodType: 'O+',
            emergencyContact: {
                name: 'Jane Doe',
                phone: '+1234567893',
                relation: 'Wife'
            },
            createdBy: staff1._id
        });

        const patient2 = await Patient.create({
            name: 'Emily Martinez',
            age: 62,
            dateOfBirth: new Date('1962-08-22'),
            gender: 'female',
            reasonForAdmission: 'Post-operative care after cardiac surgery',
            roomNumber: '102',
            bedNumber: 'B',
            assignedDoctor: 'Dr. Michael Chen',
            status: 'admitted',
            medicalHistory: 'Coronary artery disease, High cholesterol',
            allergies: ['Latex', 'Sulfa drugs'],
            bloodType: 'A+',
            emergencyContact: {
                name: 'Robert Martinez',
                phone: '+1234567894',
                relation: 'Husband'
            },
            createdBy: staff2._id
        });

        const patient3 = await Patient.create({
            name: 'Robert Williams',
            age: 58,
            dateOfBirth: new Date('1966-03-10'),
            gender: 'male',
            reasonForAdmission: 'Septic shock',
            roomNumber: '103',
            bedNumber: 'C',
            assignedDoctor: 'Dr. Sarah Johnson',
            status: 'discharged',
            admissionDate: new Date('2024-01-05'),
            dischargeDate: new Date('2024-01-15'),
            medicalHistory: 'Chronic kidney disease',
            bloodType: 'B+',
            emergencyContact: {
                name: 'Lisa Williams',
                phone: '+1234567895',
                relation: 'Daughter'
            },
            createdBy: staff1._id
        });

        console.log('✅ Sample patients created');

        // Create sample vitals for patient 1
        const now = new Date();
        for (let i = 0; i < 24; i++) {
            await Vital.create({
                patientId: patient1._id,
                heartRate: 75 + Math.floor(Math.random() * 20),
                bloodPressureSystolic: 120 + Math.floor(Math.random() * 20),
                bloodPressureDiastolic: 80 + Math.floor(Math.random() * 10),
                oxygenSaturation: 95 + Math.floor(Math.random() * 5),
                temperature: 98 + Math.random() * 2,
                respiratoryRate: 16 + Math.floor(Math.random() * 6),
                bloodSugar: 100 + Math.floor(Math.random() * 40),
                co2Level: 35 + Math.floor(Math.random() * 10),
                timestamp: new Date(now.getTime() - (i * 60 * 60 * 1000)),
                recordedBy: staff1._id
            });
        }

        // Create sample vitals for patient 2
        for (let i = 0; i < 24; i++) {
            await Vital.create({
                patientId: patient2._id,
                heartRate: 68 + Math.floor(Math.random() * 15),
                bloodPressureSystolic: 110 + Math.floor(Math.random() * 15),
                bloodPressureDiastolic: 70 + Math.floor(Math.random() * 10),
                oxygenSaturation: 96 + Math.floor(Math.random() * 4),
                temperature: 98.2 + Math.random() * 1.5,
                respiratoryRate: 14 + Math.floor(Math.random() * 4),
                bloodSugar: 110 + Math.floor(Math.random() * 30),
                co2Level: 38 + Math.floor(Math.random() * 8),
                timestamp: new Date(now.getTime() - (i * 60 * 60 * 1000)),
                recordedBy: staff2._id
            });
        }

        console.log('✅ Sample vitals created');

        // Create sample reports
        await Report.create({
            patientId: patient1._id,
            title: 'Initial Assessment',
            type: 'text',
            category: 'clinical',
            content: 'Patient admitted with severe respiratory distress. Oxygen saturation at 88% on room air. Started on high-flow oxygen therapy.',
            uploadedBy: staff1._id
        });

        await Report.create({
            patientId: patient2._id,
            title: 'Post-Op Day 1 Notes',
            type: 'text',
            category: 'clinical',
            content: 'Patient recovering well from cardiac surgery. Hemodynamically stable. Pain controlled with medication.',
            uploadedBy: staff2._id
        });

        console.log('✅ Sample reports created');

        console.log('\n📊 Database seeded successfully!\n');
        console.log('📝 Login credentials:');
        console.log('   Admin: admin@icu.com / admin123');
        console.log('   Staff 1: staff1@icu.com / staff123');
        console.log('   Staff 2: staff2@icu.com / staff123\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedData();
