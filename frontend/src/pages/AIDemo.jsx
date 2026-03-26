import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain, Users, Loader } from 'lucide-react';
import AIAssistant from '../components/AIAssistant';
import { useCriticalIndex } from '../context/CriticalIndexContext';
import { patientAPI } from '../utils/api';
import './AIDemo.css';

const AIDemo = () => {
    const navigate = useNavigate();
    const { updateCriticalIndex } = useCriticalIndex();

    // State for real data
    const [patients, setPatients] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch patients on mount
    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const response = await patientAPI.getAll();
                const patientList = response.data.data;
                setPatients(patientList);

                // Auto-select first patient if available
                if (patientList.length > 0) {
                    setSelectedPatientId(patientList[0]._id);
                }
            } catch (err) {
                console.error("Failed to load patients:", err);
                setError("Failed to load patient list. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchPatients();
    }, []);

    const selectedPatient = patients.find(p => p._id === selectedPatientId);

    if (loading) {
        return (
            <div className="ai-demo-page loading-center">
                <Loader className="spinning" size={40} />
                <p>Loading patient data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="ai-demo-page error-center">
                <p className="error-text">{error}</p>
                <button className="btn-secondary" onClick={() => window.location.reload()}>Retry</button>
            </div>
        );
    }

    return (
        <div className="ai-demo-page fade-in">
            {/* Analysis Header */}
            <div className="analysis-header">
                <div className="header-left">
                    <Brain className="brain-icon-pulse" size={28} />
                    <div>
                        <h1>AI Full Analysis</h1>
                        <p className="text-muted">Comprehensive AI insights for patient care</p>
                    </div>
                </div>

                <div className="patient-selector">
                    <Users size={20} className="selector-icon" />
                    <select
                        value={selectedPatientId}
                        onChange={(e) => setSelectedPatientId(e.target.value)}
                        className="patient-select-input"
                    >
                        {patients.map(patient => (
                            <option key={patient._id} value={patient._id}>
                                {patient.name} (Room {patient.roomNumber || 'N/A'})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="demo-content">
                {selectedPatient ? (
                    <AIAssistant
                        key={selectedPatient._id} // Force re-render on patient change
                        patientId={selectedPatient._id}
                        patient={selectedPatient}
                        onCriticalIndexChange={(indexData) => updateCriticalIndex(selectedPatient._id, indexData)}
                        mode="full"
                        demoMode={false} // REAL DATA MODE
                    />
                ) : (
                    <div className="empty-analysis-state">
                        <Users size={48} />
                        <h3>No Patients Found</h3>
                        <p>Add patients to your dashboard to enable AI analysis.</p>
                        <button className="btn-primary" onClick={() => navigate('/dashboard')}>
                            Go to Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIDemo;