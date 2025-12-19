import express from 'express';
import {
    register,
    login,
    logout,
    getMe,
    updatePassword,
    updateProfile,
    createStaff,
    getMyStaff,
    updateStaffShift,
    deleteStaff
} from '../controllers/authController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/create-staff', protect, authorize('admin'), createStaff);
router.get('/my-staff', protect, authorize('admin'), getMyStaff);
router.post('/login', login);
router.get('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/updatepassword', protect, updatePassword);
router.put('/updateprofile', protect, updateProfile);
router.put('/staff/:id/shift', protect, authorize('admin'), updateStaffShift);
router.delete('/staff/:id', protect, authorize('admin'), deleteStaff);

export default router;
