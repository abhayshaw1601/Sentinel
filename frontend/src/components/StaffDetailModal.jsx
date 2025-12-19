import React from 'react';
import { X, Mail, Phone, Clock, Calendar, User, CheckCircle, XCircle } from 'lucide-react';
import './StaffDetailModal.css';

const StaffDetailModal = ({ staff, onClose }) => {
    if (!staff) return null;

    const formatTime = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="modal-overlay fade-in" onClick={onClose}>
            <div className="staff-detail-modal slide-up" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="staff-detail-header">
                    <div className="staff-header-content">
                        <div className="staff-avatar-large">
                            {staff.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2>{staff.name}</h2>
                            <p className="staff-role-badge">{staff.designation || staff.role}</p>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="staff-detail-content">
                    {/* Contact Information */}
                    <div className="detail-section">
                        <h3>Contact Information</h3>
                        <div className="detail-grid">
                            <div className="detail-item">
                                <Mail size={18} className="detail-icon" />
                                <div>
                                    <span className="detail-label">Email</span>
                                    <span className="detail-value">{staff.email}</span>
                                </div>
                            </div>
                            <div className="detail-item">
                                <Phone size={18} className="detail-icon" />
                                <div>
                                    <span className="detail-label">Phone</span>
                                    <span className="detail-value">{staff.phone || 'Not provided'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Account Status */}
                    <div className="detail-section">
                        <h3>Account Status</h3>
                        <div className="detail-grid">
                            <div className="detail-item">
                                {staff.isLoggedIn ? (
                                    <div className="detail-icon success" style={{
                                        width: '18px',
                                        height: '18px',
                                        borderRadius: '50%',
                                        background: '#10b981',
                                        boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.2)'
                                    }} />
                                ) : (
                                    <div className="detail-icon" style={{
                                        width: '18px',
                                        height: '18px',
                                        borderRadius: '50%',
                                        background: '#9ca3af'
                                    }} />
                                )}
                                <div>
                                    <span className="detail-label">Status</span>
                                    <span className={`detail-value ${staff.isLoggedIn ? 'text-success' : 'text-muted'}`}>
                                        {staff.isLoggedIn ? 'Online' : 'Offline'}
                                    </span>
                                </div>
                            </div>
                            <div className="detail-item">
                                <Calendar size={18} className="detail-icon" />
                                <div>
                                    <span className="detail-label">Joined</span>
                                    <span className="detail-value">{formatDate(staff.createdAt)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Shift Information */}
                    <div className="detail-section">
                        <h3>Shift Schedule</h3>
                        {staff.activeSchedule?.shiftName ? (
                            <div className="shift-card">
                                <div className="shift-header">
                                    <Clock size={20} />
                                    <span className="shift-name">{staff.activeSchedule.shiftName}</span>
                                </div>
                                <div className="shift-time">
                                    <div className="time-slot">
                                        <span className="time-label">Start Time</span>
                                        <span className="time-value">{formatTime(staff.activeSchedule.startTime)}</span>
                                    </div>
                                    <div className="time-divider">→</div>
                                    <div className="time-slot">
                                        <span className="time-label">End Time</span>
                                        <span className="time-value">{formatTime(staff.activeSchedule.endTime)}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="no-shift-message">
                                <Clock size={48} />
                                <p>No shift assigned yet</p>
                                <span>Assign a shift to get started</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffDetailModal;
