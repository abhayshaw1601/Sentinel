import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar, DollarSign,
    User, Heart
} from 'lucide-react';
import { patientAPI, vitalsAPI } from '../utils/api';
import './PatientDashboard.css';
import ReportsSection from '../components/ReportsSection';
import MedicalChatbot from '../components/MedicalChatbot';

const PatientDashboard = () => {
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [vitals, setVitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load Patient Data
    useEffect(() => {
        const fetchPatientData = async () => {
            try {
                const userStr = localStorage.getItem('user');
                if (!userStr) {
                    navigate('/login');
                    return;
                }

                const user = JSON.parse(userStr);
                if (user.role !== 'patient') {
                    navigate('/dashboard'); // Staff shouldn't be here typically, or redirect them
                    return;
                }

                // 1. Get Patient Details
                // Ideally backend /auth/me or just use stored ID if we trust it enough (for MVP)
                // Better: Fetch fresh data using the ID from session
                const patientRes = await patientAPI.getById(user._id);
                setPatient(patientRes.data.data);

                // 2. Get Vitals
                const vitalsRes = await vitalsAPI.getPatientVitals(user._id);
                setVitals(vitalsRes.data.data);

            } catch (err) {
                console.error(err);
                setError('Failed to load your medical data.');
            } finally {
                setLoading(false);
            }
        };

        fetchPatientData();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    if (loading) return <div className="loading-spinner">Loading your portal...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (!patient) return null;

    // Calculations
    const admissionDate = new Date(patient.admissionDate);
    const today = new Date();
    const timeDiff = Math.abs(today - admissionDate);
    const daysAdmitted = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    // Billing Logic (Safe defaults)
    const roomRate = patient.billing?.roomRate || 500;
    const extraCharges = patient.billing?.additionalCharges || 0;
    const estimatedBill = (daysAdmitted * roomRate) + extraCharges;

    return (
        <div className="dashboard-container">
            {/* Header */}
            <main className="dashboard-content">
                {/* Status Cards */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#e0e7ff', color: '#667eea' }}>
                            <Calendar size={24} />
                        </div>
                        <div className="stat-info">
                            <p>Days Admitted</p>
                            <h3>{daysAdmitted} Days</h3>
                            <span className="stat-trend">Since {admissionDate.toLocaleDateString()}</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#dcfce7', color: '#10b981' }}>
                            <DollarSign size={24} />
                        </div>
                        <div className="stat-info">
                            <p>Estimated Bill</p>
                            <h3>${estimatedBill.toLocaleString()}</h3>
                            <span className="stat-trend">Includes Room & Services</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#fee2e2', color: '#ef4444' }}>
                            <User size={24} />
                        </div>
                        <div className="stat-info">
                            <p>Assigned Doctor</p>
                            <h3>{patient.assignedDoctor}</h3>
                            <span className="stat-trend">Room: {patient.roomNumber || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="dashboard-grid">
                    {/* Vitals History */}
                    <div className="dashboard-card" style={{ gridColumn: 'span 12' }}>
                        <div className="card-header">
                            <h2><Heart size={20} /> Latest Vitals</h2>
                        </div>
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Time</th>
                                        <th>Heart Rate</th>
                                        <th>BP (Sys/Dia)</th>
                                        <th>O2 Level</th>
                                        <th>Temp</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {vitals.length > 0 ? (
                                        vitals.slice(0, 5).map((vital) => (
                                            <tr key={vital._id}>
                                                <td>{new Date(vital.timestamp).toLocaleTimeString()}</td>
                                                <td>{vital.heartRate} bpm</td>
                                                <td>
                                                    {vital.bloodPressure?.systolic || '--'}/{vital.bloodPressure?.diastolic || '--'}
                                                </td>
                                                <td>{vital.oxygenSaturation}%</td>
                                                <td>{vital.temperature}°C</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="5">No vitals recorded yet.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Full Width Reports Section */}
                <div style={{ marginTop: '2rem' }}>
                    <ReportsSection patientId={patient._id} readOnly={true} />
                </div>
            </main>

            {/* AI Medical Chatbot */}
            <MedicalChatbot patientId={patient._id} />
        </div>
    );
};

export default PatientDashboard;
