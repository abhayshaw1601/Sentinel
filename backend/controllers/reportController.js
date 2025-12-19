import Report from '../models/Report.js';
import Patient from '../models/Patient.js';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Get reports for a patient
// @route   GET /api/reports/patient/:patientId
// @access  Private
export const getPatientReports = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { type, category } = req.query;

        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        let query = { patientId };
        if (type) query.type = type;
        if (category) query.category = category;

        const reports = await Report.find(query)
            .sort({ timestamp: -1 })
            .populate('uploadedBy', 'name email');

        res.status(200).json({
            success: true,
            count: reports.length,
            data: reports
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get single report
// @route   GET /api/reports/:id
// @access  Private
export const getReport = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id)
            .populate('patientId', 'name patientId')
            .populate('uploadedBy', 'name email');

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        res.status(200).json({
            success: true,
            data: report
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Create text report
// @route   POST /api/reports/text
// @access  Private
export const createTextReport = async (req, res) => {
    try {
        const { patientId, title, content, category, description, tags } = req.body;

        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        const report = await Report.create({
            patientId,
            title,
            type: 'text',
            content,
            category,
            description,
            tags,
            uploadedBy: req.user._id
        });

        res.status(201).json({
            success: true,
            message: 'Text report created successfully',
            data: report
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Upload file report (image/PDF)
// @route   POST /api/reports/upload
// @access  Private
export const uploadFileReport = async (req, res) => {
    console.log('📤 Upload request received');
    try {
        if (!req.file) {
            console.log('❌ No file in request');
            return res.status(400).json({
                success: false,
                message: 'Please upload a file'
            });
        }

        console.log('✅ File received:', {
            filename: req.file.filename,
            originalname: req.file.originalname,
            path: req.file.path,
            size: req.file.size
        });

        const { patientId, title, category, description, tags } = req.body;

        const patient = await Patient.findById(patientId);
        if (!patient) {
            // Delete uploaded file if patient not found
            console.log('❌ Patient not found, deleting file');
            fs.unlinkSync(req.file.path);
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        console.log('✅ Patient found:', patient.name);

        // Determine type based on mimetype
        let type = 'image';
        if (req.file.mimetype === 'application/pdf') {
            type = 'pdf';
        }

        console.log('📝 Creating report in database...');

        // Parse tags safely to prevent JSON parsing errors from deleting files
        let parsedTags = [];
        if (tags) {
            try {
                parsedTags = JSON.parse(tags);
            } catch (parseError) {
                console.log('⚠️ Tags parsing error, using empty array:', parseError.message);
                parsedTags = [];
            }
        }

        // Use BASE_URL from environment or build dynamically
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
        const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
        console.log('File URL:', fileUrl);

        const report = await Report.create({
            patientId,
            title,
            type,
            category,
            description,
            tags: parsedTags,
            fileUrl: fileUrl,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            uploadedBy: req.user._id
        });

        console.log('✅ Report created in database:', report._id);

        // Verify file still exists
        const fileStillExists = fs.existsSync(req.file.path);
        console.log('📁 File exists after DB save?', fileStillExists);

        // Trigger AI processing in background (optional)
        try {
            const aiServiceUrl = process.env.AI_SERVICE_URL;
            if (aiServiceUrl) {
                // Send file to AI service for processing
                const filePath = path.join(__dirname, '../uploads', req.file.filename);
                console.log('🤖 Sending to AI service:', filePath);
                await axios.post(`${aiServiceUrl}/api/process-file`, {
                    reportId: report._id.toString(),
                    filePath,
                    type
                });
                console.log('✅ AI processing initiated');
            }
        } catch (aiError) {
            console.error('❌ AI processing error (file NOT deleted):', aiError.message);
            // Continue even if AI processing fails - DON'T delete the file
        }

        console.log('✅ Upload complete, sending response');
        res.status(201).json({
            success: true,
            message: 'File uploaded successfully',
            data: report
        });
    } catch (error) {
        console.error('❌ Upload error:', error.message);
        console.error('Stack:', error.stack);

        // Delete file if report creation fails
        if (req.file && req.file.path) {
            try {
                if (fs.existsSync(req.file.path)) {
                    console.log('🗑️ Deleting file due to error:', req.file.path);
                    fs.unlinkSync(req.file.path);
                } else {
                    console.log('⚠️ File already deleted or not found:', req.file.path);
                }
            } catch (deleteError) {
                console.error('❌ Error deleting file:', deleteError.message);
            }
        }

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update report
// @route   PUT /api/reports/:id
// @access  Private
export const updateReport = async (req, res) => {
    try {
        let report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        // Only allow updating certain fields
        const { title, description, tags, content, category } = req.body;

        if (title) report.title = title;
        if (description) report.description = description;
        if (tags) report.tags = tags;
        if (category) report.category = category;
        if (content && report.type === 'text') report.content = content;

        await report.save();

        res.status(200).json({
            success: true,
            message: 'Report updated successfully',
            data: report
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete report
// @route   DELETE /api/reports/:id
// @access  Private
export const deleteReport = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        // Delete file if it exists
        if (report.fileUrl) {
            const filePath = path.join(__dirname, '..', report.fileUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await report.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Report deleted successfully',
            data: {}
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Download report file
// @route   GET /api/reports/:id/download
// @access  Private
export const downloadReport = async (req, res) => {
    try {
        console.log('📥 Download request for report ID:', req.params.id);

        const report = await Report.findById(req.params.id);

        if (!report) {
            console.log('❌ Report not found in database');
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        console.log('✅ Report found:', {
            id: report._id,
            title: report.title,
            fileUrl: report.fileUrl,
            fileName: report.fileName
        });

        if (!report.fileUrl) {
            console.log('❌ Report has no fileUrl');
            return res.status(400).json({
                success: false,
                message: 'This report has no file to download'
            });
        }

        // Extract filename from URL (handles both old relative paths and new full URLs)
        let filename;
        if (report.fileUrl.startsWith('http')) {
            // New format: http://localhost:5000/uploads/filename
            const urlParts = report.fileUrl.split('/');
            filename = urlParts[urlParts.length - 1];
        } else {
            // Old format: /uploads/filename
            filename = path.basename(report.fileUrl);
        }

        const filePath = path.join(__dirname, '../uploads', filename);
        console.log('📁 Looking for file at:', filePath);
        console.log('📁 File exists?', fs.existsSync(filePath));

        if (!fs.existsSync(filePath)) {
            console.log('❌ File not found on server');
            return res.status(404).json({
                success: false,
                message: 'File not found on server'
            });
        }

        console.log('✅ Sending file download');
        res.download(filePath, report.fileName);
    } catch (error) {
        console.error('❌ Download error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
