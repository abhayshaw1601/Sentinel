import Patient from '../models/Patient.js';
import jwt from 'jsonwebtoken';

// In-memory OTP store (In production, use Redis)
const otpStore = new Map();

// Generate generic 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id, role: 'patient' }, process.env.JWT_SECRET, {
        expiresIn: '24h'
    });
};

// @desc    Request OTP
// @route   POST /api/patient-auth/request-otp
// @access  Public
export const requestOTP = async (req, res) => {
    try {
        const { name, phone, email } = req.body;

        if (!name || !phone || !email) {
            return res.status(400).json({
                success: false,
                message: 'Please provide Name, Phone, and Email'
            });
        }

        // Find patient matching Email and Phone
        const patient = await Patient.findOne({
            email: email.toLowerCase(),
            phone: phone
        });

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found with these details.'
            });
        }

        // Verify Name (Case Insensitive)
        if (patient.name.trim().toLowerCase() !== name.trim().toLowerCase()) {
            return res.status(404).json({
                success: false,
                message: 'Patient details do not match (Name mismatch).'
            });
        }

        // Generate OTP
        const otp = generateOTP();

        // Store OTP with expiration (5 mins)
        otpStore.set(email, {
            otp,
            expires: Date.now() + 5 * 60 * 1000,
            patientId: patient._id
        });

        // Log OTP (Mock Email Service)
        console.log(`\n📧 [MOCK EMAIL] To: ${email} | Subject: Sentinel Login OTP | Body: Your code is ${otp}\n`);

        res.status(200).json({
            success: true,
            message: `OTP sent to ${email}`,
            debug_otp: otp
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Verify OTP
// @route   POST /api/patient-auth/verify-otp
// @access  Public
export const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Please provide Email and OTP'
            });
        }

        const record = otpStore.get(email);

        if (!record) {
            return res.status(400).json({
                success: false,
                message: 'OTP expired or request not found'
            });
        }

        if (record.expires < Date.now()) {
            otpStore.delete(email);
            return res.status(400).json({
                success: false,
                message: 'OTP expired'
            });
        }

        if (record.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        // OTP Valid
        otpStore.delete(email); // Clear used OTP

        const patient = await Patient.findById(record.patientId);
        const token = generateToken(patient._id);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                _id: patient._id,
                name: patient.name,
                patientId: patient.patientId,
                role: 'patient',
                token
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
