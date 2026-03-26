import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar, DollarSign, User, Heart,
    Sun, Moon, LogOut, Activity
} from 'lucide-react';
import { patientAPI, vitalsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import logo from '../assets/logo.png';
import './PatientDashboard.css';
import ReportsSection from '../components/ReportsSection';
import MedicalChatbot from '../components/MedicalChatbot';

const PatientDashboard = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const [patient, setPatient] = useState(null);
    const [vitals, setVitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPatientData = async () => {
            try {
                const userStr = localStorage.getItem('user');
                if (!userStr) { navigate('/login'); return; }

                const user = JSON.parse(userStr);
                if (user.role !== 'patient') { navigate('/dashboard'); return; }

                const patientRes = await patientAPI.getById(user._id);
                setPatient(patientRes.data.data);

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

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    if (loading) return (
        <div className={`pd-portal-shell ${isDarkMode ? 'dark' : ''}`}>
            <div className="pd-portal-loading">Loading your portal…</div>
        </div>
    );
    if (error) return (
        <div className={`pd-portal-shell ${isDarkMode ? 'dark' : ''}`}>
            <div className="pd-portal-loading">{error}</div>
        </div>
    );
    if (!patient) return null;

    const admissionDate = new Date(patient.admissionDate);
    const today = new Date();
    const daysAdmitted = Math.ceil(Math.abs(today - admissionDate) / (1000 * 60 * 60 * 24));
    const roomRate = patient.billing?.roomRate || 500;
    const extraCharges = patient.billing?.additionalCharges || 0;
    const estimatedBill = (daysAdmitted * roomRate) + extraCharges;
    const initials = patient.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    return (
        <div className={`pd-portal-shell ${isDarkMode ? 'dark' : ''}`}>
            {/* ── Topbar ── */}
            <header className="pd-portal-topbar">
                <div className="pd-portal-brand">
                    <img src={logo} alt="Sentinel" className="pd-portal-logo" />
                    <div className="pd-portal-brand-text">
                        <div className="pd-portal-brand-name">Sentinel</div>
                        <div className="pd-portal-brand-sub">Patient Portal</div>
                    </div>
                </div>

                <div className="pd-portal-topbar-center">
                    <span className="pd-portal-greeting">
                        Welcome back, <strong>{patient.name}</strong>
                    </span>
                    {patient.roomNumber && (
                        <span className="pd-portal-room-pill">
                            ROOM {patient.roomNumber}{patient.bedNumber ? `-${patient.bedNumber}` : ''}
                        </span>
                    )}
                </div>

                <div className="pd-portal-topbar-actions">
                    <button
                        className="pd-portal-icon-btn"
                        onClick={toggleTheme}
                        title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <button
                        className="pd-portal-icon-btn"
                        onClick={handleLogout}
                        title="Logout"
                    >
                        <LogOut size={18} />
                    </button>
                    <div className="pd-portal-avatar-pill">
                        <div className="pd-portal-avatar">{initials}</div>
                        <div className="pd-portal-user-info">
                            <div className="pd-portal-user-name">{patient.name}</div>
                            <div className="pd-portal-user-role">PATIENT</div>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Content ── */}
            <main className="pd-portal-content">
                {/* Stat cards */}
                <div className="pd-portal-stats">
                    <div className="pd-portal-stat-card">
                        <div className="pd-portal-stat-icon pd-icon-blue">
                            <Calendar size={22} />
                        </div>
                        <div className="pd-portal-stat-info">
                            <p>Days Admitted</p>
                            <h3>{daysAdmitted} Days</h3>
                            <span>Since {admissionDate.toLocaleDateString()}</span>
                        </div>
                    </div>

                    <div className="pd-portal-stat-card">
                        <div className="pd-portal-stat-icon pd-icon-green">
                            <DollarSign size={22} />
                        </div>
                        <div className="pd-portal-stat-info">
                            <p>Estimated Bill</p>
                            <h3>${estimatedBill.toLocaleString()}</h3>
                            <span>Includes Room &amp; Services</span>
                        </div>
                    </div>

                    <div className="pd-portal-stat-card">
                        <div className="pd-portal-stat-icon pd-icon-amber">
                            <User size={22} />
                        </div>
                        <div className="pd-portal-stat-info">
                            <p>Assigned Doctor</p>
                            <h3>{patient.assignedDoctor}</h3>
                            <span>Room: {patient.roomNumber || 'N/A'}</span>
                        </div>
                    </div>

                    <div className="pd-portal-stat-card">
                        <div className="pd-portal-stat-icon pd-icon-cyan">
                            <Activity size={22} />
                        </div>
                        <div className="pd-portal-stat-info">
                            <p>Latest Readings</p>
                            <h3>{vitals.length}</h3>
                            <span>Vitals recorded</span>
                        </div>
                    </div>
                </div>

                {/* Vitals table */}
                <div className="pd-portal-card">
                    <div className="pd-portal-card-header">
                        <Heart size={16} />
                        <h2>Latest Vitals</h2>
                    </div>
                    <div className="pd-portal-table-wrap">
                        <table className="pd-portal-table">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Heart Rate</th>
                                    <th>BP (Sys/Dia)</th>
                                    <th>O₂ Level</th>
                                    <th>Temp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vitals.length > 0 ? (
                                    vitals.slice(0, 5).map((v) => (
                                        <tr key={v._id}>
                                            <td>{new Date(v.timestamp).toLocaleTimeString()}</td>
                                            <td>{v.heartRate} bpm</td>
                                            <td>{v.bloodPressure?.systolic || '--'}/{v.bloodPressure?.diastolic || '--'}</td>
                                            <td>{v.oxygenSaturation}%</td>
                                            <td>{v.temperature ? parseFloat(v.temperature).toFixed(1) : '--'}°C</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="5" className="pd-portal-empty-row">No vitals recorded yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Reports */}
                <div style={{ marginTop: '18px' }}>
                    <ReportsSection patientId={patient._id} readOnly={true} />
                </div>
            </main>

            <MedicalChatbot patientId={patient._id} />
        </div>
    );
};

export default PatientDashboard;
