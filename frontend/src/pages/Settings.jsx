import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authAPI } from '../utils/api';
import { User, Lock, Sun, Moon, Shield, LogOut, ChevronRight } from 'lucide-react';
import './Dashboard.css';

const Settings = () => {
    const { user, logout } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const [profileForm, setProfileForm] = useState({ name: user?.name || '' });
    const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [profileMsg, setProfileMsg] = useState(null);
    const [pwMsg, setPwMsg] = useState(null);
    const [saving, setSaving] = useState(false);

    const handleProfileSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setProfileMsg(null);
        try {
            await authAPI.updateProfile({ name: profileForm.name });
            setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
        } catch (err) {
            setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Update failed.' });
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordSave = async (e) => {
        e.preventDefault();
        if (pwForm.newPassword !== pwForm.confirmPassword) {
            setPwMsg({ type: 'error', text: 'New passwords do not match.' });
            return;
        }
        setSaving(true);
        setPwMsg(null);
        try {
            await authAPI.updatePassword({
                currentPassword: pwForm.currentPassword,
                newPassword: pwForm.newPassword
            });
            setPwMsg({ type: 'success', text: 'Password changed successfully.' });
            setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setPwMsg({ type: 'error', text: err.response?.data?.message || 'Password change failed.' });
        } finally {
            setSaving(false);
        }
    };

    const onLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    return (
        <div className="clinical-dashboard fade-in">
            <div className="clinical-header">
                <div>
                    <h1 className="clinical-title">Settings</h1>
                    <p className="clinical-subtitle">Manage your account and preferences.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>

                {/* Profile Settings */}
                <section className="clinical-card">
                    <div className="clinical-card-head">
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <User size={18} /> Profile
                        </h3>
                    </div>
                    <div style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div className="sidebar-avatar" style={{ width: 56, height: 56, fontSize: '1.4rem' }}>
                                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '1rem' }}>{user?.name || 'User'}</div>
                                <div className="text-muted" style={{ fontSize: '0.8rem' }}>{user?.email}</div>
                                <span className="badge badge-info" style={{ marginTop: '0.25rem', fontSize: '0.7rem' }}>
                                    {(user?.role || '').toUpperCase()}
                                </span>
                            </div>
                        </div>

                        <form onSubmit={handleProfileSave}>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.85rem' }}>Display Name</label>
                                <input
                                    type="text"
                                    value={profileForm.name}
                                    onChange={e => setProfileForm({ name: e.target.value })}
                                    placeholder="Your name"
                                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                />
                            </div>
                            {profileMsg && (
                                <div style={{ padding: '0.5rem 0.75rem', borderRadius: '0.4rem', marginBottom: '0.75rem', fontSize: '0.85rem', background: profileMsg.type === 'success' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: profileMsg.type === 'success' ? '#22c55e' : '#ef4444' }}>
                                    {profileMsg.text}
                                </div>
                            )}
                            <button type="submit" className="btn-primary btn-sm" disabled={saving}>
                                {saving ? 'Saving...' : 'Save Profile'}
                            </button>
                        </form>
                    </div>
                </section>

                {/* Password */}
                <section className="clinical-card">
                    <div className="clinical-card-head">
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Lock size={18} /> Change Password
                        </h3>
                    </div>
                    <div style={{ padding: '1.25rem' }}>
                        <form onSubmit={handlePasswordSave}>
                            {['currentPassword', 'newPassword', 'confirmPassword'].map((field, i) => (
                                <div key={field} className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.85rem' }}>
                                        {['Current Password', 'New Password', 'Confirm New Password'][i]}
                                    </label>
                                    <input
                                        type="password"
                                        value={pwForm[field]}
                                        onChange={e => setPwForm(prev => ({ ...prev, [field]: e.target.value }))}
                                        required
                                        style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                    />
                                </div>
                            ))}
                            {pwMsg && (
                                <div style={{ padding: '0.5rem 0.75rem', borderRadius: '0.4rem', marginBottom: '0.75rem', fontSize: '0.85rem', background: pwMsg.type === 'success' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: pwMsg.type === 'success' ? '#22c55e' : '#ef4444' }}>
                                    {pwMsg.text}
                                </div>
                            )}
                            <button type="submit" className="btn-primary btn-sm" disabled={saving}>
                                {saving ? 'Saving...' : 'Update Password'}
                            </button>
                        </form>
                    </div>
                </section>

                {/* Appearance */}
                <section className="clinical-card">
                    <div className="clinical-card-head">
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {isDarkMode ? <Moon size={18} /> : <Sun size={18} />} Appearance
                        </h3>
                    </div>
                    <div style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ fontWeight: 500, marginBottom: '0.2rem' }}>Dark Mode</div>
                                <div className="text-muted" style={{ fontSize: '0.82rem' }}>Toggle between light and dark theme</div>
                            </div>
                            <button
                                onClick={toggleTheme}
                                style={{
                                    width: 48, height: 26, borderRadius: 999, border: 'none', cursor: 'pointer',
                                    background: isDarkMode ? 'var(--color-primary)' : 'var(--border-color)',
                                    position: 'relative', transition: 'background 0.2s'
                                }}
                            >
                                <span style={{
                                    position: 'absolute', top: 3, left: isDarkMode ? 24 : 4, width: 20, height: 20,
                                    borderRadius: '50%', background: '#fff', transition: 'left 0.2s', display: 'block'
                                }} />
                            </button>
                        </div>
                    </div>
                </section>

                {/* Danger Zone */}
                <section className="clinical-card">
                    <div className="clinical-card-head">
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Shield size={18} /> Session
                        </h3>
                    </div>
                    <div style={{ padding: '1.25rem' }}>
                        <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                            Signed in as <strong>{user?.email}</strong>
                        </p>
                        <button
                            className="btn-secondary btn-sm"
                            onClick={onLogout}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <LogOut size={16} /> Sign Out
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Settings;
