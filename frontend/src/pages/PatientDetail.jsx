import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { patientAPI } from '../utils/api';
import { ArrowLeft, Activity, FileText, UserCheck } from 'lucide-react';
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
    const [sidebarOpen, setSidebarOpen] = useState(true); // Track sidebar state
    const [discharging, setDischarging] = useState(false); // Track discharge process
    // const { updateCriticalIndex } = useCriticalIndex(); // Temporarily disabled

    useEffect(() => {
        fetchPatient();
    }, [id]);

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
        if (!window.confirm(`Are you sure you want to discharge ${patient.name}?`)) {
            return;
        }

        setDischarging(true);
        try {
            await patientAPI.update(id, {
                status: 'discharged',
                dischargeDate: new Date().toISOString()
            });

            // Refresh patient data
            await fetchPatient();

            // Show success message
            alert(`${patient.name} has been successfully discharged.`);

            // Navigate back to dashboard after a short delay
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);

        } catch (error) {
            console.error('Error discharging patient:', error);
            alert('Failed to discharge patient. Please try again.');
        } finally {
            setDischarging(false);
        }
    };

    if (loading) {
        return <div className="loading-container">Loading patient data...</div>;
    }

    if (!patient) {
        return <div className="error-container">Patient not found</div>;
    }

    return (
        <div className={`patient-detail fade-in ${sidebarOpen ? 'sidebar-open' : ''}`}>
            <div className="patient-detail-header">
                <button className="back-btn" onClick={() => navigate('/dashboard')}>
                    <ArrowLeft size={20} />
                    Back to Dashboard
                </button>

                <div className="patient-header-info">
                    <div>            <h1>{patient.name}</h1>
                        <p className="patient-meta">
                            {patient.patientId} • {patient.age} years • {patient.gender}
                        </p>
                    </div>
                    <div className="header-badges">
                        <span className={`badge ${patient.status === 'admitted' ? 'badge-success' : 'badge-info'}`}>
                            {patient.status}
                        </span>
                        {patient.status === 'admitted' && (
                            <button
                                className="discharge-btn"
                                onClick={handleDischarge}
                                disabled={discharging}
                            >
                                <UserCheck size={18} />
                                {discharging ? 'Discharging...' : 'Discharge Patient'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="patient-quick-info">
                    <div className="info-card">
                        <strong>Room/Bed:</strong>
                        <span>{patient.roomNumber}/{patient.bedNumber}</span>
                    </div>
                    <div className="info-card">
                        <strong>Doctor:</strong>
                        <span>{patient.assignedDoctor}</span>
                    </div>
                    <div className="info-card">
                        <strong>Admission:</strong>
                        <span>{new Date(patient.admissionDate).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            <div className="patient-detail-tabs">
                <button
                    className={`tab-btn ${activeTab === 'vitals' ? 'active' : ''}`}
                    onClick={() => setActiveTab('vitals')}
                >
                    <Activity size={20} />
                    Vitals Monitor
                </button>
                <button
                    className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
                    onClick={() => setActiveTab('reports')}
                >
                    <FileText size={20} />
                    Reports & Documents
                </button>
            </div>

            <div className="patient-detail-content">
                {activeTab === 'vitals' && <VitalsMonitor patientId={id} />}
                {activeTab === 'reports' && <ReportsSection patientId={id} />}
            </div>

            {/* AI Assistant - Always present, minimizable */}
            <AIAssistant
                patientId={id}
                patient={patient}
                onStateChange={setSidebarOpen}
                mode="sidebar"
            />
        </div>
    );
};

export default PatientDetail;


