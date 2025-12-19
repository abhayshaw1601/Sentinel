import React, { useState } from 'react';
import { X, UserPlus, Mail, Phone, User } from 'lucide-react';
import { authAPI } from '../utils/api';

const AddStaffModal = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        designation: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await authAPI.createStaff(formData);
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create staff member');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay fade-in">
            <div className="modal-content slide-up">
                <div className="modal-header">
                    <h2>Add New Staff Member</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    {error && <div className="alert alert-error">{error}</div>}

                    <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                        The new staff member will be able to login using their name as the initial password.
                    </p>

                    <div className="form-group">
                        <label>Full Name</label>
                        <div className="input-wrapper">
                            <User size={20} className="input-icon" />
                            <input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Staff Name"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Email Address</label>
                        <div className="input-wrapper">
                            <Mail size={20} className="input-icon" />
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="staff@hospital.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Phone Number</label>
                        <div className="input-wrapper">
                            <Phone size={20} className="input-icon" />
                            <input
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+1 234 567 890"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Role / Designation</label>
                        <div className="input-wrapper">
                            <User size={20} className="input-icon" />
                            <input
                                name="designation"
                                value={formData.designation}
                                onChange={handleChange}
                                placeholder="e.g. Doctor, Nurse, Technician"
                                required
                            />
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? (
                                'Creating...'
                            ) : (
                                <>
                                    <UserPlus size={20} />
                                    Add Staff
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddStaffModal;
