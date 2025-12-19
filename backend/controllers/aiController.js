import axios from 'axios';
import Patient from '../models/Patient.js';
import Vital from '../models/Vital.js';
import Report from '../models/Report.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// @desc    Generate AI insights for a patient
// @route   POST /api/ai/insights/:patientId
// @access  Private
export const generateInsights = async (req, res) => {
    try {
        const { patientId } = req.params;

        // Get patient data
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        // Get recent vitals (last 24 hours)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const vitals = await Vital.find({
            patientId,
            timestamp: { $gte: oneDayAgo }
        }).sort({ timestamp: -1 });

        // Get all reports
        const reports = await Report.find({ patientId });

        // Prepare data for AI service
        const aiData = {
            patient: {
                name: patient.name,
                age: patient.age,
                gender: patient.gender,
                reasonForAdmission: patient.reasonForAdmission,
                medicalHistory: patient.medicalHistory,
                allergies: patient.allergies,
                bloodType: patient.bloodType
            },
            vitals: vitals.map(v => ({
                heartRate: v.heartRate,
                bloodPressure: `${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}`,
                oxygenSaturation: v.oxygenSaturation,
                temperature: v.temperature,
                respiratoryRate: v.respiratoryRate,
                bloodSugar: v.bloodSugar,
                co2Level: v.co2Level,
                timestamp: v.timestamp
            })),
            reports: reports.map(r => ({
                title: r.title,
                type: r.type,
                category: r.category,
                content: r.content,
                aiExtractedText: r.aiExtractedText,
                aiSummary: r.aiSummary,
                timestamp: r.timestamp
            }))
        };

        // Call AI service
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/generate-insights`, aiData);

        res.status(200).json({
            success: true,
            data: aiResponse.data.data // AI service already wraps in {success, data}
        });
    } catch (error) {
        console.error('AI Insights Error:', error.message);
        const status = error.response?.status || 500;
        const message = error.response?.data?.detail || error.response?.data?.message || error.message;
        res.status(status).json({
            success: false,
            message: message
        });
    }
};

// @desc    Chat with AI about patient
// @route   POST /api/ai/chat/:patientId
// @access  Private
export const chatWithAI = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { message, conversationHistory } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }

        // Get patient context
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        // Get recent vitals
        const vitals = await Vital.find({ patientId })
            .sort({ timestamp: -1 })
            .limit(10);

        // Get reports
        const reports = await Report.find({ patientId });

        // Prepare context
        const context = {
            patient: {
                name: patient.name,
                age: patient.age,
                reasonForAdmission: patient.reasonForAdmission,
                medicalHistory: patient.medicalHistory
            },
            recentVitals: vitals.slice(0, 5),
            reportsCount: reports.length,
            reportsSummaries: reports.slice(0, 5).map(r => ({
                title: r.title,
                category: r.category,
                aiSummary: r.aiSummary || r.content?.substring(0, 200)
            }))
        };

        // Call AI service
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/chat`, {
            message,
            context,
            conversationHistory: conversationHistory || []
        });

        res.status(200).json({
            success: true,
            data: aiResponse.data.data // AI service already wraps in {success, data}
        });
    } catch (error) {
        console.error('AI Chat Error:', error.message);
        const status = error.response?.status || 500;
        const message = error.response?.data?.detail || error.response?.data?.message || error.message;
        res.status(status).json({
            success: false,
            message: message
        });
    }
};
