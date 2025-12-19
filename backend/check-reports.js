import dotenv from 'dotenv';
import connectDB from './config/database.js';
import Report from './models/Report.js';

dotenv.config();

const checkReports = async () => {
    try {
        await connectDB();

        console.log('\n📊 Checking all reports in database...\n');

        const reports = await Report.find({})
            .populate('patientId', 'name patientId')
            .populate('uploadedBy', 'name email');

        console.log(`Found ${reports.length} reports:\n`);

        reports.forEach((report, index) => {
            console.log(`Report ${index + 1}:`);
            console.log(`  ID: ${report._id}`);
            console.log(`  Title: ${report.title}`);
            console.log(`  Type: ${report.type}`);
            console.log(`  Patient: ${report.patientId?.name || 'N/A'}`);
            console.log(`  File URL: ${report.fileUrl || 'N/A'}`);
            console.log(`  File Name: ${report.fileName || 'N/A'}`);
            console.log(`  Uploaded By: ${report.uploadedBy?.name || 'N/A'}`);
            console.log(`  Created: ${report.createdAt}`);
            console.log('---');
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkReports();
