import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { vitalsAPI } from '../utils/api';
import {
    Heart, Activity, Wind, Thermometer, Droplets, Plus, AlertCircle,
    Minus, Edit3
} from 'lucide-react';
import {
    LineChart,  Line,
    AreaChart,  Area,
    BarChart,   Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './VitalsMonitor.css';

const TIME_RANGE_MAP = { live: '24h', '1h': '1h', '12h': '12h', '24h': '24h' };

const getVitalStatus = (type, value) => {
    if (value == null || value === '') return 'unknown';
    const ranges = {
        heartRate:            { low: 60,  high: 100 },
        oxygenSaturation:     { low: 95,  high: 100 },
        temperature:          { low: 97,  high: 99  },
        bloodPressureSystolic:{ low: 90,  high: 120 },
        bloodSugar:           { low: 70,  high: 140 },
        respiratoryRate:      { low: 12,  high: 20  },
    };
    const r = ranges[type];
    if (!r) return 'normal';
    if (value < r.low)  return 'low';
    if (value > r.high) return 'high';
    return 'normal';
};

const STATUS_LABEL = {
    normal:  { heartRate: 'STABLE', bloodPressureSystolic: 'NORMAL', respiratoryRate: 'NORMAL', default: 'STABLE' },
    low:     { oxygenSaturation: 'LOW', default: 'LOW' },
    high:    { default: 'HIGH' },
    unknown: { default: '—' },
};

const getStatusLabel = (type, status) => {
    const map = STATUS_LABEL[status] || STATUS_LABEL.normal;
    return map[type] || map.default;
};

const getTimeAgo = (ts) => {
    if (!ts) return null;
    const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
    if (diff < 60)  return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
};

const EMPTY_FORM = {
    heartRate: '', bloodPressureSystolic: '', bloodPressureDiastolic: '',
    oxygenSaturation: '', temperature: '', respiratoryRate: '',
    bloodSugar: '', co2Level: '', notes: ''
};

const VitalsMonitor = ({ patientId }) => {
    const { isDarkMode } = useTheme();
    const [vitals, setVitals]           = useState([]);
    const [latestVitals, setLatestVitals] = useState(null);
    const [loading, setLoading]         = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [timeKey, setTimeKey]         = useState('24h');
    const [readingsCount, setReadingsCount] = useState(10);
    const [chartType, setChartType]     = useState('line'); // 'line' | 'area' | 'bar'
    const [formData, setFormData]       = useState(EMPTY_FORM);

    useEffect(() => {
        fetchVitals();
        fetchLatestVitals();
    }, [patientId, timeKey]);

    const fetchVitals = async () => {
        try {
            setLoading(true);
            const res = await vitalsAPI.getPatientVitals(patientId, { timeRange: TIME_RANGE_MAP[timeKey] });
            setVitals(res.data.data);
        } catch (e) {
            console.error('Error fetching vitals:', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchLatestVitals = async () => {
        try {
            const res = await vitalsAPI.getLatest(patientId);
            setLatestVitals(res.data.data);
        } catch (e) {
            console.error('Error fetching latest vitals:', e);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await vitalsAPI.create({
                patientId,
                heartRate:              formData.heartRate             ? parseFloat(formData.heartRate)             : null,
                bloodPressureSystolic:  formData.bloodPressureSystolic ? parseFloat(formData.bloodPressureSystolic) : null,
                bloodPressureDiastolic: formData.bloodPressureDiastolic? parseFloat(formData.bloodPressureDiastolic): null,
                oxygenSaturation:       formData.oxygenSaturation      ? parseFloat(formData.oxygenSaturation)      : null,
                temperature:            formData.temperature           ? parseFloat(formData.temperature)           : null,
                respiratoryRate:        formData.respiratoryRate       ? parseFloat(formData.respiratoryRate)       : null,
                bloodSugar:             formData.bloodSugar            ? parseFloat(formData.bloodSugar)            : null,
                co2Level:               formData.co2Level              ? parseFloat(formData.co2Level)              : null,
                notes: formData.notes,
            });
            setFormData(EMPTY_FORM);
            setShowAddForm(false);
            fetchVitals();
            fetchLatestVitals();
        } catch (e) {
            console.error('Error adding vitals:', e);
            alert('Failed to add vital reading. Please try again.');
        }
    };

    // ── Computed data ─────────────────────────────────────────────────────────

    const rawVitals = timeKey === 'readings' ? vitals.slice(0, readingsCount) : vitals;
    const chartData = rawVitals.slice().reverse().map(v => ({
        time:        new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        heartRate:   v.heartRate             || null,
        systolic:    v.bloodPressureSystolic  || null,
        diastolic:   v.bloodPressureDiastolic || null,
        spo2:        v.oxygenSaturation       || null,
        respiratory: v.respiratoryRate        || null,
        temperature: v.temperature            || null,
    }));

    // Sparkline data per vital (last 8 readings)
    const sparkOf = (key) => vitals.slice(0, 8).reverse().map((v, i) => ({ i, v: v[key] || null }));

    const computeAlerts = () => {
        if (!latestVitals) return [];
        const alerts = [];
        const ts  = latestVitals.timestamp;
        const timeStr = ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

        const checks = [
            { key: 'oxygenSaturation', label: `Low SpO2 Alert (${latestVitals.oxygenSaturation}%)`, detail: `Today, ${timeStr} • Triggered Alarm`, severity: 'warn' },
            { key: 'heartRate',        label: `Heart Rate ${getVitalStatus('heartRate', latestVitals.heartRate) === 'high' ? 'Elevated' : 'Stabilized'}`, detail: `Today, ${timeStr} • Following Meds`, severity: 'info' },
            { key: 'bloodPressureSystolic', label: `BP ${latestVitals.bloodPressureSystolic}/${latestVitals.bloodPressureDiastolic} mmHg`, detail: `Today, ${timeStr} • Monitoring`, severity: 'info' },
        ];

        for (const c of checks) {
            const status = getVitalStatus(c.key, latestVitals[c.key]);
            if (status !== 'normal' && status !== 'unknown') {
                alerts.push({ title: c.label, detail: c.detail, severity: 'warn' });
            } else if (latestVitals[c.key] != null && c.severity === 'info') {
                alerts.push({ title: c.label, detail: c.detail, severity: 'info' });
            }
            if (alerts.length >= 3) break;
        }
        return alerts.slice(0, 3);
    };

    const alerts      = computeAlerts();
    const handoverNote = [...vitals].reverse().find(v => v.notes)?.notes || null;

    // ── Sub-components ────────────────────────────────────────────────────────

    const Sparkline = ({ dataKey }) => {
        const data = sparkOf(dataKey);
        if (data.every(d => d.v == null)) return null;
        return (
            <div className="vm-sparkline">
                <ResponsiveContainer width="100%" height={46}>
                    <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                        <Line type="monotone" dataKey="v" stroke="rgba(52,211,153,0.75)" strokeWidth={1.5} dot={false} connectNulls />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        );
    };

    const VitalCard = ({ title, value, unit, icon: Icon, type, sparkKey, secondaryLabel }) => {
        const status = getVitalStatus(type, typeof value === 'string' ? parseFloat(value) : value);
        const label  = getStatusLabel(type, status);
        const timeAgo = latestVitals?.timestamp ? getTimeAgo(latestVitals.timestamp) : null;

        return (
            <div className={`vm-vital-card vm-status-${status}`}>
                <div className="vm-card-top">
                    <span className="vm-card-title">{title}</span>
                    <div className={`vm-card-icon vm-icon-${status}`}><Icon size={18} /></div>
                </div>
                <div className="vm-card-value">
                    {value != null && value !== '' ? (
                        <>
                            <span className="vm-val-num">{value}</span>
                            <span className="vm-val-unit">{unit}</span>
                        </>
                    ) : (
                        <span className="vm-no-data">No data</span>
                    )}
                </div>
                <div className="vm-card-bottom">
                    <div className="vm-card-foot-left">
                        {value != null && (
                            <span className={`vm-status-pill vm-pill-${status}`}>{label}</span>
                        )}
                        {timeAgo && <span className="vm-time-ago">Last Reading: {timeAgo}</span>}
                        {secondaryLabel && <span className="vm-secondary-label">{secondaryLabel}</span>}
                    </div>
                    {sparkKey && <Sparkline dataKey={sparkKey} />}
                </div>
            </div>
        );
    };

    const bpValue = latestVitals?.bloodPressureSystolic && latestVitals?.bloodPressureDiastolic
        ? `${latestVitals.bloodPressureSystolic}/${latestVitals.bloodPressureDiastolic}`
        : null;

    const tooltipStyle = {
        backgroundColor: 'rgba(8,16,34,0.95)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: '10px',
        fontSize: '12px',
        color: 'rgba(255,255,255,0.85)',
    };

    // ── Generic chart renderer ────────────────────────────────────────────────
    // series: [{ key, stroke, name, dashed? }]
    // opts:   { height, domain, showLegend, margin, formatter }
    const renderChart = (data, series, opts = {}) => {
        const {
            height = 130,
            domain,
            showLegend = false,
            margin = { top: 8, right: 8, left: -10, bottom: 0 },
            formatter,
        } = opts;

        const axisColor   = isDarkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.20)';
        const tickColor   = isDarkMode ? 'rgba(255,255,255,0.55)' : '#64748b';
        const gridColor   = isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)';
        const legendColor = isDarkMode ? 'rgba(255,255,255,0.65)' : '#475569';

        const axisProps = {
            stroke: axisColor,
            tick: { fontSize: 10, fill: tickColor },
            tickLine: false,
            axisLine: false,
        };
        const shared = { data, margin };

        const grid  = <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />;
        const xAxis = <XAxis dataKey="time" {...axisProps} />;
        const yAxis = <YAxis domain={domain || ['auto', 'auto']} {...axisProps} width={28} />;
        const tip   = <Tooltip contentStyle={tooltipStyle} formatter={formatter} />;
        const leg   = showLegend
            ? <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: legendColor, paddingTop: 8 }} />
            : null;

        const seriesEls = series.map(s => {
            if (chartType === 'area') return (
                <Area key={s.key} type="monotone" dataKey={s.key}
                    stroke={s.stroke} fill={s.stroke} fillOpacity={0.12}
                    name={s.name} connectNulls dot={false} strokeWidth={2}
                    strokeDasharray={s.dashed ? '6 3' : undefined} />
            );
            if (chartType === 'bar') return (
                <Bar key={s.key} dataKey={s.key} fill={s.stroke}
                    name={s.name} radius={[3, 3, 0, 0]} maxBarSize={18} />
            );
            return (
                <Line key={s.key} type="monotone" dataKey={s.key}
                    stroke={s.stroke} strokeWidth={2} dot={false}
                    name={s.name} connectNulls
                    strokeDasharray={s.dashed ? '6 3' : undefined} />
            );
        });

        const ChartComp = chartType === 'area' ? AreaChart
                        : chartType === 'bar'  ? BarChart
                        : LineChart;

        return (
            <ResponsiveContainer width="100%" height={height}>
                <ChartComp {...shared}>
                    {grid}{xAxis}{yAxis}{tip}{leg}
                    {seriesEls}
                </ChartComp>
            </ResponsiveContainer>
        );
    };

    return (
        <div className="vm-root">
            {/* ── Main row: vitals grid + sidebar ── */}
            <div className="vm-main-row">
                <div className="vm-cards-area">
                    {latestVitals ? (
                        <div className="vm-cards-grid">
                            <VitalCard title="HEART RATE"    value={latestVitals.heartRate}       unit="BPM"    icon={Heart}       type="heartRate"             sparkKey="heartRate" />
                            <VitalCard title="BLOOD PRESSURE" value={bpValue}                     unit="mmHg"   icon={Activity}    type="bloodPressureSystolic" sparkKey="systolic"  secondaryLabel="Continuous" />
                            <VitalCard title="SPO2"          value={latestVitals.oxygenSaturation} unit="%"     icon={Wind}        type="oxygenSaturation"      sparkKey="spo2"      secondaryLabel={latestVitals.oxygenSaturation < 95 ? 'Check Oxygen' : null} />
                            <VitalCard title="TEMPERATURE"   value={latestVitals.temperature ? parseFloat(latestVitals.temperature).toFixed(1) : null} unit="°F" icon={Thermometer} type="temperature" sparkKey="temperature" />
                            <VitalCard title="RESPIRATION"   value={latestVitals.respiratoryRate} unit="RPM"    icon={Wind}        type="respiratoryRate"       sparkKey="respiratory" secondaryLabel="Continuous" />
                            <VitalCard title="BLOOD GLUCOSE" value={latestVitals.bloodSugar}       unit="mg/dL" icon={Droplets}    type="bloodSugar"            sparkKey={null} />
                        </div>
                    ) : (
                        <div className="vm-no-vitals">
                            <AlertCircle size={40} />
                            <p>No vital signs recorded yet</p>
                            <button className="vm-btn-primary" onClick={() => setShowAddForm(true)}>
                                <Plus size={16} /> Add First Reading
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Sidebar ── */}
                <aside className="vm-sidebar">
                    <div className="vm-sidebar-section">
                        <h4 className="vm-sidebar-title">Vitals Alert History</h4>
                        {alerts.length > 0 ? alerts.map((a, i) => (
                            <div key={i} className={`vm-alert-item vm-alert-${a.severity}`}>
                                <div className="vm-alert-name">{a.title}</div>
                                <div className="vm-alert-detail">{a.detail}</div>
                            </div>
                        )) : (
                            <p className="vm-sidebar-empty">No active alerts</p>
                        )}
                    </div>

                    <div className="vm-sidebar-section">
                        <h4 className="vm-sidebar-title">Shift Handover Note</h4>
                        <blockquote className="vm-handover-note">
                            "{handoverNote || 'No handover note recorded for this shift.'}"
                        </blockquote>
                        <button className="vm-update-note-btn" onClick={() => setShowAddForm(true)}>
                            <Edit3 size={13} /> Update Clinical Note
                        </button>
                    </div>
                </aside>
            </div>

            {/* ── Vital Trends ── */}
            <div className="vm-trends-section">
                <div className="vm-trends-header">
                    <h3 className="vm-trends-title">
                        Vital Trends{' '}
                        <span className="vm-trends-sub">
                            {timeKey === 'live'     && '— Live'}
                            {timeKey === '1h'       && '— Last 1 Hour'}
                            {timeKey === '12h'      && '— Last 12 Hours'}
                            {timeKey === '24h'      && '— Last 24 Hours'}
                            {timeKey === 'readings' && `— Last ${readingsCount} Readings`}
                        </span>
                    </h3>
                    <div className="vm-controls-row">
                        <div className="vm-time-btns">
                            {[
                                { label: 'Live',      key: 'live'     },
                                { label: '1H',        key: '1h'       },
                                { label: '12H',       key: '12h'      },
                                { label: '24H',       key: '24h'      },
                                { label: 'Readings',  key: 'readings' },
                            ].map(({ label, key }) => (
                                <button
                                    key={key}
                                    className={`vm-time-btn ${timeKey === key ? 'active' : ''}`}
                                    onClick={() => setTimeKey(key)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        <div className="vm-chart-type-btns">
                            {[
                                { key: 'line', label: '〜 Line'  },
                                { key: 'area', label: '◭ Area'  },
                                { key: 'bar',  label: '▐ Bar'   },
                            ].map(({ key, label }) => (
                                <button
                                    key={key}
                                    className={`vm-type-btn ${chartType === key ? 'active' : ''}`}
                                    onClick={() => setChartType(key)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {timeKey === 'readings' && (
                    <div className="vm-readings-sub">
                        <span className="vm-readings-label">Show last:</span>
                        {[10, 25, 50, 100].map(n => (
                            <button
                                key={n}
                                className={`vm-readings-btn ${readingsCount === n ? 'active' : ''}`}
                                onClick={() => setReadingsCount(n)}
                            >
                                {n}
                            </button>
                        ))}
                        <span className="vm-readings-label">readings</span>
                    </div>
                )}

                {loading ? (
                    <div className="vm-chart-loading">Loading chart data…</div>
                ) : chartData.length > 0 ? (
                    <div className="vm-main-chart">
                        {renderChart(chartData, [
                            { key: 'heartRate', stroke: '#00c8e0', name: 'Heart Rate (BPM)' },
                            { key: 'systolic',  stroke: '#34d399', name: 'Blood Pressure (Sys)', dashed: true },
                        ], { height: 260, showLegend: true, margin: { top: 8, right: 16, left: 0, bottom: 8 } })}
                    </div>
                ) : (
                    <div className="vm-chart-loading">No data for selected time range</div>
                )}
            </div>

            {/* ── Individual trend charts ── */}
            {chartData.length > 0 && (
                <div className="vm-bottom-charts">
                    {[
                        { title: 'Heart Rate (BPM)',                badge: 'vm-stable-badge',    badgeText: 'NORMAL: 60–100',        dataKey: 'heartRate',   stroke: '#00c8e0', domain: [40, 160],  fmt: (v) => [`${v} BPM`,   'Heart Rate']   },
                        { title: 'Temperature (°F)',                badge: 'vm-stable-badge',    badgeText: 'NORMAL: 97–99',         dataKey: 'temperature', stroke: '#fbbf24', domain: [94, 106],  fmt: (v) => [`${v} °F`,    'Temperature']  },
                        { title: 'Blood Pressure — Systolic (mmHg)',badge: 'vm-stable-badge',    badgeText: 'NORMAL: 90–120',        dataKey: 'systolic',    stroke: '#34d399', domain: [60, 200],  fmt: (v) => [`${v} mmHg`,  'Systolic']     },
                        { title: 'Oxygen Saturation (%)',           badge: 'vm-threshold-badge', badgeText: 'ALERT THRESHOLD: 92%', dataKey: 'spo2',        stroke: '#f87171', domain: [85, 100],  fmt: (v) => [`${v}%`,      'SpO2']         },
                        { title: 'Blood Pressure — Diastolic (mmHg)',badge:'vm-stable-badge',    badgeText: 'NORMAL: 60–80',         dataKey: 'diastolic',   stroke: '#ec4899', domain: [40, 140],  fmt: (v) => [`${v} mmHg`,  'Diastolic']    },
                        { title: 'Respiration Rate (RPM)',          badge: 'vm-stable-badge',    badgeText: 'NORMAL: 12–20',         dataKey: 'respiratory', stroke: '#34d399', domain: [0, 40],    fmt: (v) => [`${v} RPM`,   'Respiration']  },
                    ].map(({ title, badge, badgeText, dataKey, stroke, domain, fmt }) => (
                        <div key={dataKey} className="vm-mini-chart-card">
                            <div className="vm-mini-header">
                                <span>{title}</span>
                                <span className={badge}>{badgeText}</span>
                            </div>
                            {renderChart(chartData, [{ key: dataKey, stroke, name: title }], { domain, formatter: fmt })}
                        </div>
                    ))}
                </div>
            )}

            {/* ── Add Reading FAB ── */}
            <button className="vm-add-fab" onClick={() => setShowAddForm(!showAddForm)}>
                {showAddForm ? <Minus size={16} /> : <Plus size={16} />}
                {showAddForm ? 'Cancel' : 'Add Reading'}
            </button>

            {/* ── Add Reading Form ── */}
            {showAddForm && (
                <div className="vm-form-overlay" onClick={(e) => e.target === e.currentTarget && setShowAddForm(false)}>
                    <div className="vm-form-card">
                        <div className="vm-form-header">
                            <h3>Manual Vital Signs Entry</h3>
                            <button className="vm-form-close" onClick={() => setShowAddForm(false)}>✕</button>
                        </div>
                        <p className="vm-form-desc">
                            <AlertCircle size={14} /> Record vital signs manually for this patient.
                        </p>
                        <form onSubmit={handleSubmit}>
                            <div className="vm-form-grid">
                                <div className="vm-form-group">
                                    <label>Heart Rate (BPM)</label>
                                    <input type="number" name="heartRate" value={formData.heartRate} onChange={handleInputChange} placeholder="60–100" min="0" max="300" />
                                </div>
                                <div className="vm-form-group vm-form-bp">
                                    <label>Blood Pressure (mmHg)</label>
                                    <div className="vm-bp-row">
                                        <input type="number" name="bloodPressureSystolic"  value={formData.bloodPressureSystolic}  onChange={handleInputChange} placeholder="Systolic"  min="60" max="300" />
                                        <span>/</span>
                                        <input type="number" name="bloodPressureDiastolic" value={formData.bloodPressureDiastolic} onChange={handleInputChange} placeholder="Diastolic" min="40" max="200" />
                                    </div>
                                </div>
                                <div className="vm-form-group">
                                    <label>O2 Saturation (%)</label>
                                    <input type="number" name="oxygenSaturation" value={formData.oxygenSaturation} onChange={handleInputChange} placeholder="95–100" min="0" max="100" step="0.1" />
                                </div>
                                <div className="vm-form-group">
                                    <label>Temperature (°F)</label>
                                    <input type="number" name="temperature" value={formData.temperature} onChange={handleInputChange} placeholder="97–99" min="90" max="110" step="0.1" />
                                </div>
                                <div className="vm-form-group">
                                    <label>Respiratory Rate (/min)</label>
                                    <input type="number" name="respiratoryRate" value={formData.respiratoryRate} onChange={handleInputChange} placeholder="12–20" min="0" max="100" />
                                </div>
                                <div className="vm-form-group">
                                    <label>Blood Sugar (mg/dL)</label>
                                    <input type="number" name="bloodSugar" value={formData.bloodSugar} onChange={handleInputChange} placeholder="70–140" min="0" max="600" />
                                </div>
                                <div className="vm-form-group">
                                    <label>CO2 Level (%)</label>
                                    <input type="number" name="co2Level" value={formData.co2Level} onChange={handleInputChange} placeholder="35–45" step="0.1" />
                                </div>
                                <div className="vm-form-group vm-form-notes">
                                    <label>Clinical Notes</label>
                                    <textarea name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Any observations for this reading…" rows={2} />
                                </div>
                            </div>
                            <div className="vm-form-actions">
                                <button type="button" className="vm-btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
                                <button type="submit" className="vm-btn-primary">Save Reading</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VitalsMonitor;
