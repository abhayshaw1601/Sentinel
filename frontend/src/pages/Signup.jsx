import React, { useState } from 'react';
import { authAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext'; // To access verifyToken/login if needed
import { useTheme } from '../context/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, User, Mail, Lock, Sun, Moon } from 'lucide-react';
import logo from '../assets/logo.png';
import './Signup.css';

const Signup = () => {
    const { isDarkMode, toggleTheme } = useTheme();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'admin', // Hardcoded to admin
        phone: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const { updateUser } = useAuth();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authAPI.register(formData);

            if (response.data.success) {
                // Auto login after registration
                const { user, token } = response.data.data;

                // Manually update auth context
                localStorage.setItem('token', token);
                updateUser(user);

                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="signup-container">
            <div className="signup-background"></div>

            <div className="signup-card fade-in">
                {/* Theme Toggle Button (Standard Navbar Style) */}
                <button
                    className="theme-toggle"
                    onClick={toggleTheme}
                    style={{
                        position: 'absolute',
                        top: '1.5rem',
                        right: '1.5rem',
                        zIndex: 50
                    }}
                    aria-label="Toggle theme"
                >
                    {isDarkMode ? (
                        <Sun size={20} className="theme-icon" />
                    ) : (
                        <Moon size={20} className="theme-icon" />
                    )}
                </button>
                <div className="signup-header">
                    <div className="logo-container">
                        <img src={logo} alt="Sentinel Logo" className="logo-icon" style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
                    </div>
                    <h1>Create Admin Account</h1>
                    <p>Administrator Registration</p>
                </div>

                <form onSubmit={handleSubmit} className="signup-form">
                    {error && (
                        <div className="alert alert-error fade-in">
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <div className="input-wrapper">
                            <User size={20} className="input-icon" />
                            <input
                                id="name"
                                type="text"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter your name"
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <div className="input-wrapper">
                            <Mail size={20} className="input-icon" />
                            <input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="name@example.com"
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <div className="input-wrapper">
                            <Lock size={20} className="input-icon" />
                            <input
                                id="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Create a password"
                                required
                                minLength="6"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Role selection removed - Admin only */}

                    <button
                        type="submit"
                        className="btn-primary btn-lg login-btn"
                        disabled={loading}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                        {loading ? 'Creating Account...' : (
                            <>
                                <UserPlus size={20} />
                                Create Admin Account
                            </>
                        )}
                    </button>
                </form>

                <div className="signup-footer">
                    <p>Already have an account? <Link to="/login">Sign In</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
