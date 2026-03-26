import React, { useState, useEffect } from 'react';
import { authAPI } from '../utils/api';
import { Users, UserPlus, Clock, Trash2, RefreshCw, Search } from 'lucide-react';
import AddStaffModal from '../components/AddStaffModal';
import AssignShiftModal from '../components/AssignShiftModal';
import StaffDetailModal from '../components/StaffDetailModal';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Staff = () => {
    const [myStaff, setMyStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [showAssignShiftModal, setShowAssignShiftModal] = useState(false);
    const [showStaffDetailModal, setShowStaffDetailModal] = useState(false);
    const [search, setSearch] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        fetchStaff();
        const id = setInterval(() => fetchStaff(true), 10000);
        return () => clearInterval(id);
    }, [user]);

    const fetchStaff = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            if (user?.role === 'admin') {
                const res = await authAPI.getMyStaff();
                if (res.data.success) setMyStaff(res.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch staff:', err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleDeleteStaff = async (id) => {
        if (!window.confirm('Delete this staff member? This cannot be undone.')) return;
        try { await authAPI.deleteStaff(id); fetchStaff(); }
        catch { alert('Failed to delete staff'); }
    };

    const visibleStaff = search
        ? myStaff.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
        : myStaff;

    const onlineCount = myStaff.filter(s => s.isLoggedIn).length;

    return (
        <div className="clinical-dashboard fade-in">
            <div className="clinical-header">
                <div>
                    <h1 className="clinical-title">Staff</h1>
                    <p className="clinical-subtitle">Manage your clinical team and shift assignments.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <button className="metric-icon-btn" onClick={() => fetchStaff(false)} title="Refresh">
                        <RefreshCw size={16} className={loading ? 'spinning' : ''} />
                    </button>
                    {user?.role === 'admin' && (
                        <button className="btn-primary btn-sm" onClick={() => setShowStaffModal(true)}>
                            <UserPlus size={16} /> Add Staff
                        </button>
                    )}
                </div>
            </div>

            <div className="clinical-metrics">
                <div className="clinical-metric-card">
                    <div className="metric-top"><span className="metric-kicker">Total Staff</span></div>
                    <div className="metric-number">{myStaff.length}</div>
                    <div className="metric-foot">Team members</div>
                </div>
                <div className="clinical-metric-card accent-green">
                    <div className="metric-top"><span className="metric-kicker">Online Now</span></div>
                    <div className="metric-number">{onlineCount}</div>
                </div>
                <div className="clinical-metric-card accent-red">
                    <div className="metric-top"><span className="metric-kicker">Off Duty</span></div>
                    <div className="metric-number">{myStaff.length - onlineCount}</div>
                </div>
            </div>

            <section className="clinical-card" style={{ marginTop: '1.5rem' }}>
                <div className="clinical-card-head">
                    <h3>Staff Members</h3>
                    <div className="clinical-search" style={{ marginLeft: 'auto' }}>
                        <Search size={14} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search staff..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {user?.role !== 'admin' ? (
                    <div className="empty-staff" style={{ padding: '3rem', textAlign: 'center' }}>
                        <Users size={48} style={{ opacity: 0.3, display: 'block', margin: '0 auto 1rem' }} />
                        <p className="text-muted">Staff management is available for administrators.</p>
                    </div>
                ) : loading ? (
                    <div className="text-center p-4">Loading staff...</div>
                ) : visibleStaff.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center' }}>
                        <Users size={48} style={{ opacity: 0.3, display: 'block', margin: '0 auto 1rem' }} />
                        <p className="text-muted">No staff members found.</p>
                    </div>
                ) : (
                    <div className="staff-list" style={{ padding: '0.5rem 0' }}>
                        {visibleStaff.map(staff => (
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
                                                    ({new Date(staff.activeSchedule.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                                                    {new Date(staff.activeSchedule.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-muted">Off-duty</span>
                                        )}
                                    </div>
                                </div>
                                <div className="staff-actions">
                                    <button
                                        className="icon-btn-sm success"
                                        onClick={e => { e.stopPropagation(); setSelectedStaff(staff); setShowAssignShiftModal(true); }}
                                        title="Assign Shift"
                                    ><Clock size={14} /></button>
                                    <button
                                        className="icon-btn-sm danger"
                                        onClick={e => { e.stopPropagation(); handleDeleteStaff(staff._id); }}
                                        title="Delete"
                                    ><Trash2 size={14} /></button>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </section>

            {showStaffModal && (
                <AddStaffModal
                    onClose={() => setShowStaffModal(false)}
                    onSuccess={() => { setShowStaffModal(false); fetchStaff(); }}
                />
            )}
            {showAssignShiftModal && selectedStaff && (
                <AssignShiftModal
                    staff={selectedStaff}
                    onClose={() => { setShowAssignShiftModal(false); setSelectedStaff(null); }}
                    onSuccess={() => { setShowAssignShiftModal(false); setSelectedStaff(null); fetchStaff(); }}
                />
            )}
            {showStaffDetailModal && selectedStaff && (
                <StaffDetailModal
                    staff={selectedStaff}
                    onClose={() => { setShowStaffDetailModal(false); setSelectedStaff(null); }}
                />
            )}
        </div>
    );
};

export default Staff;
