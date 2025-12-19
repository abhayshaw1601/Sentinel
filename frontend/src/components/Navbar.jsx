import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import UserProfileModal from './UserProfileModal';
import { Activity, LogOut, User, Moon, Sun, Brain, ChevronDown, Lock, Settings } from 'lucide-react';
import logo from '../assets/logo.png';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = React.useState(false);
    const dropdownRef = React.useRef(null);

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = async () => {
        setIsDropdownOpen(false);
        await logout();
        navigate('/login', { replace: true });
    };

    return (
        <nav className="navbar">
            <div className="navbar-content">
                <div className="navbar-brand" onClick={() => navigate(user?.role === 'patient' ? '/patient-dashboard' : '/dashboard')}>
                    <img src={logo} alt="Sentinel" className="brand-icon" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
                    <span>Sentinel</span>
                    {user && (
                        <span className="navbar-dashboard-text">Dashboard</span>
                    )}
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

                    <div className="user-dropdown-container" ref={dropdownRef}>
                        <button
                            className={`user-info-btn ${isDropdownOpen ? 'active' : ''}`}
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                            <div className="user-avatar-small">
                                {user?.name ? user.name.charAt(0).toUpperCase() : <User size={18} />}
                            </div>
                            <span className="user-name">{user?.name}</span>
                            <ChevronDown size={14} className={`dropdown-arrow ${isDropdownOpen ? 'rotate' : ''}`} />
                        </button>

                        {isDropdownOpen && (
                            <div className="dropdown-menu">
                                <div className="dropdown-header">
                                    <span className="dropdown-user-name">{user?.name}</span>
                                    <span className="dropdown-user-role">{user?.role}</span>
                                </div>
                                <div className="dropdown-divider"></div>
                                <button
                                    className="dropdown-item"
                                    onClick={() => {
                                        setIsProfileModalOpen(true);
                                        setIsDropdownOpen(false);
                                    }}
                                >
                                    <User size={16} />
                                    <span>My Profile</span>
                                </button>
                                <button
                                    className="dropdown-item"
                                    onClick={() => {
                                        navigate('/change-password');
                                        setIsDropdownOpen(false);
                                    }}
                                >
                                    <Lock size={16} />
                                    <span>Change Password</span>
                                </button>
                                <div className="dropdown-divider"></div>
                                <button className="dropdown-item logout" onClick={handleLogout}>
                                    <LogOut size={16} />
                                    <span>Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <UserProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
            />
        </nav>
    );
};

export default Navbar;

