import express from 'express';
import {
    getPatients,
    getPatient,
    createPatient,
    updatePatient,
    deletePatient,
    dischargePatient
} from '../controllers/patientController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
    .get(protect, getPatients)
    .post(protect, createPatient);

router.route('/:id')
    .get(protect, getPatient)
    .put(protect, updatePatient)
    .delete(protect, authorize('admin'), deletePatient);

router.put('/:id/discharge', protect, dischargePatient);

export default router;
