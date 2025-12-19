import mongoose from 'mongoose';

const vitalSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
        index: true
    },
    heartRate: {
        type: Number,
        min: 0,
        max: 300
    },
    bloodPressureSystolic: {
        type: Number,
        min: 0,
        max: 300
    },
    bloodPressureDiastolic: {
        type: Number,
        min: 0,
        max: 200
    },
    oxygenSaturation: {
        type: Number,
        min: 0,
        max: 100
    },
    temperature: {
        type: Number,
        min: 90,
        max: 110
    },
    respiratoryRate: {
        type: Number,
        min: 0,
        max: 100
    },
    bloodSugar: {
        type: Number,
        min: 0,
        max: 600
    },
    co2Level: {
        type: Number,
        min: 0,
        max: 100
    },
    notes: {
        type: String,
        default: ''
    },
    recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

// Create compound index for efficient queries
vitalSchema.index({ patientId: 1, timestamp: -1 });

const Vital = mongoose.model('Vital', vitalSchema);

export default Vital;
