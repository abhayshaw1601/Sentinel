import mongoose from 'mongoose';

const chatHistorySchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
        index: true
    },
    messages: [{
        role: {
            type: String,
            enum: ['patient', 'ai'],
            required: true
        },
        content: {
            type: String,
            required: true
        },
        imageUrl: {
            type: String,
            default: null
        },
        aiAnalysis: {
            diagnosis: String,
            suggestions: [String],
            precautions: [String],
            medications: [String],
            severity: {
                type: String,
                enum: ['Low', 'Medium', 'High', 'Emergency']
            }
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
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

// Index for faster queries
chatHistorySchema.index({ patientId: 1, updatedAt: -1 });

const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);

export default ChatHistory;
