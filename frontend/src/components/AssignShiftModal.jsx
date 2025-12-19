import React, { useState } from 'react';
import { X, Calendar, Clock, Sun, Moon, Sunset } from 'lucide-react';
import { authAPI } from '../utils/api';

const AssignShiftModal = ({ staff, onClose, onSuccess }) => {
    const [shiftType, setShiftType] = useState('Morning'); // Morning, Evening, Night
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleShiftSelect = (type) => {
        setShiftType(type);
        // Pre-fill times based on shift type
        if (type === 'Morning') {
            setStartTime('06:00');
            setEndTime('14:00');
        } else if (type === 'Evening') {
            setStartTime('14:00');
            setEndTime('22:00');
        } else if (type === 'Night') {
            setStartTime('22:00');
            setEndTime('06:00');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!date || !startTime || !endTime) {
                throw new Error('Please select date and times');
            }

            // Construct DateTime objects
            const startDateTime = new Date(`${date}T${startTime}`);
            let endDateTime = new Date(`${date}T${endTime}`);

            // Handle overnight shifts (if end time is earlier than start time, add 1 day)
            if (endDateTime < startDateTime) {
                endDateTime.setDate(endDateTime.getDate() + 1);
            }

            await authAPI.updateStaffShift(staff._id, {
                shiftName: shiftType,
                startTime: startDateTime.toISOString(),
                endTime: endDateTime.toISOString()
            });

            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to assign shift');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay fade-in">
            <div className="modal-content slide-up">
                <div className="modal-header">
                    <h2>Assign Shift</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body">
                    <p className="text-muted" style={{ marginBottom: '1rem' }}>
                        Assigning active hours for <strong>{staff.name}</strong> ({staff.designation || 'Staff'})
                    </p>

                    <form onSubmit={handleSubmit} className="modal-form">
                        {error && <div className="alert alert-error">{error}</div>}

                        <div className="form-group">
                            <label>Shift Type</label>
                            <div className="shift-selector" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                <button
                                    type="button"
                                    className={`role-btn ${shiftType === 'Morning' ? 'active' : ''}`}
                                    onClick={() => handleShiftSelect('Morning')}
                                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem' }}
                                >
                                    <Sun size={16} style={{ marginRight: '4px' }} /> Morning
                                </button>
                                <button
                                    type="button"
                                    className={`role-btn ${shiftType === 'Evening' ? 'active' : ''}`}
                                    onClick={() => handleShiftSelect('Evening')}
                                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem' }}
                                >
                                    <Sunset size={16} style={{ marginRight: '4px' }} /> Evening
                                </button>
                                <button
                                    type="button"
                                    className={`role-btn ${shiftType === 'Night' ? 'active' : ''}`}
                                    onClick={() => handleShiftSelect('Night')}
                                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem' }}
                                >
                                    <Moon size={16} style={{ marginRight: '4px' }} /> Night
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Shift Date</label>
                            <div className="input-wrapper">
                                <Calendar size={20} className="input-icon" />
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Start Time</label>
                                <div className="input-wrapper">
                                    <Clock size={20} className="input-icon" />
                                    <input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>End Time</label>
                                <div className="input-wrapper">
                                    <Clock size={20} className="input-icon" />
                                    <input
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                                Cancel
                            </button>
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Assigning...' : 'Confirm Assignment'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AssignShiftModal;
