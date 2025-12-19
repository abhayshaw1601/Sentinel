import express from 'express';
import {
    getPatientVitals,
    getVital,
    createVital,
    updateVital,
    deleteVital,
    getLatestVitals
} from '../controllers/vitalController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
    .post(protect, createVital);

router.route('/:id')
    .get(protect, getVital)
    .put(protect, updateVital)
    .delete(protect, deleteVital);

router.get('/patient/:patientId', protect, getPatientVitals);
router.get('/patient/:patientId/latest', protect, getLatestVitals);

export default router;
