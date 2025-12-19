import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};

// @desc    Register Admin user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
    try {
        const { email, password, name, phone } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Create user (Force role 'admin' for public registration)
        const user = await User.create({
            email,
            password,
            name,
            role: 'admin',
            phone
        });

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'Admin registered successfully',
            data: {
                user,
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

// @desc    Create Staff User
// @route   POST /api/auth/create-staff
// @access  Private/Admin
export const createStaff = async (req, res) => {
    try {
        const { email, name, phone, designation } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Default password is the staff's name (case sensitive as provided)
        // In production, we'd want to enforce a change on first login
        const password = name;

        const user = await User.create({
            email,
            password,
            name,
            role: 'staff',
            phone,
            designation,
            createdBy: req.user._id,
            isPasswordChanged: false
        });

        res.status(201).json({
            success: true,
            message: 'Staff created successfully. Password is the staff name.',
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get Staff created by current admin
// @route   GET /api/auth/my-staff
// @access  Private/Admin
export const getMyStaff = async (req, res) => {
    try {
        const staff = await User.find({
            createdBy: req.user._id,
            role: 'staff'
        }).sort('-createdAt');

        res.status(200).json({
            success: true,
            count: staff.length,
            data: staff
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
    try {
        const { email, password, loginAs } = req.body; // loginAs: 'admin' | 'staff'

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Check for user (include password for comparison)
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Enforce role check if loginAs is specified
        if (loginAs && user.role !== loginAs) {
            return res.status(401).json({
                success: false,
                message: `Access denied. You are registered as ${user.role}, please login from the correct portal.`
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated. Please contact admin.'
            });
        }

        // Check if password matches
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Set isLoggedIn to true
        user.isLoggedIn = true;
        await user.save({ validateBeforeSave: false });

        const token = generateToken(user._id);

        // Remove password from output
        user.password = undefined;

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user,
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

// @desc    Logout user
// @route   GET /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.isLoggedIn = false;
            await user.save({ validateBeforeSave: false });
        }

        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
export const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide current and new password'
            });
        }

        const user = await User.findById(req.user._id).select('+password');

        // Check current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        user.password = newPassword;
        user.isPasswordChanged = true;
        await user.save();

        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: 'Password updated successfully',
            data: { token }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/updateprofile
// @access  Private
export const updateProfile = async (req, res) => {
    try {
        const { name, phone } = req.body;

        const user = await User.findById(req.user._id);

        if (name) user.name = name;
        if (phone) user.phone = phone;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update Staff Shift (Active Hours)
// @route   PUT /api/auth/staff/:id/shift
// @access  Private/Admin
export const updateStaffShift = async (req, res) => {
    try {
        const { shiftName, startTime, endTime } = req.body;

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Staff not found'
            });
        }

        // Ensure user is actually a staff member
        if (user.role !== 'staff') {
            return res.status(400).json({
                success: false,
                message: 'Can only assign shifts to staff members'
            });
        }

        user.activeSchedule = {
            shiftName,
            startTime,
            endTime
        };

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Staff shift updated successfully',
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete Staff
// @route   DELETE /api/auth/staff/:id
// @access  Private/Admin
export const deleteStaff = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Staff not found'
            });
        }

        if (user.role !== 'staff') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete non-staff users'
            });
        }

        await user.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Staff member deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
