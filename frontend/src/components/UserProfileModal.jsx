import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Save, Briefcase, Clock, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import './UserProfileModal.css';

const UserProfileModal = ({ isOpen, onClose }) => {
    const { user, updateUser } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        designation: '',
        role: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user && isOpen) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                designation: user.designation || '',
                role: user.role || ''
            });
        }
    }, [user, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content profile-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="header-title">
                        <User size={24} className="header-icon" />
                        <h2>My Profile</h2>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="profile-header-card">
                        <div className="profile-avatar">
                            {formData.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="profile-title-info">
                            <h3>{formData.name}</h3>
                            <span className={`role-badge ${formData.role}`}>
                                {formData.role.toUpperCase()}
                            </span>
                        </div>
                        <div className="profile-header-meta">
                            <div className="meta-item">
                                <Clock size={16} />
                                <span>Joined: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="profile-form">
                        <div className="form-group">
                            <label>Full Name</label>
                            <div className="input-wrapper">
                                <User size={18} />
                                <input
                                    type="text"
                                    value={formData.name}
                                    disabled={true}
                                    className="readonly"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Email Address</label>
                            <div className="input-wrapper">
                                <Mail size={18} />
                                <input
                                    type="email"
                                    value={formData.email}
                                    disabled={true}
                                    className="readonly"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Phone Number</label>
                            <div className="input-wrapper">
                                <Phone size={18} />
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    disabled={true}
                                    className="readonly"
                                    placeholder={!formData.phone ? "Not provided" : ""}
                                />
                            </div>
                        </div>

                        {formData.designation && (
                            <div className="form-group">
                                <label>Designation</label>
                                <div className="input-wrapper">
                                    <Briefcase size={18} />
                                    <input
                                        type="text"
                                        value={formData.designation}
                                        disabled={true}
                                        className="readonly"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfileModal;
