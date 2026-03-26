import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientAPI } from '../utils/api';
import {
    UserPlus,
    Search,
    Eye,
    LogOut,
    RotateCcw,
    Trash2,
    RefreshCw,
    Users
} from 'lucide-react';
import AddPatientModal from '../components/AddPatientModal';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Patients = () => {
    const [admittedPatients, setAdmittedPatients] = useState([]);
    const [dischargedPatients, setDischargedPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [patientSearch, setPatientSearch] = useState('');
    const [patientViewMode, setPatientViewMode] = useState('admitted');
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const [admittedRes, dischargedRes] = await Promise.all([
                patientAPI.getAll({ status: 'admitted' }),
                patientAPI.getAll({ status: 'discharged' })
            ]);
            setAdmittedPatients(admittedRes.data.data);
            setDischargedPatients(dischargedRes.data.data);
        } catch (error) {
            console.error('Error fetching patients:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleDischargePatient = async (id) => {
        if (!window.confirm('Discharge this patient?')) return;
        try { await patientAPI.discharge(id); fetchData(); }
        catch { alert('Failed to discharge patient'); }
    };

    const handleReadmitPatient = async (id) => {
        if (!window.confirm('Readmit this patient?')) return;
        try { await patientAPI.readmit(id); fetchData(); }
        catch { alert('Failed to readmit patient'); }
    };

    const handleDeletePatient = async (id) => {
        if (!window.confirm('Delete this patient record? This cannot be undone.')) return;
        try { await patientAPI.delete(id); fetchData(); }
        catch { alert('Failed to delete patient'); }
    };

    const source = patientViewMode === 'admitted' ? admittedPatients : dischargedPatients;
    const visiblePatients = patientSearch
        ? source.filter(p =>
            p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
            (p.patientId && p.patientId.toLowerCase().includes(patientSearch.toLowerCase()))
          )
        : source;

    return (
        <div className="clinical-dashboard fade-in">
            <div className="clinical-header">
                <div>
                    <h1 className="clinical-title">Patients</h1>
                    <p className="clinical-subtitle">Manage all admitted and discharged patients.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <button className="metric-icon-btn" onClick={() => fetchData(false)} title="Refresh">
                        <RefreshCw size={16} className={loading ? 'spinning' : ''} />
                    </button>
                    <button className="btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
                        <UserPlus size={16} /> Add Patient
                    </button>
                </div>
            </div>

            <div className="clinical-metrics">
                <div className="clinical-metric-card">
                    <div className="metric-top"><span className="metric-kicker">Total Patients</span></div>
                    <div className="metric-number">{admittedPatients.length + dischargedPatients.length}</div>
                    <div className="metric-foot">All records</div>
                </div>
                <div className="clinical-metric-card accent-green">
                    <div className="metric-top"><span className="metric-kicker">Admitted</span></div>
                    <div className="metric-number">{admittedPatients.length}</div>
                </div>
                <div className="clinical-metric-card accent-red">
                    <div className="metric-top"><span className="metric-kicker">Discharged</span></div>
                    <div className="metric-number">{dischargedPatients.length}</div>
                </div>
            </div>

            <section className="clinical-card" style={{ marginTop: '1.5rem' }}>
                <div className="clinical-card-head">
                    <h3>Patient Records</h3>
                </div>

                <div className="clinical-toolbar">
                    <div className="clinical-tabs">
                        <button
                            className={`clinical-tab ${patientViewMode === 'admitted' ? 'active' : ''}`}
                            onClick={() => setPatientViewMode('admitted')}
                        >Admitted</button>
                        <button
                            className={`clinical-tab ${patientViewMode === 'discharged' ? 'active' : ''}`}
                            onClick={() => setPatientViewMode('discharged')}
                        >Discharged</button>
                    </div>
                    <div className="clinical-actions">
                        <div className="clinical-search">
                            <Search size={14} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search by name or ID..."
                                value={patientSearch}
                                onChange={(e) => setPatientSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="table-wrapper">
                    <table className="dense-data-table">
                        <thead>
                            <tr>
                                <th>Patient Name</th>
                                <th>Ward / Bed</th>
                                <th>Condition</th>
                                <th>Status</th>
                                <th className="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" className="text-center p-4">Loading patients...</td></tr>
                            ) : visiblePatients.length === 0 ? (
                                <tr><td colSpan="5" className="text-center p-4">
                                    <Users size={32} style={{ opacity: 0.3, display: 'block', margin: '0 auto 0.5rem' }} />
                                    No patients found.
                                </td></tr>
                            ) : (
                                visiblePatients.map(patient => (
                                    <tr key={patient._id} onClick={() => navigate(`/patient/${patient._id}`)} className="clickable-row">
                                        <td className="fw-500">
                                            <div className="patient-name-cell">
                                                <div className="patient-initial">{patient.name?.charAt(0)?.toUpperCase()}</div>
                                                <div>
                                                    <div className="patient-name">{patient.name}</div>
                                                    <div className="patient-id">ID: {patient.patientId}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            {patient.roomNumber ? `Ward 4C / R-${patient.roomNumber}` : 'Ward 4C'}{' '}
                                            <span className="text-muted">•</span>{' '}
                                            {patient.bedNumber ? `Bed ${patient.bedNumber}` : 'Bed —'}
                                        </td>
                                        <td>{patient.diagnosis || <span className="text-muted">—</span>}</td>
                                        <td>
                                            <span className={`badge ${patient.status === 'admitted' ? 'badge-success' : 'badge-info'}`}>
                                                {patient.status === 'admitted' ? 'Admitted' : 'Discharged'}
                                            </span>
                                        </td>
                                        <td className="text-center" onClick={(e) => e.stopPropagation()}>
                                            <div className="row-actions">
                                                <button className="icon-btn-sm" onClick={() => navigate(`/patient/${patient._id}`)} title="View"><Eye size={14} /></button>
                                                {patient.status === 'admitted' ? (
                                                    <button className="icon-btn-sm success" onClick={() => handleDischargePatient(patient._id)} title="Discharge"><LogOut size={14} /></button>
                                                ) : (
                                                    <>
                                                        <button className="icon-btn-sm warning" onClick={() => handleReadmitPatient(patient._id)} title="Readmit"><RotateCcw size={14} /></button>
                                                        <button className="icon-btn-sm danger" onClick={() => handleDeletePatient(patient._id)} title="Delete"><Trash2 size={14} /></button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {showAddModal && (
                <AddPatientModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => { setShowAddModal(false); fetchData(); }}
                />
            )}
        </div>
    );
};

export default Patients;
