import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Activity, LogOut, User, Moon, Sun, Brain } from 'lucide-react';
import logo from '../assets/logo.png';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="navbar-content">
                <div className="navbar-brand" onClick={() => navigate(user?.role === 'patient' ? '/patient-dashboard' : '/dashboard')}>
                    <img src={logo} alt="Sentinel" className="brand-icon" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
                    <span>Sentinel</span>
                </div>

                <div className="navbar-right">
                    {user?.role !== 'patient' && (
                        <button
                            className="nav-link"
                            onClick={() => navigate('/ai-demo')}
                            title="AI Assistant Demo"
                        >
                            <Brain size={20} />
                            <span>AI Demo</span>
                        </button>
                    )}

                    <button
                        className="theme-toggle"
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                    >
                        {isDarkMode ? (
                            <Sun size={20} className="theme-icon" />
                        ) : (
                            <Moon size={20} className="theme-icon" />
                        )}
                    </button>

                    <div className="user-info">
                        <User size={18} />
                        <span>{user?.name}</span>
                        {user?.role === 'admin' && (
                            <span className="badge badge-warning">Admin</span>
                        )}
                        {user?.role === 'patient' && (
                            <span className="badge badge-info" style={{ background: '#e0f2fe', color: '#0369a1' }}>Patient</span>
                        )}
                    </div>

                    <button className="logout-btn" onClick={handleLogout}>
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;

