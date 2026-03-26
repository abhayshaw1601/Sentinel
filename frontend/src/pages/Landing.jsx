import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Activity,
    Brain,
    Shield,
    Zap,
    CheckCircle2,
    ArrowRight,
    Users,
    FileText,
    Clock,
    Sun,
    Moon,
} from 'lucide-react';
import logo from '../assets/logo.png';
import { useTheme } from '../context/ThemeContext';
import './Landing.css';

const Landing = () => {
    const navigate = useNavigate();
    const { isDarkMode, toggleTheme } = useTheme();
    const [activeSection, setActiveSection] = React.useState('features');

    React.useEffect(() => {
        const sections = ['features', 'how-it-works', 'security', 'contact'];
        const observers = [];

        sections.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            const obs = new IntersectionObserver(
                ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
                { threshold: 0.3 }
            );
            obs.observe(el);
            observers.push(obs);
        });

        return () => observers.forEach(o => o.disconnect());
    }, []);

    return (
        <div className="lp">

            {/* ── Navbar ─────────────────────────────────────────── */}
            <nav className="lp-nav">
                <div className="lp-nav-inner">
                    <div className="lp-brand">
                        <img src={logo} alt="Sentinel" className="lp-logo" />
                        <span>Sentinel</span>
                    </div>
                    <div className="lp-nav-links">
                        <a href="#features" className={`lp-nav-link ${activeSection === 'features' ? 'active' : ''}`}>Features</a>
                        <a href="#how-it-works" className={`lp-nav-link ${activeSection === 'how-it-works' ? 'active' : ''}`}>How It Works</a>
                        <a href="#security" className={`lp-nav-link ${activeSection === 'security' ? 'active' : ''}`}>Security</a>
                        <a href="#contact" className={`lp-nav-link ${activeSection === 'contact' ? 'active' : ''}`}>Contact</a>
                    </div>
                    <div className="lp-nav-actions">
                        <button className="lp-theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
                            {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
                        </button>
                        <button className="lp-btn-ghost" onClick={() => navigate('/login')}>Sign In</button>
                        <button className="lp-btn-cyan" onClick={() => navigate('/login')}>Request Demo</button>
                    </div>
                </div>
            </nav>

            {/* ── Hero ───────────────────────────────────────────── */}
            <section className="lp-hero">
                <div className="lp-hero-left">
                    <div className="lp-badge">
                        <span className="lp-badge-dot"></span>
                        AI-POWERED CRITICAL CARE
                    </div>
                    <h1 className="lp-hero-title">
                        Know Before<br />
                        It's <span className="lp-cyan">Critical.</span>
                    </h1>
                    <p className="lp-hero-desc">
                        Sentinel gives clinical teams a unified view of every patient —
                        live vitals, AI risk scores, and automated alerts — so the right
                        intervention happens before deterioration sets in.
                    </p>
                    <div className="lp-hero-cta">
                        <button className="lp-btn-cyan lp-btn-lg" onClick={() => navigate('/login')}>
                            Open Dashboard
                        </button>
                        <button className="lp-btn-ghost lp-btn-lg" onClick={() => navigate('/login')}>
                            See How It Works
                        </button>
                    </div>
                    <div className="lp-hero-trust">
                        <span><CheckCircle2 size={14} className="lp-green" /> HIPAA Compliant</span>
                        <span><CheckCircle2 size={14} className="lp-green" /> 99.9% Uptime SLA</span>
                        <span><CheckCircle2 size={14} className="lp-green" /> Zero Setup Fees</span>
                    </div>
                </div>

                <div className="lp-hero-right">
                    <div className="lp-mockup">
                        <div className="lp-mockup-bar">
                            <div className="lp-mockup-brand">
                                <img src={logo} alt="" style={{ width: 16, height: 16 }} />
                                <span>Sentinel — Ward 4C</span>
                            </div>
                            <div className="lp-mockup-dots">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                        <div className="lp-mockup-body">
                            <div className="lp-mockup-header-row">
                                <span className="lp-mockup-section-title">ICU Patient Overview</span>
                                <span className="lp-mockup-live">● LIVE</span>
                            </div>
                            <div className="lp-mockup-table">
                                <div className="lp-mockup-th">
                                    <span>Patient</span><span>HR</span><span>SpO2</span><span>Status</span>
                                </div>
                                {[
                                    ['J. Miller', '72', '98%', 'stable'],
                                    ['S. Patel', '91', '94%', 'watch'],
                                    ['K. Nguyen', '108', '89%', 'critical'],
                                    ['T. Brooks', '68', '99%', 'stable'],
                                    ['R. Sharma', '84', '96%', 'stable'],
                                ].map(([name, hr, spo2, status]) => (
                                    <div className="lp-mockup-tr" key={name}>
                                        <span>{name}</span>
                                        <span>{hr}</span>
                                        <span>{spo2}</span>
                                        <span className={`lp-status lp-status-${status}`}>{status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="lp-mockup-footer">
                            <div className="lp-mockup-vitals-pill">
                                <CheckCircle2 size={14} className="lp-green" />
                                <span>3 STABLE · 1 WATCH · 1 CRITICAL</span>
                            </div>
                            <p>AI flagged K. Nguyen for deterioration risk 3 hrs ago. Alert sent to attending physician.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Social proof strip ─────────────────────────────── */}
            <div className="lp-proof-strip">
                <div className="lp-proof-inner">
                    <div className="lp-proof-item">
                        <span className="lp-proof-num">500+</span>
                        <span className="lp-proof-label">Patients Monitored Daily</span>
                    </div>
                    <div className="lp-proof-divider"></div>
                    <div className="lp-proof-item">
                        <span className="lp-proof-num">4 hrs</span>
                        <span className="lp-proof-label">Average AI Early-Warning Lead Time</span>
                    </div>
                    <div className="lp-proof-divider"></div>
                    <div className="lp-proof-item">
                        <span className="lp-proof-num">99.9%</span>
                        <span className="lp-proof-label">Platform Uptime SLA</span>
                    </div>
                    <div className="lp-proof-divider"></div>
                    <div className="lp-proof-item">
                        <span className="lp-proof-num">&lt; 2 min</span>
                        <span className="lp-proof-label">Onboarding a New Patient</span>
                    </div>
                </div>
            </div>

            {/* ── Features ───────────────────────────────────────── */}
            <section className="lp-features" id="features">
                <div className="lp-section">
                    <h2 className="lp-section-title">Built for the Realities of Critical Care</h2>
                    <p className="lp-section-sub">
                        Every feature is designed around a single goal — giving your team the right
                        information at the exact moment it matters.
                    </p>

                    <div className="lp-feat-grid">
                        {/* Large card */}
                        <div className="lp-feat-card lp-feat-large">
                            <div className="lp-feat-icon lp-feat-icon-cyan">
                                <Activity size={22} />
                            </div>
                            <h3>Real-Time Vitals Monitoring</h3>
                            <p>
                                Live streams from every bed. Heart rate, SpO₂, blood pressure, and temperature
                                refresh every second with configurable alert thresholds per patient. No delays,
                                no polling — always current.
                            </p>
                            <div className="lp-feat-tags">
                                <span className="lp-tag">LIVE SYNC</span>
                                <span className="lp-tag">AUTO-ALERTS</span>
                                <span className="lp-tag">TREND CHARTS</span>
                            </div>
                        </div>

                        {/* AI card */}
                        <div className="lp-feat-card">
                            <div className="lp-feat-icon lp-feat-icon-red">
                                <Brain size={22} />
                            </div>
                            <h3>AI-Driven Risk Engine</h3>
                            <p>
                                Sentinel's model analyzes multi-parameter trends to flag deteriorating patients
                                hours before a crisis — not after. Scored 0–100 per patient, continuously updated.
                            </p>
                        </div>

                        {/* Secure Records */}
                        <div className="lp-feat-card">
                            <div className="lp-feat-icon lp-feat-icon-green">
                                <Shield size={22} />
                            </div>
                            <h3>Encrypted Patient Records</h3>
                            <p>
                                HIPAA-compliant vault for lab results, imaging, discharge summaries, and physician
                                notes. Fully searchable, auditable, and version-controlled.
                            </p>
                        </div>

                        {/* Staff */}
                        <div className="lp-feat-card">
                            <div className="lp-feat-icon lp-feat-icon-purple">
                                <Users size={22} />
                            </div>
                            <h3>Staff & Shift Management</h3>
                            <p>
                                Assign shifts, track who's on duty, and manage role-based access — all from the
                                same dashboard your clinicians already use.
                            </p>
                        </div>

                        {/* Visual card */}
                        <div className="lp-feat-card lp-feat-visual">
                            <div className="lp-feat-visual-inner">
                                <div className="lp-feat-visual-grid">
                                    {Array.from({ length: 16 }).map((_, i) => (
                                        <div key={i} className="lp-feat-visual-cell"></div>
                                    ))}
                                </div>
                                <p className="lp-feat-visual-label">MULTI-WARD OVERVIEW</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── How It Works ───────────────────────────────────── */}
            <section className="lp-how" id="how-it-works">
                <div className="lp-section">
                    <h2 className="lp-section-title">From Admission to Insight in Minutes</h2>
                    <p className="lp-section-sub">
                        Sentinel is designed to be operational the moment a patient is admitted —
                        no lengthy setup, no training overhead.
                    </p>

                    <div className="lp-steps">
                        <div className="lp-step">
                            <div className="lp-step-num">01</div>
                            <div className="lp-step-icon">
                                <Users size={20} />
                            </div>
                            <h3>Admit & Profile</h3>
                            <p>
                                Register a patient in under two minutes. Import their history, allergies,
                                current medications, and attending physician assignment in a single form.
                            </p>
                        </div>

                        <div className="lp-step-connector">
                            <ArrowRight size={20} />
                        </div>

                        <div className="lp-step">
                            <div className="lp-step-num">02</div>
                            <div className="lp-step-icon">
                                <Activity size={20} />
                            </div>
                            <h3>Monitor in Real Time</h3>
                            <p>
                                Every vital sign streams live to the ward dashboard. Abnormal readings
                                trigger instant alerts with severity levels, so nothing slips through.
                            </p>
                        </div>

                        <div className="lp-step-connector">
                            <ArrowRight size={20} />
                        </div>

                        <div className="lp-step">
                            <div className="lp-step-num">03</div>
                            <div className="lp-step-icon">
                                <Brain size={20} />
                            </div>
                            <h3>Act on AI Alerts</h3>
                            <p>
                                Sentinel's risk model scores each patient continuously. When a score climbs,
                                the on-call physician is notified automatically — hours before deterioration
                                becomes visible.
                            </p>
                        </div>

                        <div className="lp-step-connector">
                            <ArrowRight size={20} />
                        </div>

                        <div className="lp-step">
                            <div className="lp-step-num">04</div>
                            <div className="lp-step-icon">
                                <FileText size={20} />
                            </div>
                            <h3>Document & Discharge</h3>
                            <p>
                                Generate structured clinical summaries, attach reports, and discharge patients
                                with a full record trail that's compliant and ready for handoff.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Security ───────────────────────────────────────── */}
            <section className="lp-security" id="security">
                <div className="lp-section lp-security-inner">
                    <div className="lp-security-stats">
                        <div className="lp-stat-box">
                            <div className="lp-stat-num lp-cyan">100%</div>
                            <div className="lp-stat-label">HIPAA READY</div>
                        </div>
                        <div className="lp-stat-box">
                            <div className="lp-stat-num lp-cyan">256-bit</div>
                            <div className="lp-stat-label">AES ENCRYPTION</div>
                        </div>
                        <div className="lp-stat-box">
                            <div className="lp-stat-num">24/7</div>
                            <div className="lp-stat-label">THREAT MONITORING</div>
                        </div>
                        <div className="lp-stat-box">
                            <div className="lp-stat-num">99.9%</div>
                            <div className="lp-stat-label">UPTIME SLA</div>
                        </div>
                    </div>

                    <div className="lp-security-text">
                        <h2>Zero Downtime.<br />Zero Compromises.</h2>
                        <p>
                            Patient data is the most sensitive information that exists. Sentinel is built on
                            a zero-trust architecture — every request is authenticated, every byte is
                            encrypted, and every access is logged. Your ward never sleeps, and neither do
                            our security systems.
                        </p>
                        <div className="lp-checklist">
                            <div className="lp-check-item">
                                <CheckCircle2 size={18} className="lp-green" />
                                <span>SOC 2 Type II Certified Infrastructure</span>
                            </div>
                            <div className="lp-check-item">
                                <CheckCircle2 size={18} className="lp-green" />
                                <span>BAA Agreements for All Healthcare Partners</span>
                            </div>
                            <div className="lp-check-item">
                                <CheckCircle2 size={18} className="lp-green" />
                                <span>Granular RBAC — Admin, Staff, and Patient Roles</span>
                            </div>
                            <div className="lp-check-item">
                                <CheckCircle2 size={18} className="lp-green" />
                                <span>Full Audit Logs with Tamper-Proof Storage</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CTA ────────────────────────────────────────────── */}
            <section className="lp-cta" id="contact">
                <div className="lp-section">
                    <div className="lp-cta-card">
                        <div className="lp-cta-badge">
                            <Clock size={14} />
                            <span>LIVE IN UNDER 10 MINUTES</span>
                        </div>
                        <h2>Ready to Transform Your Ward?</h2>
                        <p>
                            Sentinel deploys in minutes, not months. No integration headaches,
                            no costly hardware swaps — just better visibility and faster interventions
                            from day one.
                        </p>
                        <div className="lp-cta-btns">
                            <button className="lp-btn-cyan lp-btn-lg" onClick={() => navigate('/login')}>
                                Get Started Free
                            </button>
                            <button className="lp-btn-outline lp-btn-lg" onClick={() => navigate('/login')}>
                                Contact Sales
                            </button>
                        </div>
                        <p className="lp-cta-note">No credit card required. Free for up to 10 patients.</p>
                    </div>
                </div>
            </section>

            {/* ── Footer ─────────────────────────────────────────── */}
            <footer className="lp-footer">
                <div className="lp-section lp-footer-inner">
                    <div className="lp-footer-brand">
                        <img src={logo} alt="Sentinel" style={{ width: 28, height: 28 }} />
                        <div>
                            <div className="lp-footer-name">Sentinel AI</div>
                            <div className="lp-footer-copy">
                                © {new Date().getFullYear()} Sentinel AI. Precision monitoring for critical care.
                            </div>
                        </div>
                    </div>
                    <div className="lp-footer-links">
                        <a href="#privacy">Privacy Policy</a>
                        <a href="#terms">Terms of Service</a>
                        <a href="#hipaa">HIPAA Compliance</a>
                        <a href="#contact">Contact Support</a>
                    </div>
                </div>
            </footer>

        </div>
    );
};

export default Landing;
