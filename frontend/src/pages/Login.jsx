import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Phone, Key, Eye, EyeOff, Activity, Settings, Sun, Moon, ArrowLeft } from 'lucide-react';
import logo from '../assets/logo.png';
import { patientAuthAPI } from '../utils/api';
import { useTheme } from '../context/ThemeContext';
import './Login.css';

const Login = () => {
    const { login, isAuthenticated, user, loading: authLoading } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const [loginType, setLoginType] = useState('staff');

    // Staff Login State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [keepSession, setKeepSession] = useState(false);

    // Patient Login State
    const [patientStep, setPatientStep] = useState('request');
    const [patientData, setPatientData] = useState({ name: '', phone: '', email: '' });
    const [otp, setOtp] = useState('');

    // Shared State
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!authLoading && isAuthenticated && user) {
            if (user.role === 'patient') {
                navigate('/patient-dashboard', { replace: true });
            } else {
                navigate('/dashboard', { replace: true });
            }
        }
    }, [isAuthenticated, user, authLoading, navigate]);

    const handleStaffLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const result = await login({ email, password });
            if (result.success) {
                if (result.user && result.user.role === 'staff' && !result.user.isPasswordChanged) {
                    navigate('/change-password');
                } else {
                    if (result.user?.role === 'patient') {
                        navigate('/patient-dashboard');
                    } else {
                        navigate('/dashboard');
                    }
                }
            } else {
                setError(result.error);
            }
        } catch {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

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
                localStorage.setItem('token', response.data.data.token);
                localStorage.setItem('user', JSON.stringify({ ...response.data.data, role: 'patient' }));
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

    if (authLoading) {
        return (
            <div className="login-page">
                <div className="login-loading">
                    <div className="loading-spinner"></div>
                    <p>Checking authentication...</p>
                </div>
            </div>
        );
    }

    if (isAuthenticated && user) return null;

    return (
        <div className="login-page">

            {/* Back to Home */}
            <button className="login-back-btn" onClick={() => navigate('/')} aria-label="Back to homepage">
                <ArrowLeft size={15} /> Home
            </button>

            {/* Theme Toggle */}
            <button className="login-theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Brand Header */}
            <div className="login-brand">
                <img src={logo} alt="Sentinel" className="brand-logo" />
                <div className="brand-text">
                    <h1 className="brand-name">Sentinel</h1>
                    <p className="brand-tagline">CLINICAL GUARDIAN</p>
                </div>
            </div>

            {/* Tab Toggle */}
            <div className="login-tabs">
                <button
                    className={`login-tab ${loginType === 'staff' ? 'active' : ''}`}
                    onClick={() => { setLoginType('staff'); setError(''); }}
                >
                    Administrator
                </button>
                <button
                    className={`login-tab ${loginType === 'patient' ? 'active' : ''}`}
                    onClick={() => { setLoginType('patient'); setError(''); }}
                >
                    Patient Portal
                </button>
            </div>

            {/* Main Login Card */}
            <div className="login-card fade-in">
                <h2 className="login-title">Welcome Back</h2>
                <p className="login-subtitle">Secure biometric or credentialed access required.</p>

                {error && <div className="alert alert-error">{error}</div>}

                {/* Staff Login Form */}
                {loginType === 'staff' && (
                    <form onSubmit={handleStaffLogin} className="login-form">
                        <div className="form-group">
                            <label>WORK EMAIL</label>
                            <div className="input-wrapper">
                                <Mail size={18} className="input-icon" />
                                <input
                                    type="email"
                                    placeholder="dr.smith@guardian.med"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <div className="label-row">
                                <label>PASSWORD</label>
                                <button
                                    type="button"
                                    className="visibility-label"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? 'HIDE' : 'VISIBILITY'}
                                </button>
                            </div>
                            <div className="input-wrapper">
                                <Lock size={18} className="input-icon" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                    aria-label="Toggle password visibility"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="keep-session-row">
                            <input
                                type="checkbox"
                                id="keepSession"
                                checked={keepSession}
                                onChange={(e) => setKeepSession(e.target.checked)}
                            />
                            <label htmlFor="keepSession">Keep session active for 12 hours</label>
                        </div>

                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign In to Dashboard →'}
                        </button>

                        <p className="login-institutional">
                            Institutional Access only. Technical issues?{' '}
                            <Link to="/signup">Contact Clinical Support</Link>
                        </p>
                    </form>
                )}

                {/* Patient Login Form */}
                {loginType === 'patient' && (
                    <form
                        onSubmit={patientStep === 'request' ? handleRequestOTP : handleVerifyOTP}
                        className="login-form"
                    >
                        {patientStep === 'request' ? (
                            <>
                                <div className="form-group">
                                    <label>FULL NAME</label>
                                    <div className="input-wrapper">
                                        <User size={18} className="input-icon" />
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
                                    <label>PHONE NUMBER</label>
                                    <div className="input-wrapper">
                                        <Phone size={18} className="input-icon" />
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
                                    <label>EMAIL ADDRESS</label>
                                    <div className="input-wrapper">
                                        <Mail size={18} className="input-icon" />
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
                                <button type="submit" className="login-btn" disabled={loading}>
                                    {loading ? 'Sending OTP...' : 'Send OTP Code →'}
                                </button>
                            </>
                        ) : (
                            <>
                                <p className="otp-instruction">
                                    Enter the 6-digit code sent to {patientData.email}
                                </p>
                                <div className="form-group">
                                    <label>ONE-TIME PASSWORD</label>
                                    <div className="input-wrapper">
                                        <Key size={18} className="input-icon" />
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
                                <button type="submit" className="login-btn" disabled={loading}>
                                    {loading ? 'Verifying...' : 'Verify & Login →'}
                                </button>
                                <button
                                    type="button"
                                    className="back-btn"
                                    onClick={() => { setPatientStep('request'); setError(''); }}
                                >
                                    Back to Details
                                </button>
                            </>
                        )}
                        <p className="login-institutional">
                            Patient access via OTP verification only.{' '}
                            <Link to="/signup">Need Help?</Link>
                        </p>
                    </form>
                )}
            </div>

            {/* Quick Demo Access — Role Cards */}
            <div className="quick-demo-section">
                <p className="quick-demo-label">QUICK DEMO ACCESS</p>
                <div className="role-cards">
                    <button
                        className="role-card"
                        type="button"
                        onClick={() => {
                            setLoginType('staff');
                            setEmail('admin@icu.com');
                            setPassword('admin123');
                            setError('');
                        }}
                    >
                        <Settings size={18} className="role-card-icon" />
                        <div className="role-card-info">
                            <p className="role-card-title">Administrator</p>
                            <p className="role-card-desc">System-wide control</p>
                        </div>
                    </button>
                    <button
                        className="role-card"
                        type="button"
                        onClick={() => {
                            setLoginType('staff');
                            setEmail('kk@gmail.com');
                            setPassword('123456');
                            setError('');
                        }}
                    >
                        <Activity size={18} className="role-card-icon" />
                        <div className="role-card-info">
                            <p className="role-card-title">Clinical Staff</p>
                            <p className="role-card-desc">Health monitoring</p>
                        </div>
                    </button>
                    <button
                        className="role-card"
                        type="button"
                        onClick={() => {
                            setLoginType('patient');
                            setPatientStep('request');
                            setPatientData({ name: 'Soura', email: 'soura@gmail.com', phone: '1234567890' });
                            setError('');
                        }}
                    >
                        <User size={18} className="role-card-icon" />
                        <div className="role-card-info">
                            <p className="role-card-title">Patient Portal</p>
                            <p className="role-card-desc">Health summaries</p>
                        </div>
                    </button>
                </div>
            </div>

        </div>
    );
};

export default Login;
