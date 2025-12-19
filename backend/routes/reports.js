import express from 'express';
import {
    getPatientReports,
    getReport,
    createTextReport,
    uploadFileReport,
    updateReport,
    deleteReport,
    downloadReport
} from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.post('/text', protect, createTextReport);
router.post('/upload', protect, upload.single('file'), uploadFileReport);

// More specific routes must come before general :id route
router.get('/:id/download', protect, downloadReport);
router.get('/patient/:patientId', protect, getPatientReports);

router.route('/:id')
    .get(protect, getReport)
    .put(protect, updateReport)
    .delete(protect, deleteReport);

export default router;
