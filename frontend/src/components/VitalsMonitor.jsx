import React, { useState, useEffect } from 'react';
import { vitalsAPI } from '../utils/api';
import { Activity, Plus, AlertCircle, TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './VitalsMonitor.css';

const VitalsMonitor = ({ patientId }) => {
    const [vitals, setVitals] = useState([]);
    const [latestVitals, setLatestVitals] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [timeRange, setTimeRange] = useState('24h');
    const [viewMode, setViewMode] = useState('graphs'); // 'graphs' or 'table'

    const [formData, setFormData] = useState({
        heartRate: '',
        bloodPressureSystolic: '',
        bloodPressureDiastolic: '',
        oxygenSaturation: '',
        temperature: '',
        respiratoryRate: '',
        bloodSugar: '',
        co2Level: '',
        notes: ''
    });

    useEffect(() => {
        fetchVitals();
        fetchLatestVitals();
    }, [patientId, timeRange]);

    const fetchVitals = async () => {
        try {
            setLoading(true);
            const response = await vitalsAPI.getPatientVitals(patientId, { timeRange });
            setVitals(response.data.data);
        } catch (error) {
            console.error('Error fetching vitals:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLatestVitals = async () => {
        try {
            const response = await vitalsAPI.getLatest(patientId);
            setLatestVitals(response.data.data);
        } catch (error) {
            console.error('Error fetching latest vitals:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const dataToSend = {
                patientId,
                heartRate: formData.heartRate ? parseFloat(formData.heartRate) : null,
                bloodPressureSystolic: formData.bloodPressureSystolic ? parseFloat(formData.bloodPressureSystolic) : null,
                bloodPressureDiastolic: formData.bloodPressureDiastolic ? parseFloat(formData.bloodPressureDiastolic) : null,
                oxygenSaturation: formData.oxygenSaturation ? parseFloat(formData.oxygenSaturation) : null,
                temperature: formData.temperature ? parseFloat(formData.temperature) : null,
                respiratoryRate: formData.respiratoryRate ? parseFloat(formData.respiratoryRate) : null,
                bloodSugar: formData.bloodSugar ? parseFloat(formData.bloodSugar) : null,
                co2Level: formData.co2Level ? parseFloat(formData.co2Level) : null,
                notes: formData.notes
            };

            await vitalsAPI.create(dataToSend);

            // Reset form
            setFormData({
                heartRate: '',
                bloodPressureSystolic: '',
                bloodPressureDiastolic: '',
                oxygenSaturation: '',
                temperature: '',
                respiratoryRate: '',
                bloodSugar: '',
                co2Level: '',
                notes: ''
            });

            setShowAddForm(false);
            fetchVitals();
            fetchLatestVitals();
        } catch (error) {
            console.error('Error adding vitals:', error);
            alert('Failed to add vital reading. Please try again.');
        }
    };

    const getVitalStatus = (type, value) => {
        if (!value) return 'normal';

        const ranges = {
            heartRate: { low: 60, high: 100 },
            oxygenSaturation: { low: 95, high: 100 },
            temperature: { low: 97, high: 99 },
            bloodPressureSystolic: { low: 90, high: 120 },
            bloodSugar: { low: 70, high: 140 },
            respiratoryRate: { low: 12, high: 20 }
        };

        const range = ranges[type];
        if (!range) return 'normal';

        if (value < range.low) return 'low';
        if (value > range.high) return 'high';
        return 'normal';
    };

    // Prepare data for charts
    const prepareChartData = () => {
        return vitals.slice().reverse().map((vital) => ({
            time: new Date(vital.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            heartRate: vital.heartRate || null,
            temperature: vital.temperature || null,
            systolic: vital.bloodPressureSystolic || null,
            diastolic: vital.bloodPressureDiastolic || null,
            spo2: vital.oxygenSaturation || null,
            respiratory: vital.respiratoryRate || null
        }));
    };

    const VitalCard = ({ title, value, unit, icon: Icon, type }) => {
        const status = getVitalStatus(type, value);

        return (
            <div className={`vital-card ${status}`}>
                <div className="vital-icon">
                    <Icon size={24} />
                </div>
                <div className="vital-info">
                    <span className="vital-title">{title}</span>
                    <div className="vital-value">
                        {value ? (
                            <>
                                <span className="value-number">{value}</span>
                                <span className="value-unit">{unit}</span>
                            </>
                        ) : (
                            <span className="no-data">No data</span>
                        )}
                    </div>
                </div>
                {status !== 'normal' && (
                    <div className="vital-indicator">
                        {status === 'high' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                    </div>
                )}
            </div>
        );
    };

    const VitalChart = ({ title, dataKey, color, unit, data }) => (
        <div className="chart-container">
            <h4 className="chart-title">{title}</h4>
            <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis
                        dataKey="time"
                        stroke="var(--text-tertiary)"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        stroke="var(--text-tertiary)"
                        style={{ fontSize: '12px' }}
                        unit={unit}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px'
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey={dataKey}
                        stroke={color}
                        strokeWidth={2}
                        dot={{ fill: color, r: 4 }}
                        connectNulls
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );

    const chartData = prepareChartData();

    return (
        <div className="vitals-monitor fade-in">
            <div className="vitals-header">
                <div className="header-left">
                    <Activity size={28} className="activity-icon" />
                    <div>
                        <h2>Vital Trends</h2>
                        <p className="text-muted">Real-time monitoring and historical analysis</p>
                    </div>
                </div>

                <div className="header-actions">
                    <div className="view-toggle">
                        <button
                            className={viewMode === 'graphs' ? 'active' : ''}
                            onClick={() => setViewMode('graphs')}
                        >
                            <BarChart3 size={18} />
                            Graphs
                        </button>
                        <button
                            className={viewMode === 'table' ? 'active' : ''}
                            onClick={() => setViewMode('table')}
                        >
                            Readings
                        </button>
                    </div>

                    <button
                        className="btn-primary"
                        onClick={() => setShowAddForm(!showAddForm)}
                    >
                        {showAddForm ? <Minus size={20} /> : <Plus size={20} />}
                        {showAddForm ? 'Cancel' : 'Add Reading'}
                    </button>
                </div>
            </div>

            {/* Time Range Filters */}
            <div className="time-filters-bar">
                <div className="time-filters">
                    <button
                        className={timeRange === '1h' ? 'active' : ''}
                        onClick={() => setTimeRange('1h')}
                    >
                        Last Hour
                    </button>
                    <button
                        className={timeRange === '24h' ? 'active' : ''}
                        onClick={() => setTimeRange('24h')}
                    >
                        Past 10 readings
                    </button>
                    <button
                        className={timeRange === '7d' ? 'active' : ''}
                        onClick={() => setTimeRange('7d')}
                    >
                        7 Days
                    </button>
                </div>
            </div>

            {/* Manual Entry Form */}
            {showAddForm && (
                <div className="add-vitals-form card">
                    <h3>📝 Manual Vital Signs Entry</h3>
                    <p className="form-description">
                        <AlertCircle size={16} />
                        Use this form to manually record vital signs in case of technical error or equipment malfunction
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Heart Rate (bpm)</label>
                                <input
                                    type="number"
                                    name="heartRate"
                                    value={formData.heartRate}
                                    onChange={handleInputChange}
                                    placeholder="60-100"
                                    min="0"
                                    max="300"
                                    step="0.1"
                                />
                            </div>

                            <div className="form-group">
                                <label>Blood Pressure (mmHg)</label>
                                <div className="bp-inputs">
                                    <input
                                        type="number"
                                        name="bloodPressureSystolic"
                                        value={formData.bloodPressureSystolic}
                                        onChange={handleInputChange}
                                        placeholder="Systolic (90-180)"
                                        min="60"
                                        max="300"
                                        step="1"
                                    />
                                    <span>/</span>
                                    <input
                                        type="number"
                                        name="bloodPressureDiastolic"
                                        value={formData.bloodPressureDiastolic}
                                        onChange={handleInputChange}
                                        placeholder="Diastolic (60-120)"
                                        min="40"
                                        max="200"
                                        step="1"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>O2 Saturation (%)</label>
                                <input
                                    type="number"
                                    name="oxygenSaturation"
                                    value={formData.oxygenSaturation}
                                    onChange={handleInputChange}
                                    placeholder="95-100"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                />
                            </div>

                            <div className="form-group">
                                <label>Temperature (°F)</label>
                                <input
                                    type="number"
                                    name="temperature"
                                    value={formData.temperature}
                                    onChange={handleInputChange}
                                    placeholder="97-99"
                                    min="90"
                                    max="110"
                                    step="0.1"
                                />
                            </div>

                            <div className="form-group">
                                <label>Respiratory Rate (br/min)</label>
                                <input
                                    type="number"
                                    name="respiratoryRate"
                                    value={formData.respiratoryRate}
                                    onChange={handleInputChange}
                                    placeholder="12-20"
                                    min="0"
                                    max="100"
                                    step="1"
                                />
                            </div>

                            <div className="form-group">
                                <label>Blood Sugar (mg/dL)</label>
                                <input
                                    type="number"
                                    name="bloodSugar"
                                    value={formData.bloodSugar}
                                    onChange={handleInputChange}
                                    placeholder="70-140"
                                    min="0"
                                    max="600"
                                    step="1"
                                />
                            </div>

                            <div className="form-group">
                                <label>CO2 Level (%)</label>
                                <input
                                    type="number"
                                    name="co2Level"
                                    value={formData.co2Level}
                                    onChange={handleInputChange}
                                    placeholder="35-45"
                                    step="0.1"
                                />
                            </div>

                            <div className="form-group full-width">
                                <label>Notes (Optional)</label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    placeholder="Any observations or notes about this reading..."
                                    rows="2"
                                />
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)}>
                                Cancel
                            </button>
                            <button type="submit" className="btn-primary">
                                Save Reading
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Latest Vitals Display */}
            <div className="latest-vitals card">
                <h3>📊 Current Vital Signs</h3>
                {latestVitals ? (
                    <div className="vitals-grid">
                        <VitalCard
                            title="Heart Rate"
                            value={latestVitals.heartRate}
                            unit="bpm"
                            icon={Activity}
                            type="heartRate"
                        />
                        <VitalCard
                            title="Blood Pressure"
                            value={latestVitals.bloodPressureSystolic && latestVitals.bloodPressureDiastolic
                                ? `${latestVitals.bloodPressureSystolic}/${latestVitals.bloodPressureDiastolic}`
                                : null}
                            unit="mmHg"
                            icon={Activity}
                            type="bloodPressureSystolic"
                        />
                        <VitalCard
                            title="O2 Saturation"
                            value={latestVitals.oxygenSaturation}
                            unit="%"
                            icon={Activity}
                            type="oxygenSaturation"
                        />
                        <VitalCard
                            title="Temperature"
                            value={latestVitals.temperature}
                            unit="°F"
                            icon={Activity}
                            type="temperature"
                        />
                        <VitalCard
                            title="Respiratory Rate"
                            value={latestVitals.respiratoryRate}
                            unit="br/min"
                            icon={Activity}
                            type="respiratoryRate"
                        />
                        <VitalCard
                            title="Blood Sugar"
                            value={latestVitals.bloodSugar}
                            unit="mg/dL"
                            icon={Activity}
                            type="bloodSugar"
                        />
                    </div>
                ) : (
                    <div className="no-vitals">
                        <AlertCircle size={48} />
                        <p>No vital signs recorded yet</p>
                        <button className="btn-primary" onClick={() => setShowAddForm(true)}>
                            Add First Reading
                        </button>
                    </div>
                )}

                {latestVitals && (
                    <div className="vitals-timestamp">
                        Last updated: {new Date(latestVitals.timestamp).toLocaleString()}
                    </div>
                )}
            </div>

            {/* Graphs or Table View */}
            {viewMode === 'graphs' ? (
                <div className="vitals-graphs card">
                    <h3>📈 Vital Trends</h3>
                    {loading ? (
                        <div className="loading">Loading charts...</div>
                    ) : vitals.length > 0 ? (
                        <div className="charts-grid">
                            <VitalChart
                                title="Heart Rate"
                                dataKey="heartRate"
                                color="#3b82f6"
                                unit=" bpm"
                                data={chartData}
                            />
                            <VitalChart
                                title="Temperature"
                                dataKey="temperature"
                                color="#f59e0b"
                                unit=" °F"
                                data={chartData}
                            />
                            <VitalChart
                                title="Blood Pressure (Systolic)"
                                dataKey="systolic"
                                color="#ef4444"
                                unit=" mmHg"
                                data={chartData}
                            />
                            <VitalChart
                                title="SpO₂"
                                dataKey="spo2"
                                color="#10b981"
                                unit="%"
                                data={chartData}
                            />
                            <VitalChart
                                title="Blood Pressure (Diastolic)"
                                dataKey="diastolic"
                                color="#ec4899"
                                unit=" mmHg"
                                data={chartData}
                            />
                            <VitalChart
                                title="Respiratory Rate"
                                dataKey="respiratory"
                                color="#8b5cf6"
                                unit=" br/min"
                                data={chartData}
                            />
                        </div>
                    ) : (
                        <div className="no-history">
                            <p>No vital signs history for selected time range</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="vitals-history card">
                    <div className="history-header">
                        <h3>📋 Vital Signs Readings</h3>
                    </div>

                    {loading ? (
                        <div className="loading">Loading history...</div>
                    ) : vitals.length > 0 ? (
                        <div className="history-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Time</th>
                                        <th>HR</th>
                                        <th>BP</th>
                                        <th>O2</th>
                                        <th>Temp</th>
                                        <th>RR</th>
                                        <th>Sugar</th>
                                        <th>CO2</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {vitals.map((vital) => (
                                        <tr key={vital._id}>
                                            <td>{new Date(vital.timestamp).toLocaleString()}</td>
                                            <td>{vital.heartRate || '-'}</td>
                                            <td>
                                                {vital.bloodPressureSystolic && vital.bloodPressureDiastolic
                                                    ? `${vital.bloodPressureSystolic}/${vital.bloodPressureDiastolic}`
                                                    : '-'}
                                            </td>
                                            <td>{vital.oxygenSaturation || '-'}</td>
                                            <td>{vital.temperature || '-'}</td>
                                            <td>{vital.respiratoryRate || '-'}</td>
                                            <td>{vital.bloodSugar || '-'}</td>
                                            <td>{vital.co2Level || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="no-history">
                            <p>No vital signs history for selected time range</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default VitalsMonitor;
