import Patient from '../models/Patient.js';

// @desc    Get all patients
// @route   GET /api/patients
// @access  Private
export const getPatients = async (req, res) => {
    try {
        const { status } = req.query;

        let query = {};
        if (status) {
            query.status = status;
        }

        const patients = await Patient.find(query).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: patients.length,
            data: patients
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get single patient
// @route   GET /api/patients/:id
// @access  Private
export const getPatient = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        res.status(200).json({
            success: true,
            data: patient
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Create new patient
// @route   POST /api/patients
// @access  Private
export const createPatient = async (req, res) => {
    try {
        req.body.createdBy = req.user._id;

        const patient = await Patient.create(req.body);

        res.status(201).json({
            success: true,
            message: 'Patient created successfully',
            data: patient
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update patient
// @route   PUT /api/patients/:id
// @access  Private
export const updatePatient = async (req, res) => {
    try {
        let patient = await Patient.findById(req.params.id);

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            message: 'Patient updated successfully',
            data: patient
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete patient
// @route   DELETE /api/patients/:id
// @access  Private/Admin
export const deletePatient = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        await patient.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Patient deleted successfully',
            data: {}
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Discharge patient
// @route   PUT /api/patients/:id/discharge
// @access  Private
export const dischargePatient = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        patient.status = 'discharged';
        patient.dischargeDate = new Date();
        await patient.save();

        res.status(200).json({
            success: true,
            message: 'Patient discharged successfully',
            data: patient
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Readmit patient (undo discharge)
// @route   PUT /api/patients/:id/readmit
// @access  Private
export const readmitPatient = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        patient.status = 'admitted';
        patient.dischargeDate = undefined;
        await patient.save();

        res.status(200).json({
            success: true,
            message: 'Patient readmitted successfully',
            data: patient
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
