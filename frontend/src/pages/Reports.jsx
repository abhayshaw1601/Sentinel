import React, { useState, useEffect } from 'react';
import { patientAPI, reportsAPI } from '../utils/api';
import { FileText, Search, Download, Tag, Calendar, Eye, Trash2, AlertCircle } from 'lucide-react';
import './Dashboard.css';

const Reports = () => {
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [viewingReport, setViewingReport] = useState(null);

    useEffect(() => {
        patientAPI.getAll({ status: 'admitted' }).then(r => {
            setPatients(r.data.data || []);
        }).catch(console.error);
    }, []);

    useEffect(() => {
        if (!selectedPatient) { setReports([]); return; }
        setLoading(true);
        reportsAPI.getPatientReports(selectedPatient._id)
            .then(r => setReports(r.data.data || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [selectedPatient]);

    const handleDownload = async (id, fileName) => {
        try {
            const response = await reportsAPI.download(id);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName || 'report');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch { alert('Failed to download file'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this report?')) return;
        try {
            await reportsAPI.delete(id);
            setReports(prev => prev.filter(r => r._id !== id));
        } catch { alert('Failed to delete report'); }
    };

    const filteredPatients = search
        ? patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
        : patients;

    return (
        <div className="clinical-dashboard fade-in">
            <div className="clinical-header">
                <div>
                    <h1 className="clinical-title">Reports</h1>
                    <p className="clinical-subtitle">Browse medical reports and documents by patient.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
                {/* Patient selector */}
                <section className="clinical-card" style={{ height: 'fit-content' }}>
                    <div className="clinical-card-head">
                        <h3>Select Patient</h3>
                    </div>
                    <div className="clinical-search" style={{ margin: '0 1rem 0.75rem' }}>
                        <Search size={14} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search patients..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '0 0.5rem 0.5rem' }}>
                        {filteredPatients.length === 0 ? (
                            <p className="text-muted" style={{ padding: '1rem', textAlign: 'center' }}>No patients found.</p>
                        ) : filteredPatients.map(p => (
                            <button
                                key={p._id}
                                className={`staff-row ${selectedPatient?._id === p._id ? 'active' : ''}`}
                                onClick={() => setSelectedPatient(p)}
                                style={selectedPatient?._id === p._id ? { background: 'var(--color-primary-faint)', borderColor: 'var(--color-primary)' } : {}}
                            >
                                <div className="patient-initial" style={{ width: 32, height: 32, fontSize: '0.85rem', flexShrink: 0 }}>
                                    {p.name?.charAt(0)?.toUpperCase()}
                                </div>
                                <div className="staff-meta">
                                    <div className="staff-name">{p.name}</div>
                                    <div className="staff-shift text-muted">ID: {p.patientId}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Reports panel */}
                <section className="clinical-card">
                    <div className="clinical-card-head">
                        <h3>
                            {selectedPatient ? `Reports — ${selectedPatient.name}` : 'Reports'}
                        </h3>
                    </div>

                    {!selectedPatient ? (
                        <div style={{ padding: '4rem', textAlign: 'center' }}>
                            <FileText size={48} style={{ opacity: 0.2, display: 'block', margin: '0 auto 1rem' }} />
                            <p className="text-muted">Select a patient on the left to view their reports.</p>
                        </div>
                    ) : loading ? (
                        <div className="text-center p-4">Loading reports...</div>
                    ) : reports.length === 0 ? (
                        <div style={{ padding: '4rem', textAlign: 'center' }}>
                            <AlertCircle size={48} style={{ opacity: 0.2, display: 'block', margin: '0 auto 1rem' }} />
                            <p className="text-muted">No reports for this patient.</p>
                        </div>
                    ) : (
                        <div className="table-wrapper">
                            <table className="dense-data-table">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Category</th>
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th className="text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.map(report => (
                                        <tr key={report._id}>
                                            <td className="fw-500">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <FileText size={16} style={{ opacity: 0.5, flexShrink: 0 }} />
                                                    {report.title}
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <Tag size={12} /> {report.category}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <Calendar size={12} />
                                                    {new Date(report.timestamp || report.createdAt).toLocaleDateString()}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${report.type === 'file' ? 'badge-info' : 'badge-success'}`}>
                                                    {report.type}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <div className="row-actions">
                                                    <button className="icon-btn-sm" onClick={() => setViewingReport(report)} title="View">
                                                        <Eye size={14} />
                                                    </button>
                                                    {report.fileUrl && (
                                                        <button className="icon-btn-sm success" onClick={() => handleDownload(report._id, report.fileName)} title="Download">
                                                            <Download size={14} />
                                                        </button>
                                                    )}
                                                    <button className="icon-btn-sm danger" onClick={() => handleDelete(report._id)} title="Delete">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>

            {/* View Report Modal */}
            {viewingReport && (
                <div className="modal-overlay" onClick={() => setViewingReport(null)}>
                    <div className="report-modal-pro" onClick={e => e.stopPropagation()}>
                        <div className="modal-header-pro">
                            <h3>{viewingReport.title}</h3>
                            <button className="close-btn-pro" onClick={() => setViewingReport(null)}>&times;</button>
                        </div>
                        <div className="modal-body-pro">
                            <div className="meta-bento-grid">
                                <div className="meta-card category"><span className="meta-label">Category</span><span className="meta-value">{viewingReport.category}</span></div>
                                <div className="meta-card date"><span className="meta-label">Date</span><span className="meta-value">{new Date(viewingReport.timestamp || viewingReport.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
                                <div className="meta-card type"><span className="meta-label">Type</span><span className="meta-value" style={{ textTransform: 'capitalize' }}>{viewingReport.type}</span></div>
                            </div>
                            {viewingReport.description && (
                                <div className="content-section description-section"><h4>Description</h4><p>{viewingReport.description}</p></div>
                            )}
                            {viewingReport.content && (
                                <div className="content-section text-content"><h4>Report Content</h4><p>{viewingReport.content}</p></div>
                            )}
                            {viewingReport.aiSummary && (
                                <div className="content-section ai-summary-pro"><h4>🤖 AI Summary</h4><p>{viewingReport.aiSummary}</p></div>
                            )}
                            {!viewingReport.content && !viewingReport.fileUrl && (
                                <div className="empty-state-pro"><p>No content available for this report.</p></div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
