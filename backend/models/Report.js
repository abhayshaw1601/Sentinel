import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: [true, 'Report title is required'],
        trim: true
    },
    type: {
        type: String,
        enum: ['text', 'image', 'pdf'],
        required: true
    },
    category: {
        type: String,
        enum: ['lab', 'radiology', 'clinical', 'discharge', 'consultation', 'other'],
        default: 'other'
    },
    // For text reports
    content: {
        type: String,
        default: ''
    },
    // For file uploads (images, PDFs)
    fileUrl: {
        type: String,
        default: ''
    },
    fileName: {
        type: String,
        default: ''
    },
    fileSize: {
        type: Number,
        default: 0
    },
    mimeType: {
        type: String,
        default: ''
    },
    // Metadata
    description: {
        type: String,
        default: ''
    },
    tags: {
        type: [String],
        default: []
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // AI processing status
    aiProcessed: {
        type: Boolean,
        default: false
    },
    aiExtractedText: {
        type: String,
        default: ''
    },
    aiSummary: {
        type: String,
        default: ''
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
reportSchema.index({ patientId: 1, timestamp: -1 });
reportSchema.index({ patientId: 1, type: 1 });

const Report = mongoose.model('Report', reportSchema);

export default Report;
