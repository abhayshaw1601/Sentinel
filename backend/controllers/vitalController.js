import Vital from '../models/Vital.js';
import Patient from '../models/Patient.js';

// @desc    Get vitals for a patient
// @route   GET /api/vitals/patient/:patientId
// @access  Private
export const getPatientVitals = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { timeRange } = req.query;

        // Check if patient exists
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        let query = { patientId };

        // Apply time filter
        if (timeRange) {
            const now = new Date();
            let startTime;

            switch (timeRange) {
                case '1h':
                    startTime = new Date(now.getTime() - 60 * 60 * 1000);
                    break;
                case '24h':
                    startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                    break;
                case '7d':
                    startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    startTime = null;
            }

            if (startTime) {
                query.timestamp = { $gte: startTime };
            }
        }

        const vitals = await Vital.find(query)
            .sort({ timestamp: -1 })
            .populate('recordedBy', 'name email');

        res.status(200).json({
            success: true,
            count: vitals.length,
            data: vitals
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get single vital record
// @route   GET /api/vitals/:id
// @access  Private
export const getVital = async (req, res) => {
    try {
        const vital = await Vital.findById(req.params.id)
            .populate('patientId', 'name patientId')
            .populate('recordedBy', 'name email');

        if (!vital) {
            return res.status(404).json({
                success: false,
                message: 'Vital record not found'
            });
        }

        res.status(200).json({
            success: true,
            data: vital
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Create vital record
// @route   POST /api/vitals
// @access  Private
export const createVital = async (req, res) => {
    try {
        const { patientId } = req.body;

        // Check if patient exists
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        // Add recordedBy if user is available
        if (req.user && req.user._id) {
            req.body.recordedBy = req.user._id;
        }

        const vital = await Vital.create(req.body);

        res.status(201).json({
            success: true,
            message: 'Vital record created successfully',
            data: vital
        });
    } catch (error) {
        console.error('Create Vital Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update vital record
// @route   PUT /api/vitals/:id
// @access  Private
export const updateVital = async (req, res) => {
    try {
        let vital = await Vital.findById(req.params.id);

        if (!vital) {
            return res.status(404).json({
                success: false,
                message: 'Vital record not found'
            });
        }

        vital = await Vital.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            message: 'Vital record updated successfully',
            data: vital
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete vital record
// @route   DELETE /api/vitals/:id
// @access  Private
export const deleteVital = async (req, res) => {
    try {
        const vital = await Vital.findById(req.params.id);

        if (!vital) {
            return res.status(404).json({
                success: false,
                message: 'Vital record not found'
            });
        }

        await vital.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Vital record deleted successfully',
            data: {}
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get latest vitals for a patient
// @route   GET /api/vitals/patient/:patientId/latest
// @access  Private
export const getLatestVitals = async (req, res) => {
    try {
        const { patientId } = req.params;

        const latestVital = await Vital.findOne({ patientId })
            .sort({ timestamp: -1 })
            .populate('recordedBy', 'name email');

        if (!latestVital) {
            return res.status(404).json({
                success: false,
                message: 'No vital records found for this patient'
            });
        }

        res.status(200).json({
            success: true,
            data: latestVital
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
