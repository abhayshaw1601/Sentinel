import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Search, User } from 'lucide-react';
import { patientAPI, authAPI } from '../utils/api';
import './Modal.css';

const AddPatientModal = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        age: '',
        dateOfBirth: '',
        gender: 'male',
        reasonForAdmission: '',
        roomNumber: '',
        bedNumber: '',
        assignedDoctor: '',
        bloodType: '',
        allergies: '',
        medicalHistory: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Doctor dropdown state
    const [staffList, setStaffList] = useState([]);
    const [doctorSearch, setDoctorSearch] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const fetchStaff = async () => {
            try {
                const res = await authAPI.getMyStaff();
                setStaffList(res.data.data || []);
            } catch (err) {
                console.error('Failed to fetch staff:', err);
            }
        };
        fetchStaff();
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSelectDoctor = (staff) => {
        setFormData({ ...formData, assignedDoctor: staff.name });
        setDoctorSearch('');
        setShowDropdown(false);
    };

    const filteredStaff = staffList.filter((s) =>
        s.name.toLowerCase().includes(doctorSearch.toLowerCase()) ||
        (s.designation || '').toLowerCase().includes(doctorSearch.toLowerCase())
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const dataToSend = {
                ...formData,
                age: parseInt(formData.age),
                allergies: formData.allergies ? formData.allergies.split(',').map(a => a.trim()) : []
            };
            await patientAPI.create(dataToSend);
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add patient');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Add New Patient</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label>Full Name *</label>
                            <input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Email * (For Patient Portal)</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="patient@example.com"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Phone Number *</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="e.g. 9876543210"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Age *</label>
                            <input
                                type="number"
                                name="age"
                                value={formData.age}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Date of Birth *</label>
                            <input
                                type="date"
                                name="dateOfBirth"
                                value={formData.dateOfBirth}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Gender *</label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                required
                            >
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Reason for Admission *</label>
                        <textarea
                            name="reasonForAdmission"
                            value={formData.reasonForAdmission}
                            onChange={handleChange}
                            rows="3"
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Room Number</label>
                            <input
                                name="roomNumber"
                                value={formData.roomNumber}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Bed Number</label>
                            <input
                                name="bedNumber"
                                value={formData.bedNumber}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Blood Type</label>
                            <select
                                name="bloodType"
                                value={formData.bloodType}
                                onChange={handleChange}
                            >
                                <option value="">Select...</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                            </select>
                        </div>
                    </div>

                    {/* Assigned Doctor — searchable dropdown */}
                    <div className="form-group" ref={dropdownRef}>
                        <label>Assigned Doctor *</label>
                        <div className="doctor-dropdown">
                            {/* Trigger */}
                            <button
                                type="button"
                                className={`doctor-dropdown-trigger ${showDropdown ? 'open' : ''} ${!formData.assignedDoctor ? 'placeholder' : ''}`}
                                onClick={() => setShowDropdown((v) => !v)}
                            >
                                <User size={16} className="doctor-trigger-icon" />
                                <span className="doctor-trigger-text">
                                    {formData.assignedDoctor || 'Select a doctor...'}
                                </span>
                                <ChevronDown size={16} className={`doctor-chevron ${showDropdown ? 'rotated' : ''}`} />
                            </button>

                            {/* Hidden required input for form validation */}
                            <input
                                type="text"
                                name="assignedDoctor"
                                value={formData.assignedDoctor}
                                onChange={() => {}}
                                required
                                tabIndex={-1}
                                style={{ position: 'absolute', opacity: 0, height: 0, pointerEvents: 'none' }}
                            />

                            {/* Dropdown panel */}
                            {showDropdown && (
                                <div className="doctor-dropdown-panel">
                                    <div className="doctor-search-box">
                                        <Search size={14} className="doctor-search-icon" />
                                        <input
                                            type="text"
                                            className="doctor-search-input"
                                            placeholder="Search by name or designation..."
                                            value={doctorSearch}
                                            onChange={(e) => setDoctorSearch(e.target.value)}
                                            autoFocus
                                        />
                                        {doctorSearch && (
                                            <button
                                                type="button"
                                                className="doctor-search-clear"
                                                onClick={() => setDoctorSearch('')}
                                            >
                                                <X size={12} />
                                            </button>
                                        )}
                                    </div>

                                    <ul className="doctor-list">
                                        {filteredStaff.length > 0 ? (
                                            filteredStaff.map((staff) => (
                                                <li
                                                    key={staff._id}
                                                    className={`doctor-list-item ${formData.assignedDoctor === staff.name ? 'selected' : ''}`}
                                                    onClick={() => handleSelectDoctor(staff)}
                                                >
                                                    <div className="doctor-list-avatar">
                                                        {staff.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="doctor-list-info">
                                                        <span className="doctor-list-name">{staff.name}</span>
                                                        {staff.designation && (
                                                            <span className="doctor-list-designation">{staff.designation}</span>
                                                        )}
                                                    </div>
                                                </li>
                                            ))
                                        ) : (
                                            <li className="doctor-list-empty">
                                                {staffList.length === 0 ? 'No staff found' : 'No results match your search'}
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Allergies (comma-separated)</label>
                        <input
                            name="allergies"
                            value={formData.allergies}
                            onChange={handleChange}
                            placeholder="e.g., Penicillin, Latex"
                        />
                    </div>

                    <div className="form-group">
                        <label>Medical History</label>
                        <textarea
                            name="medicalHistory"
                            value={formData.medicalHistory}
                            onChange={handleChange}
                            rows="3"
                        />
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Adding...' : 'Add Patient'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddPatientModal;
