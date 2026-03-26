import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { patientAPI } from '../utils/api';
import { ArrowRightLeft, LogOut, FileText, Activity, Pill, ClipboardList } from 'lucide-react';
import VitalsMonitor from '../components/VitalsMonitor';
import ReportsSection from '../components/ReportsSection';
import AIAssistant from '../components/AIAssistant';
import './PatientDetail.css';

const PatientDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('vitals');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [discharging, setDischarging] = useState(false);

    useEffect(() => { fetchPatient(); }, [id]);

    const fetchPatient = async () => {
        try {
            const response = await patientAPI.getById(id);
            setPatient(response.data.data);
        } catch (error) {
            console.error('Error fetching patient:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDischarge = async () => {
        if (!window.confirm(`Are you sure you want to discharge ${patient.name}?`)) return;
        setDischarging(true);
        try {
            await patientAPI.update(id, { status: 'discharged', dischargeDate: new Date().toISOString() });
            await fetchPatient();
            alert(`${patient.name} has been successfully discharged.`);
            setTimeout(() => navigate('/dashboard'), 1500);
        } catch (error) {
            console.error('Error discharging patient:', error);
            alert('Failed to discharge patient. Please try again.');
        } finally {
            setDischarging(false);
        }
    };

    if (loading) return <div className="pd-loading">Loading patient data…</div>;
    if (!patient) return <div className="pd-loading">Patient not found</div>;

    const admissionDate = patient.admissionDate
        ? new Date(patient.admissionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '—';

    const tabs = [
        { key: 'vitals',      label: 'Vitals Monitor',       icon: Activity },
        { key: 'reports',     label: 'Reports & Documents',  icon: FileText },
        { key: 'treatment',   label: 'Treatment Plan',       icon: ClipboardList },
        { key: 'medications', label: 'Medications',          icon: Pill },
    ];

    return (
        <div className={`pd-root fade-in ${sidebarOpen ? 'pd-sidebar-open' : ''}`}>
            {/* ── Header ── */}
            <div className="pd-header">
                <div className="pd-header-left">
                    <div className="pd-avatar">
                        {patient.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="pd-info">
                        <div className="pd-name-row">
                            <h1 className="pd-name">{patient.name}</h1>
                            {patient.roomNumber && (
                                <span className="pd-room-badge">
                                    ROOM {patient.roomNumber}{patient.bedNumber ? `-${patient.bedNumber}` : ''}
                                </span>
                            )}
                        </div>
                        <div className="pd-meta-row">
                            <span className="pd-meta-item">
                                <span className="pd-meta-dot" /> ID: #{patient.patientId}
                            </span>
                            <span className="pd-meta-item">🗓 {patient.age} Years, {patient.gender}</span>
                            <span className="pd-meta-item">📋 Admitted: {admissionDate}</span>
                        </div>
                    </div>
                </div>
                <div className="pd-header-actions">
                    <button className="pd-btn-transfer">
                        <ArrowRightLeft size={15} />
                        Transfer Patient
                    </button>
                    {patient.status === 'admitted' && (
                        <button className="pd-btn-discharge" onClick={handleDischarge} disabled={discharging}>
                            <LogOut size={15} />
                            {discharging ? 'Discharging…' : 'Discharge Patient'}
                        </button>
                    )}
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="pd-tabs">
                {tabs.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        className={`pd-tab ${activeTab === key ? 'active' : ''}`}
                        onClick={() => setActiveTab(key)}
                    >
                        <Icon size={15} />
                        {label}
                    </button>
                ))}
            </div>

            {/* ── Content ── */}
            <div className="pd-content">
                {activeTab === 'vitals'    && <VitalsMonitor patientId={id} />}
                {activeTab === 'reports'   && <ReportsSection patientId={id} />}
                {(activeTab === 'treatment' || activeTab === 'medications') && (
                    <div className="pd-placeholder">
                        <ClipboardList size={40} className="pd-placeholder-icon" />
                        <p>This section is coming soon.</p>
                    </div>
                )}
            </div>

            <AIAssistant patientId={id} patient={patient} onStateChange={setSidebarOpen} mode="sidebar" />
        </div>
    );
};

export default PatientDetail;
