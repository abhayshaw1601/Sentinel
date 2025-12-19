import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
    patientId: {
        type: String,
        unique: true,
        uppercase: true
    },
    name: {
        type: String,
        required: [true, 'Patient name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required for patient portal access'],
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: true
    },
    billing: {
        roomRate: {
            type: Number,
            default: 500
        },
        additionalCharges: {
            type: Number,
            default: 0
        },
        insuranceProvider: {
            type: String,
            default: 'None'
        }
    },
    age: {
        type: Number,
        required: [true, 'Age is required'],
        min: 0,
        max: 150
    },
    dateOfBirth: {
        type: Date,
        required: [true, 'Date of birth is required']
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: true
    },
    reasonForAdmission: {
        type: String,
        required: [true, 'Reason for admission is required'],
        trim: true
    },
    roomNumber: {
        type: String,
        trim: true
    },
    bedNumber: {
        type: String,
        trim: true
    },
    admissionDate: {
        type: Date,
        required: [true, 'Admission date is required'],
        default: Date.now
    },
    dischargeDate: {
        type: Date,
        default: null
    },
    assignedDoctor: {
        type: String,
        required: [true, 'Assigned doctor is required'],
        trim: true
    },
    status: {
        type: String,
        enum: ['admitted', 'discharged'],
        default: 'admitted'
    },
    emergencyContact: {
        name: String,
        phone: String,
        relation: String
    },
    medicalHistory: {
        type: String,
        default: ''
    },
    allergies: {
        type: [String],
        default: []
    },
    bloodType: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''],
        default: ''
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Auto-generate patient ID before saving
patientSchema.pre('save', async function (next) {
    if (!this.patientId) {
        const count = await mongoose.model('Patient').countDocuments();
        this.patientId = `ICU${String(count + 1).padStart(6, '0')}`;
    }
    next();
});

const Patient = mongoose.model('Patient', patientSchema);

export default Patient;
