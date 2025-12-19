import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientAPI, authAPI } from '../utils/api';
import {
    Plus,
    UserPlus,
    Search,
    Users,
    UserCheck,
    Activity,
    RefreshCw,
    Lock,
    Clock,
    Trash2,
    Eye,
    Mail,
    Phone,
    LogOut,
    RotateCcw
} from 'lucide-react';
import logo from '../assets/logo.png';
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
    const [staffSearch, setStaffSearch] = useState('');

    // View mode
    const [patientViewMode, setPatientViewMode] = useState('admitted'); // 'admitted' | 'discharged'

    // Staff state
    const [myStaff, setMyStaff] = useState([]);

    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            setLoading(true);
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
            setLoading(false);
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
    const filterStaff = () => {
        if (!staffSearch) return myStaff;
        return myStaff.filter(s =>
            s.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
            s.email.toLowerCase().includes(staffSearch.toLowerCase())
        );
    };

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
        <div className="dashboard fade-in">
            {/* Metrics Cards */}
            <div className="metrics-cards-grid">
                <div className="metric-card">
                    <div className="metric-card-header">
                        <span className="metric-label">Admitted</span>
                        <RefreshCw size={16} className={`refresh-icon ${loading ? 'spinning' : ''}`} onClick={fetchData} title="Refresh" />
                    </div>
                    <div className="metric-value-large">{admittedPatients.length}</div>
                </div>
                <div className="metric-card">
                    <div className="metric-card-header">
                        <span className="metric-label">Discharged</span>
                    </div>
                    <div className="metric-value-large">{dischargedPatients.length}</div>
                </div>
                <div className="metric-card highlight">
                    <div className="metric-card-header">
                        <span className="metric-label">Total Patients</span>
                    </div>
                    <div className="metric-value-large">{admittedPatients.length + dischargedPatients.length}</div>
                </div>
            </div>

            {/* ACTIVE SHIFT DISPLAY FOR STAFF */}
            {user?.role === 'staff' && user.activeSchedule && user.activeSchedule.shiftName && (
                <div className="active-shift-banner fade-in">
                    <Clock size={24} />
                    <div>
                        <h3>Active Shift: {user.activeSchedule.shiftName}</h3>
                        <p>
                            {new Date(user.activeSchedule.startTime).toLocaleString()} - {new Date(user.activeSchedule.endTime).toLocaleString()}
                        </p>
                    </div>
                </div>
            )}

            <div className="dashboard-layout">
                {/* 2. Staff Section (Table Layout) - Admin Only */}
                {user?.role === 'admin' && (
                    <section className="dashboard-section staff-section">
                        <div className="section-header">
                            <h3>My Staff Team</h3>
                            <div className="section-header-actions">
                                <div className="section-search">
                                    <Search size={14} className="search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Search staff..."
                                        value={staffSearch}
                                        onChange={(e) => setStaffSearch(e.target.value)}
                                    />
                                </div>
                                <button className="btn-primary btn-sm" onClick={() => setShowStaffModal(true)}>
                                    <Users size={16} /> Add Staff
                                </button>
                            </div>
                        </div>

                        <div className="table-wrapper">
                            <table className="dense-data-table staff-table">
                                <thead>
                                    <tr>
                                        <th>Staff Name</th>
                                        <th>Email</th>
                                        <th>Designation</th>
                                        <th>Status</th>
                                        <th>Active Shift</th>
                                        <th className="text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleStaff.length === 0 ? (
                                        <tr><td colSpan="6" className="text-center p-4">No staff members found.</td></tr>
                                    ) : (
                                        visibleStaff.map(staff => (
                                            <tr key={staff._id}>
                                                <td>
                                                    <div className="staff-name-cell">
                                                        <div className="staff-avatar-small">
                                                            {staff.name.charAt(0).toUpperCase()}
                                                            <div className={`status-dot ${staff.isLoggedIn ? 'online' : 'offline'}`}></div>
                                                        </div>
                                                        <div>
                                                            <div className="fw-500">{staff.name}</div>
                                                            <span className="role-badge-small">{staff.designation || staff.role}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{staff.email}</td>
                                                <td>{staff.designation || staff.role}</td>
                                                <td>
                                                    <span className={`status-badge ${staff.isLoggedIn ? 'online' : 'offline'}`}>
                                                        {staff.isLoggedIn ? 'Online' : 'Offline'}
                                                    </span>
                                                </td>
                                                <td>
                                                    {staff.activeSchedule?.shiftName ? (
                                                        <div className="shift-info">
                                                            <span className="shift-name-small">{staff.activeSchedule.shiftName}</span>
                                                            <span className="shift-time-small">
                                                                {new Date(staff.activeSchedule.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(staff.activeSchedule.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted">No active shift</span>
                                                    )}
                                                </td>
                                                <td className="text-center" onClick={(e) => e.stopPropagation()}>
                                                    <div className="row-actions">
                                                        <button className="icon-btn-sm" onClick={() => { setSelectedStaff(staff); setShowStaffDetailModal(true); }} title="View">
                                                            <Eye size={14} />
                                                        </button>
                                                        <button className="icon-btn-sm success" onClick={() => handleAssignShift(staff)} title="Assign Shift">
                                                            <Clock size={14} />
                                                        </button>
                                                        <button className="icon-btn-sm danger" onClick={() => handleDeleteStaff(staff._id)} title="Delete">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {/* 3. Patient Section (Tabs + Data Table) */}
                <section className="dashboard-section patient-section">
                    <div className="section-header">
                        <h3>Patients</h3>
                        <div className="section-header-actions">
                            <div className="section-search">
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
                    <div className="section-toolbar">
                        <div className="view-mode-tabs">
                            <button
                                className={`view-tab ${patientViewMode === 'admitted' ? 'active' : ''}`}
                                onClick={() => setPatientViewMode('admitted')}
                            >
                                Admitted Patients
                            </button>
                            <button
                                className={`view-tab ${patientViewMode === 'discharged' ? 'active' : ''}`}
                                onClick={() => setPatientViewMode('discharged')}
                            >
                                Discharged Patients
                            </button>
                        </div>
                    </div>

                    <div className="table-wrapper">
                        <table className="dense-data-table">
                            <thead>
                                <tr>
                                    <th>Patient Name</th>
                                    <th>ID</th>
                                    <th>Age/Sex</th>
                                    <th>Room</th>
                                    <th>Admission Date</th>
                                    <th className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="6" className="text-center p-4">Loading data...</td></tr>
                                ) : visiblePatients.length === 0 ? (
                                    <tr><td colSpan="6" className="text-center p-4">No patients found in this view.</td></tr>
                                ) : (
                                    visiblePatients.map(patient => (
                                        <tr key={patient._id} onClick={() => navigate(`/patient/${patient._id}`)} className="clickable-row">
                                            <td className="fw-500">{patient.name}</td>
                                            <td><span className="id-badge">{patient.patientId}</span></td>
                                            <td>{patient.age} / {patient.gender}</td>
                                            <td>
                                                {patient.roomNumber ? `R-${patient.roomNumber}` : '-'}
                                                <span className="text-muted"> / </span>
                                                {patient.bedNumber ? `B-${patient.bedNumber}` : '-'}
                                            </td>
                                            <td>{new Date(patient.admissionDate).toLocaleDateString()}</td>
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
