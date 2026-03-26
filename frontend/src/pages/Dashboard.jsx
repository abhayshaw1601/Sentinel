import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientAPI, authAPI } from '../utils/api';
import {
    UserPlus,
    Search,
    Users,
    RefreshCw,
    Clock,
    Trash2,
    Eye,
    LogOut,
    RotateCcw
} from 'lucide-react';
import AddPatientModal from '../components/AddPatientModal';
import AddStaffModal from '../components/AddStaffModal';
import AssignShiftModal from '../components/AssignShiftModal';
import StaffDetailModal from '../components/StaffDetailModal';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
    const [admittedPatients, setAdmittedPatients] = useState([]);
    const [dischargedPatients, setDischargedPatients] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [showAssignShiftModal, setShowAssignShiftModal] = useState(false);

    // Selection state
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [showStaffDetailModal, setShowStaffDetailModal] = useState(false);

    // Independent searches
    const [patientSearch, setPatientSearch] = useState('');

    // View mode
    const [patientViewMode, setPatientViewMode] = useState('admitted'); // 'admitted' | 'discharged'

    // Staff state
    const [myStaff, setMyStaff] = useState([]);

    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        fetchData(); // Initial load

        // Poll for updates every 10 seconds to keep staff status fresh
        const intervalId = setInterval(() => {
            fetchData(true);
        }, 10000);

        return () => clearInterval(intervalId);
    }, [user]);

    const fetchData = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const admittedRes = await patientAPI.getAll({ status: 'admitted' });
            const dischargedRes = await patientAPI.getAll({ status: 'discharged' });

            setAdmittedPatients(admittedRes.data.data);
            setDischargedPatients(dischargedRes.data.data);

            if (user?.role === 'admin') {
                const staffRes = await authAPI.getMyStaff();
                if (staffRes.data.success) setMyStaff(staffRes.data.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handlePatientAdded = () => { setShowAddModal(false); fetchData(); };
    const handleStaffAdded = () => { setShowStaffModal(false); alert('Staff member created successfully!'); fetchData(); };

    const handleDischargePatient = async (id) => {
        if (!window.confirm('Are you sure you want to discharge this patient?')) return;
        try {
            await patientAPI.discharge(id);
            fetchData(); // Refresh lists
        } catch (error) {
            console.error('Discharge failed:', error);
            alert('Failed to discharge patient');
        }
    };

    const handleReadmitPatient = async (id) => {
        if (!window.confirm('Are you sure you want to readmit this patient?')) return;
        try {
            await patientAPI.readmit(id);
            fetchData(); // Refresh lists
        } catch (error) {
            console.error('Readmit failed:', error);
            alert('Failed to readmit patient');
        }
    };

    const handleDeletePatient = async (id) => {
        if (!window.confirm('Are you sure you want to delete this patient?')) return;
        try {
            await patientAPI.delete(id);
            fetchData();
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete patient');
        }
    };

    const handleDeleteStaff = async (id) => {
        if (!window.confirm('Are you sure you want to delete this staff member? This action cannot be undone.')) return;
        try {
            await authAPI.deleteStaff(id);
            fetchData();
        } catch (error) {
            console.error('Failed to delete staff:', error);
            alert('Failed to delete staff');
        }
    };

    const handleAssignShift = (staff) => {
        setSelectedStaff(staff);
        setShowAssignShiftModal(true);
    };

    const handleShiftAssigned = () => {
        setShowAssignShiftModal(false);
        setSelectedStaff(null);
        fetchData();
    };

    // Filter Logic
    const filterStaff = () => myStaff;

    const filterPatients = () => {
        const source = patientViewMode === 'admitted' ? admittedPatients : dischargedPatients;
        if (!patientSearch) return source;
        return source.filter(p =>
            p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
            (p.patientId && p.patientId.toLowerCase().includes(patientSearch.toLowerCase()))
        );
    };

    const visibleStaff = filterStaff();
    const visiblePatients = filterPatients();

    return (
        <div className="clinical-dashboard fade-in">
            <div className="clinical-header">
                <div>
                    <h1 className="clinical-title">Clinical Dashboard</h1>
                    <p className="clinical-subtitle">Real-time oversight of Ward 4C — North Wing.</p>
                </div>
                <div className="system-pill">
                    <span className="system-dot" />
                    <span>System Online</span>
                </div>
            </div>

            <div className="clinical-metrics">
                <div className="clinical-metric-card">
                    <div className="metric-top">
                        <span className="metric-kicker">Total Patients</span>
                        <button className="metric-icon-btn" onClick={() => fetchData(false)} title="Refresh">
                            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
                        </button>
                    </div>
                    <div className="metric-number">{admittedPatients.length + dischargedPatients.length}</div>
                    <div className="metric-foot">Since last shift</div>
                </div>
                <div className="clinical-metric-card accent-green">
                    <div className="metric-top">
                        <span className="metric-kicker">Admitted</span>
                        <span className="metric-mini">Today’s check-ins</span>
                    </div>
                    <div className="metric-number">{admittedPatients.length}</div>
                </div>
                <div className="clinical-metric-card accent-red">
                    <div className="metric-top">
                        <span className="metric-kicker">Discharged</span>
                        <span className="metric-mini">Processing</span>
                    </div>
                    <div className="metric-number">{dischargedPatients.length}</div>
                </div>
            </div>

            {user?.role === 'staff' && user.activeSchedule?.shiftName && (
                <div className="active-shift-banner fade-in">
                    <Clock size={20} />
                    <div>
                        <h3>Active Shift: {user.activeSchedule.shiftName}</h3>
                        <p>
                            {new Date(user.activeSchedule.startTime).toLocaleString()} - {new Date(user.activeSchedule.endTime).toLocaleString()}
                        </p>
                    </div>
                </div>
            )}

            <div className="clinical-grid">
                <section className="clinical-card">
                    <div className="clinical-card-head">
                        <h3>Recent Patient Updates</h3>
                        <button className="link-btn" onClick={() => setPatientViewMode('admitted')}>
                            View All Patients
                        </button>
                    </div>

                    <div className="clinical-toolbar">
                        <div className="clinical-tabs">
                            <button
                                className={`clinical-tab ${patientViewMode === 'admitted' ? 'active' : ''}`}
                                onClick={() => setPatientViewMode('admitted')}
                            >
                                Admitted
                            </button>
                            <button
                                className={`clinical-tab ${patientViewMode === 'discharged' ? 'active' : ''}`}
                                onClick={() => setPatientViewMode('discharged')}
                            >
                                Discharged
                            </button>
                        </div>

                        <div className="clinical-actions">
                            <div className="clinical-search">
                                <Search size={14} className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search patients..."
                                    value={patientSearch}
                                    onChange={(e) => setPatientSearch(e.target.value)}
                                />
                            </div>
                            <button className="btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
                                <UserPlus size={16} /> Add Patient
                            </button>
                        </div>
                    </div>

                    <div className="table-wrapper">
                        <table className="dense-data-table">
                            <thead>
                                <tr>
                                    <th>Patient Name</th>
                                    <th>Ward / Bed</th>
                                    <th>Status</th>
                                    <th className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="4" className="text-center p-4">Loading data...</td></tr>
                                ) : visiblePatients.length === 0 ? (
                                    <tr><td colSpan="4" className="text-center p-4">No patients found.</td></tr>
                                ) : (
                                    visiblePatients.slice(0, 8).map(patient => (
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
                                            <td>
                                                <span className={`badge ${patient.status === 'admitted' ? 'badge-success' : 'badge-info'}`}>
                                                    {patient.status === 'admitted' ? 'Stable' : 'Review'}
                                                </span>
                                            </td>
                                            <td className="text-center" onClick={(e) => e.stopPropagation()}>
                                                <div className="row-actions">
                                                    <button className="icon-btn-sm" onClick={() => navigate(`/patient/${patient._id}`)} title="View">
                                                        <Eye size={14} />
                                                    </button>
                                                    {patient.status === 'admitted' ? (
                                                        <button
                                                            className="icon-btn-sm success"
                                                            onClick={() => handleDischargePatient(patient._id)}
                                                            title="Discharge Patient"
                                                        >
                                                            <LogOut size={14} />
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button
                                                                className="icon-btn-sm warning"
                                                                onClick={() => handleReadmitPatient(patient._id)}
                                                                title="Readmit Patient"
                                                            >
                                                                <RotateCcw size={14} />
                                                            </button>
                                                            <button
                                                                className="icon-btn-sm danger"
                                                                onClick={() => handleDeletePatient(patient._id)}
                                                                title="Delete Record"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
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

                <section className="clinical-card staff-card">
                    <div className="clinical-card-head">
                        <div className="staff-head-left">
                            <h3>My Staff Team</h3>
                            <span className="staff-online-count">{visibleStaff.filter(s => s.isLoggedIn).length} online</span>
                        </div>
                        {user?.role === 'admin' && (
                            <button className="btn-secondary btn-sm" onClick={() => setShowStaffModal(true)}>
                                <Users size={16} /> Manage
                            </button>
                        )}
                    </div>

                    <div className="staff-list">
                        {(user?.role === 'admin' ? visibleStaff : []).slice(0, 4).map((staff) => (
                            <button
                                key={staff._id}
                                className="staff-row"
                                onClick={() => { setSelectedStaff(staff); setShowStaffDetailModal(true); }}
                            >
                                <div className="staff-avatar">
                                    {staff.name?.charAt(0)?.toUpperCase()}
                                    <span className={`staff-dot ${staff.isLoggedIn ? 'online' : 'offline'}`} />
                                </div>
                                <div className="staff-meta">
                                    <div className="staff-name">{staff.name}</div>
                                    <div className="staff-shift">
                                        {staff.activeSchedule?.shiftName ? (
                                            <>
                                                Shift: {staff.activeSchedule.shiftName}{' '}
                                                <span className="text-muted">
                                                    ({new Date(staff.activeSchedule.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(staff.activeSchedule.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-muted">Off-duty</span>
                                        )}
                                    </div>
                                </div>
                                <div className="staff-actions">
                                    {user?.role === 'admin' && (
                                        <>
                                            <button className="icon-btn-sm success" onClick={(e) => { e.stopPropagation(); handleAssignShift(staff); }} title="Assign Shift">
                                                <Clock size={14} />
                                            </button>
                                            <button className="icon-btn-sm danger" onClick={(e) => { e.stopPropagation(); handleDeleteStaff(staff._id); }} title="Delete">
                                                <Trash2 size={14} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </button>
                        ))}

                        {user?.role !== 'admin' && (
                            <div className="empty-staff">
                                <p className="text-muted">Staff panel is available for administrators.</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {showAddModal && <AddPatientModal onClose={() => setShowAddModal(false)} onSuccess={handlePatientAdded} />}
            {showStaffModal && <AddStaffModal onClose={() => setShowStaffModal(false)} onSuccess={handleStaffAdded} />}

            {showAssignShiftModal && selectedStaff && (
                <AssignShiftModal
                    staff={selectedStaff}
                    onClose={() => setShowAssignShiftModal(false)}
                    onSuccess={handleShiftAssigned}
                />
            )}

            {showStaffDetailModal && selectedStaff && (
                <StaffDetailModal
                    staff={selectedStaff}
                    onClose={() => {
                        setShowStaffDetailModal(false);
                        setSelectedStaff(null);
                    }}
                />
            )}
        </div>
    );
};

export default Dashboard;
