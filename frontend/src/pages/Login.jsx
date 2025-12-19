import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Activity, Mail, Lock, User, Phone, Key, Sun, Moon } from 'lucide-react';
import logo from '../assets/logo.png';
import { patientAuthAPI } from '../utils/api';
import './Login.css';

const Login = () => {
    const { isDarkMode, toggleTheme } = useTheme();
    const [loginType, setLoginType] = useState('staff'); // 'staff' (includes admin) or 'patient'

    // Staff Login State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Patient Login State
    const [patientStep, setPatientStep] = useState('request'); // 'request' or 'verify'
    const [patientData, setPatientData] = useState({
        name: '',
        phone: '',
        email: ''
    });
    const [otp, setOtp] = useState('');

    // Shared State
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    // Staff Login Handler
    const handleStaffLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Pass loginAs parameter to enforce role check
            const result = await login({ email, password });
            if (result.success) {
                // Check for forced password change - ONLY for staff, not admins
                if (result.user && result.user.role === 'staff' && !result.user.isPasswordChanged) {
                    navigate('/change-password');
                } else {
                    navigate('/dashboard');
                }
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    // Patient OTP Request Handler
    const handleRequestOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await patientAuthAPI.requestOTP({
                name: patientData.name.trim(),
                phone: patientData.phone.trim(),
                email: patientData.email.trim()
            });
            setPatientStep('verify');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP. Check your details.');
        } finally {
            setLoading(false);
        }
    };

    // Patient OTP Verify Handler
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await patientAuthAPI.verifyOTP({
                email: patientData.email.trim(),
                otp
            });

            if (response.data.success) {
                // Manually set patient session (since AuthContext is built for User model, we might need to adjust it or store patient manually)
                // For now, let's store simpler patient auth
                localStorage.setItem('token', response.data.data.token);
                localStorage.setItem('user', JSON.stringify({ ...response.data.data, role: 'patient' }));

                // Force a reload or update context (assuming AuthContext reads from localStorage on init)
                // Better: Update AuthContext to handle 'setPatient'. But for now, window.location.reload is a hacky way to ensure AuthContext picks it up if it initializes from storage.
                // Or assume `login` function can accept a created session. 
                // Let's rely on stored token and standard flow.
                // We navigate to /patient-dashboard
                window.location.href = '/patient-dashboard';
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handlePatientChange = (e) => {
        setPatientData({ ...patientData, [e.target.name]: e.target.value });
    };

    return (
        <div className="login-container">
            <div className="login-background"></div>

            <div className="login-card fade-in">
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
                <div className="login-header">
                    <div className="logo-container">
                        <img src={logo} alt="Sentinel Logo" className="logo-icon" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
                    </div>
                    <h1>Sentinel</h1>
                    <p>AI-Powered Patient Monitoring System</p>
                </div>

                {/* Role Toggle */}
                <div className="role-toggle">
                    <button
                        className={`role-btn ${loginType === 'staff' ? 'active' : ''}`}
                        onClick={() => { setLoginType('staff'); setError(''); }}
                    >
                        Administrator
                    </button>
                    <button
                        className={`role-btn ${loginType === 'patient' ? 'active' : ''}`}
                        onClick={() => { setLoginType('patient'); setError(''); }}
                    >
                        Patient Portal
                    </button>
                </div>

                {error && <div className="alert alert-error fade-in">{error}</div>}

                {/* Staff Login Form */}
                {loginType === 'staff' && (
                    <form onSubmit={handleStaffLogin} className="login-form">

                        {/* Sub-toggle removed as per request */}

                        <div className="form-group">
                            <label>Email Address</label>
                            <div className="input-wrapper">
                                <Mail size={20} className="input-icon" />
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <div className="input-wrapper">
                                <Lock size={20} className="input-icon" />
                                <input
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn-primary btn-lg login-btn" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>

                        <div className="login-footer">
                            <p>Don't have an account? <Link to="/signup">Sign Up</Link></p>
                            {/* <div className="demo-credentials" style={{ marginTop: '1rem' }}>
                                <p><strong>Demo Credentials:</strong></p>
                                <p>Admin: admin@icu.com / admin123</p>
                                <p>Staff: staff1@icu.com / staff123</p>
                            </div> */}
                        </div>
                    </form>
                )}

                {/* Patient Login Form */}
                {loginType === 'patient' && (
                    <form onSubmit={patientStep === 'request' ? handleRequestOTP : handleVerifyOTP} className="login-form">

                        {patientStep === 'request' ? (
                            <>
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <div className="input-wrapper">
                                        <User size={20} className="input-icon" />
                                        <input
                                            name="name"
                                            placeholder="Your Name"
                                            value={patientData.name}
                                            onChange={handlePatientChange}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <div className="input-wrapper">
                                        <Phone size={20} className="input-icon" />
                                        <input
                                            name="phone"
                                            placeholder="Your Phone"
                                            value={patientData.phone}
                                            onChange={handlePatientChange}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <div className="input-wrapper">
                                        <Mail size={20} className="input-icon" />
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="Your Email"
                                            value={patientData.email}
                                            onChange={handlePatientChange}
                                            required
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="btn-primary btn-lg login-btn" disabled={loading}>
                                    {loading ? 'Sending OTP...' : 'Send OTP Code'}
                                </button>
                            </>
                        ) : (
                            <>
                                <p className="otp-instruction">Enter the 6-digit code sent to {patientData.email}</p>
                                <div className="form-group">
                                    <label>One-Time Password (OTP)</label>
                                    <div className="input-wrapper">
                                        <Key size={20} className="input-icon" />
                                        <input
                                            type="text"
                                            placeholder="e.g. 123456"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            maxLength={6}
                                            required
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="btn-primary btn-lg login-btn" disabled={loading}>
                                    {loading ? 'Verifying...' : 'Verify & Login'}
                                </button>
                                <button
                                    type="button"
                                    className="back-btn"
                                    onClick={() => setPatientStep('request')}
                                >
                                    Back to Details
                                </button>
                            </>
                        )}

                    </form>
                )}

                {/* Quick Access Buttons - Bottom of Card */}
                <div className="quick-access-container">
                    <div className="quick-access-divider"></div>
                    <p className="quick-access-label">Quick Demo Access</p>
                    <div className="quick-access-buttons">
                        <button
                            type="button"
                            className="quick-btn admin"
                            onClick={() => {
                                setLoginType('staff');
                                setEmail('blabla@gmail.com');
                                setPassword('1234567890');
                                setError('');
                            }}
                        >
                            <span className="quick-btn-icon"></span>
                            <span className="quick-btn-text">Admin</span>
                        </button>
                        <button
                            type="button"
                            className="quick-btn staff"
                            onClick={() => {
                                setLoginType('staff');
                                setEmail('kk@gmail.com');
                                setPassword('Bidhan');
                                setError('');
                            }}
                        >
                            <span className="quick-btn-icon"></span>
                            <span className="quick-btn-text">Staff</span>
                        </button>
                        <button
                            type="button"
                            className="quick-btn patient"
                            onClick={() => {
                                setLoginType('patient');
                                setPatientStep('request');
                                setPatientData({
                                    name: 'abhay shaw',
                                    email: 'abhay@gmail.com',
                                    phone: '1234567890'
                                });
                                setError('');
                            }}
                        >
                            <span className="quick-btn-icon"></span>
                            <span className="quick-btn-text">Patient</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
