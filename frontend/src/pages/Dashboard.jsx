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
    LogOut
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
            {/* 1. Header & Summary Strip */}
            <div className="dashboard-summary-strip">
                <div className="summary-left">
                    <div className="dashboard-title">
                        <img src={logo} alt="S" className="brand-icon" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                        <h2>Dashboard</h2>
                    </div>

                    <div className="divider-vertical"></div>
                    <div className="metrics-group">
                        <div className="metric-item">
                            <span className="label">Admitted</span>
                            <span className="value">{admittedPatients.length}</span>
                        </div>
                        <div className="metric-item">
                            <span className="label">Discharged</span>
                            <span className="value">{dischargedPatients.length}</span>
                        </div>
                        <div className="metric-item highlight">
                            <span className="label">Total</span>
                            <span className="value">{admittedPatients.length + dischargedPatients.length}</span>
                        </div>
                    </div>
                </div>

                <div className="summary-actions">
                    <button className="icon-action-btn" onClick={fetchData} title="Refresh Data">
                        <RefreshCw size={18} className={loading ? 'spinning' : ''} />
                    </button>
                    {/* Add Change Password button for everyone */}
                    <button className="icon-action-btn" onClick={() => navigate('/change-password')} title="Change Password">
                        <Lock size={18} />
                    </button>

                    {user?.role === 'admin' && (
                        <button className="primary-action-btn secondary" onClick={() => setShowStaffModal(true)}>
                            <Users size={16} /> Add Staff
                        </button>
                    )}
                    <button className="primary-action-btn" onClick={() => setShowAddModal(true)}>
                        <UserPlus size={16} /> Add Patient
                    </button>
                </div>
            </div>

            {/* ACTIVE SHIFT DISPLAY FOR STAFF */}
            {user?.role === 'staff' && user.activeSchedule && user.activeSchedule.shiftName && (
                <div className="active-shift-banner fade-in" style={{
                    margin: '0 2rem 1rem 2rem',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: 'white',
                    padding: '1rem',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                    <Clock size={24} />
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Active Shift: {user.activeSchedule.shiftName}</h3>
                        <p style={{ margin: 0, opacity: 0.9 }}>
                            {new Date(user.activeSchedule.startTime).toLocaleString()} - {new Date(user.activeSchedule.endTime).toLocaleString()}
                        </p>
                    </div>
                </div>
            )}

            <div className="dashboard-layout">
                {/* 2. Staff Section (Horizontal Scroll) - Admin Only */}
                {user?.role === 'admin' && (
                    <section className="dashboard-section staff-section">
                        <div className="section-header">
                            <h3>My Staff Team</h3>
                            <div className="section-search">
                                <Search size={14} className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search staff..."
                                    value={staffSearch}
                                    onChange={(e) => setStaffSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="staff-horizontal-scroll">
                            {visibleStaff.length === 0 ? (
                                <div className="empty-staff-msg">No staff members found.</div>
                            ) : (
                                visibleStaff.map(staff => (
                                    <div key={staff._id} className="staff-card-pro">
                                        <div className="staff-card-header">
                                            <div className="staff-avatar-pro">
                                                {staff.name.charAt(0).toUpperCase()}
                                                <div className={`status-indicator-ring ${staff.isLoggedIn ? 'online' : 'offline'}`}
                                                    title={staff.isLoggedIn ? "Online" : "Offline"}
                                                />
                                            </div>
                                            <div className="staff-identity">
                                                <h4>{staff.name}</h4>
                                                <span className="role-badge">{staff.designation || staff.role}</span>
                                            </div>
                                            <button className="more-options-btn" title="More Options">
                                                <div className="dot"></div>
                                                <div className="dot"></div>
                                                <div className="dot"></div>
                                            </button>
                                        </div>

                                        <div className="staff-card-body">
                                            <div className="contact-row">
                                                <Mail size={14} className="icon" />
                                                <span className="text" title={staff.email}>{staff.email}</span>
                                            </div>

                                            {staff.activeSchedule?.shiftName ? (
                                                <div className="shift-badge active">
                                                    <div className="shift-icon">
                                                        <Clock size={12} />
                                                    </div>
                                                    <div className="shift-details">
                                                        <span className="shift-name">{staff.activeSchedule.shiftName}</span>
                                                        <span className="shift-time">
                                                            {new Date(staff.activeSchedule.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })} -
                                                            {new Date(staff.activeSchedule.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="shift-badge inactive">
                                                    <span className="no-shift">No active shift</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="staff-card-footer">
                                            <button
                                                className="action-btn-pro view"
                                                onClick={() => {
                                                    setSelectedStaff(staff);
                                                    setShowStaffDetailModal(true);
                                                }}
                                                title="View Profile"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                className="action-btn-pro assign"
                                                onClick={() => handleAssignShift(staff)}
                                                title="Assign Shift"
                                            >
                                                <Clock size={16} />
                                            </button>
                                            <button
                                                className="action-btn-pro delete"
                                                onClick={() => handleDeleteStaff(staff._id)}
                                                title="Remove Staff"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                )}

                {/* 3. Patient Section (Tabs + Data Table) */}
                <section className="dashboard-section patient-section">
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

                        <div className="section-search patient-search">
                            <Search size={14} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search patients..."
                                value={patientSearch}
                                onChange={(e) => setPatientSearch(e.target.value)}
                            />
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
                                                        <button
                                                            className="icon-btn-sm danger"
                                                            onClick={() => handleDeletePatient(patient._id)}
                                                            title="Delete Record"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
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
