import dotenv from 'dotenv';
import connectDB from './config/database.js';
import Report from './models/Report.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const cleanOrphanedReports = async () => {
    try {
        await connectDB();

        console.log('\n🔍 Checking for reports with missing files...\n');

        // First, get ALL reports
        const allReports = await Report.find({});
        console.log(`Total reports in database: ${allReports.length}`);

        // Now filter for those with files
        const reports = await Report.find({ fileUrl: { $exists: true, $ne: '' } })
            .populate('patientId', 'name patientId')
            .populate('uploadedBy', 'name email');

        console.log(`Found ${reports.length} reports with file references\n`);

        const orphaned = [];
        const valid = [];

        for (const report of reports) {
            // Extract filename from URL
            let filename;
            if (report.fileUrl.startsWith('http')) {
                const urlParts = report.fileUrl.split('/');
                filename = urlParts[urlParts.length - 1];
            } else {
                filename = path.basename(report.fileUrl);
            }

            const filePath = path.join(__dirname, 'uploads', filename);
            const exists = fs.existsSync(filePath);

            if (!exists) {
                orphaned.push({
                    id: report._id,
                    title: report.title,
                    patient: report.patientId?.name || 'Unknown',
                    fileName: filename,
                    fileUrl: report.fileUrl
                });
            } else {
                valid.push(report);
            }
        }

        console.log(`✅ Valid reports (file exists): ${valid.length}`);
        console.log(`❌ Orphaned reports (file missing): ${orphaned.length}\n`);

        if (orphaned.length > 0) {
            console.log('📋 Orphaned Reports:\n');
            orphaned.forEach((report, index) => {
                console.log(`${index + 1}. ${report.title}`);
                console.log(`   ID: ${report.id}`);
                console.log(`   Patient: ${report.patient}`);
                console.log(`   Missing file: ${report.fileName}`);
                console.log(`   File URL: ${report.fileUrl}`);
                console.log('---');
            });

            console.log('\n💡 Recommendation: Delete these orphaned reports from the database');
            console.log('   You can manually delete them using the app UI or run a cleanup script\n');
        } else {
            console.log('✅ All reports have their files intact!\n');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

cleanOrphanedReports();
