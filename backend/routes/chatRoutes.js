import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import ChatHistory from '../models/ChatHistory.js';
import Patient from '../models/Patient.js';
import { protect } from '../middleware/auth.js';
import axios from 'axios';
import fs from 'fs';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for medical image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/chat-images');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'medical-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only JPEG and PNG images are allowed'));
        }
    }
});

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Get or create chat history for patient
const getOrCreateChatHistory = async (patientId) => {
    let chatHistory = await ChatHistory.findOne({ patientId }).sort({ updatedAt: -1 });

    if (!chatHistory) {
        chatHistory = new ChatHistory({
            patientId,
            messages: []
        });
        await chatHistory.save();
    }

    return chatHistory;
};

// GET /api/chat/history/:patientId - Get conversation history
router.get('/history/:patientId', protect, async (req, res) => {
    try {
        const { patientId } = req.params;

        // Verify patient exists
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }

        // Security: Ensure user can only access their own chat if they're a patient
        const user = req.user;
        if (user.role === 'patient' && user._id.toString() !== patientId) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const chatHistory = await getOrCreateChatHistory(patientId);

        res.json({
            success: true,
            data: {
                messages: chatHistory.messages,
                patientId: patient._id,
                patientName: patient.name
            }
        });
    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch chat history' });
    }
});

// POST /api/chat/message/:patientId - Send text message
router.post('/message/:patientId', protect, async (req, res) => {
    try {
        const { patientId } = req.params;
        const { message } = req.body;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'Message cannot be empty' });
        }

        // Verify patient exists
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }

        // Security check
        const user = req.user;
        if (user.role === 'patient' && user._id.toString() !== patientId) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Get chat history
        const chatHistory = await getOrCreateChatHistory(patientId);

        // Add patient message
        chatHistory.messages.push({
            role: 'patient',
            content: message,
            timestamp: new Date()
        });

        // Prepare context for AI
        const context = {
            patient: {
                name: patient.name,
                age: patient.age,
                gender: patient.gender,
                reasonForAdmission: patient.reasonForAdmission,
                medicalHistory: patient.medicalHistory,
                allergies: patient.allergies,
                bloodType: patient.bloodType
            },
            conversationHistory: chatHistory.messages.slice(-10).map(msg => ({
                role: msg.role,
                content: msg.content
            }))
        };

        // Call AI service
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/patient-chat`, {
            message,
            context
        });

        const aiMessage = aiResponse.data.data.response;

        // Add AI response to history
        chatHistory.messages.push({
            role: 'ai',
            content: aiMessage,
            timestamp: new Date()
        });

        await chatHistory.save();

        res.json({
            success: true,
            data: {
                aiResponse: aiMessage,
                timestamp: new Date()
            }
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message',
            error: error.response?.data?.detail || error.message
        });
    }
});

// POST /api/chat/analyze-image/:patientId - Upload and analyze medical image
router.post('/analyze-image/:patientId', protect, upload.single('image'), async (req, res) => {
    try {
        const { patientId } = req.params;
        const { message } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image uploaded' });
        }

        // Verify patient exists
        const patient = await Patient.findById(patientId);
        if (!patient) {
            // Delete uploaded file
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }

        // Security check
        const user = req.user;
        if (user.role === 'patient' && user._id.toString() !== patientId) {
            fs.unlinkSync(req.file.path);
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Get chat history
        const chatHistory = await getOrCreateChatHistory(patientId);

        // Store image URL (relative path)
        const imageUrl = `/uploads/chat-images/${req.file.filename}`;

        // Add patient message with image
        chatHistory.messages.push({
            role: 'patient',
            content: message || 'Please analyze this image',
            imageUrl: imageUrl,
            timestamp: new Date()
        });

        // Read image file and convert to base64
        const imageBuffer = fs.readFileSync(req.file.path);
        const base64Image = imageBuffer.toString('base64');

        // Prepare patient context
        const patientContext = {
            name: patient.name,
            age: patient.age,
            gender: patient.gender,
            allergies: patient.allergies,
            medicalHistory: patient.medicalHistory,
            bloodType: patient.bloodType
        };

        // Call AI service for image analysis
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/analyze-medical-image`, {
            image: base64Image,
            message: message || 'Please analyze this medical image',
            patientContext
        });

        const analysisData = aiResponse.data.data;

        // Add AI response with analysis
        chatHistory.messages.push({
            role: 'ai',
            content: analysisData.response,
            aiAnalysis: {
                diagnosis: analysisData.diagnosis,
                suggestions: analysisData.suggestions,
                precautions: analysisData.precautions,
                medications: analysisData.medications,
                severity: analysisData.severity
            },
            timestamp: new Date()
        });

        await chatHistory.save();

        res.json({
            success: true,
            data: {
                imageUrl: imageUrl,
                analysis: analysisData,
                timestamp: new Date()
            }
        });
    } catch (error) {
        console.error('Error analyzing image:', error);

        // Delete uploaded file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            message: 'Failed to analyze image',
            error: error.response?.data?.detail || error.message
        });
    }
});

// DELETE /api/chat/clear/:patientId - Clear chat history
router.delete('/clear/:patientId', protect, async (req, res) => {
    try {
        const { patientId } = req.params;

        // Verify patient exists
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }

        // Security check
        const user = req.user;
        if (user.role === 'patient' && user._id.toString() !== patientId) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Clear messages
        const chatHistory = await ChatHistory.findOne({ patientId });
        if (chatHistory) {
            chatHistory.messages = [];
            await chatHistory.save();
        }

        res.json({
            success: true,
            message: 'Chat history cleared successfully'
        });
    } catch (error) {
        console.error('Error clearing chat history:', error);
        res.status(500).json({ success: false, message: 'Failed to clear chat history' });
    }
});

export default router;
