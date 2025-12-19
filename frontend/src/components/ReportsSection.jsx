import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../utils/api';
import { FileText, Upload, Plus, Download, Trash2, Calendar, Tag, AlertCircle } from 'lucide-react';
import './ReportsSection.css';

const ReportsSection = ({ patientId, readOnly = false }) => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [uploadType, setUploadType] = useState('text'); // 'text' or 'file'
    const [viewingReport, setViewingReport] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        category: 'lab',
        content: '',
        file: null,
        description: ''
    });

    useEffect(() => {
        fetchReports();
    }, [patientId]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const response = await reportsAPI.getPatientReports(patientId);
            setReports(response.data.data);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        setFormData(prev => ({
            ...prev,
            file: e.target.files[0]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (uploadType === 'text') {
                await reportsAPI.createText({
                    ...formData,
                    patientId
                });
            } else {
                const data = new FormData();
                data.append('patientId', patientId);
                data.append('title', formData.title);
                data.append('category', formData.category);
                data.append('description', formData.description);
                if (formData.file) {
                    data.append('file', formData.file);
                }
                await reportsAPI.uploadFile(data);
            }

            // Reset form and refresh
            setShowAddForm(false);
            setFormData({
                title: '',
                category: 'Lab Results',
                content: '',
                file: null,
                description: ''
            });
            fetchReports();
        } catch (error) {
            console.error('Error adding report:', error);
            const message = error.response?.data?.message || 'Failed to add report';
            alert(`Error: ${message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this report?')) return;
        try {
            await reportsAPI.delete(id);
            fetchReports();
        } catch (error) {
            console.error('Error deleting report:', error);
            alert('Failed to delete report');
        }
    };

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
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download file');
        }
    };

    return (
        <div className="reports-section">
            <div className="reports-header">
                <div className="header-left">
                    <FileText size={28} className="reports-icon" />
                    <div>
                        <h2>Reports & Documents</h2>
                        <p className="text-muted">Medical records, lab results, and imaging reports</p>
                    </div>
                </div>

                {!readOnly && (
                    <button
                        className="btn-primary"
                        onClick={() => setShowAddForm(!showAddForm)}
                    >
                        {showAddForm ? 'Cancel' : <><Plus size={20} /> Add Report</>}
                    </button>
                )}
            </div>

            {/* Add Report Form */}
            {showAddForm && !readOnly && (
                <div className="add-report-form card">
                    <h3>Add New Report</h3>

                    <div className="upload-type-toggle">
                        <button
                            type="button"
                            className={uploadType === 'text' ? 'active' : ''}
                            onClick={() => setUploadType('text')}
                        >
                            <FileText size={18} /> Text Report
                        </button>
                        <button
                            type="button"
                            className={uploadType === 'file' ? 'active' : ''}
                            onClick={() => setUploadType('file')}
                        >
                            <Upload size={18} /> Upload File
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="report-form-grid">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Report Title *</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="e.g., Blood Test Results"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Category *</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="lab">Lab Results</option>
                                    <option value="radiology">Imaging (X-Ray, MRI)</option>
                                    <option value="clinical">Clinical Notes</option>
                                    <option value="discharge">Discharge Summary</option>
                                    <option value="consultation">Consultation</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>

                        {uploadType === 'text' ? (
                            <div className="form-group">
                                <label>Report Content *</label>
                                <textarea
                                    name="content"
                                    value={formData.content}
                                    onChange={handleChange}
                                    placeholder="Enter report content, findings, observations..."
                                    required
                                    rows={6}
                                />
                            </div>
                        ) : (
                            <div className="form-group">
                                <label>Upload File *</label>
                                <label className="file-upload-area">
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        required
                                    />
                                    <div className="upload-placeholder">
                                        <Upload size={32} />
                                        <span>Click or drag and drop to upload file</span>
                                    </div>
                                    {formData.file && (
                                        <div className="file-name">
                                            Selected: {formData.file.name}
                                        </div>
                                    )}
                                </label>
                            </div>
                        )}

                        <div className="form-group">
                            <label>Description (Optional)</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Add additional notes or description for this report..."
                                rows={3}
                            />
                        </div>

                        <div className="form-actions">
                            <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)}>
                                Cancel
                            </button>
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Saving...' : 'Add Report'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Reports List */}
            <div className="reports-list card">
                <h3>Medical Reports</h3>

                {loading ? (
                    <div className="loading">Loading reports...</div>
                ) : reports.length > 0 ? (
                    <div className="reports-grid">
                        {reports.map((report) => (
                            <div key={report._id} className="report-card" style={{ position: 'relative' }}>
                                {!readOnly && (
                                    <button
                                        className="delete-btn-corner"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(report._id);
                                        }}
                                        title="Delete Report"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                                <div className="report-header">
                                    <div className="report-icon">
                                        <FileText size={24} />
                                    </div>
                                    <div className="report-info">
                                        <h4>{report.title}</h4>
                                        <div className="report-meta">
                                            <span className="category">
                                                <Tag size={14} />
                                                {report.category}
                                            </span>
                                            <span className="date">
                                                <Calendar size={14} />
                                                {new Date(report.timestamp).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {report.content && (
                                    <div className="report-preview">
                                        {report.content.substring(0, 150)}
                                        {report.content.length > 150 && '...'}
                                    </div>
                                )}

                                {report.aiSummary && (
                                    <div className="ai-summary">
                                        <strong>AI Summary:</strong> {report.aiSummary}
                                    </div>
                                )}

                                <div className="report-actions">
                                    <button
                                        className="action-btn view"
                                        onClick={() => setViewingReport(report)}
                                        style={{ background: 'var(--bg-tertiary)', color: 'var(--color-primary)' }}
                                    >
                                        <FileText size={16} />
                                        View
                                    </button>
                                    {report.fileUrl && (
                                        <button
                                            className="action-btn download"
                                            onClick={() => handleDownload(report._id, report.fileName)}
                                        >
                                            <Download size={16} />
                                            Download
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="no-reports">
                        <AlertCircle size={48} />
                        <p>No reports uploaded yet</p>
                        <button className="btn-primary" onClick={() => setShowAddForm(true)}>
                            <Plus size={20} />
                            Add First Report
                        </button>
                    </div>
                )}
            </div>

            {/* View Report Modal */}
            {viewingReport && (
                <div className="modal-overlay" onClick={() => setViewingReport(null)}>
                    <div className="report-modal-pro" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="modal-header-pro">
                            <h3>{viewingReport.title}</h3>
                            <button
                                className="close-btn-pro"
                                onClick={() => setViewingReport(null)}
                            >&times;</button>
                        </div>

                        <div className="modal-body-pro">
                            {/* Metadata Bento Grid */}
                            <div className="meta-bento-grid">
                                <div className="meta-card category">
                                    <span className="meta-label">Category</span>
                                    <span className="meta-value">{viewingReport.category}</span>
                                </div>
                                <div className="meta-card date">
                                    <span className="meta-label">Date</span>
                                    <span className="meta-value">
                                        {new Date(viewingReport.timestamp || viewingReport.createdAt).toLocaleDateString('en-US', {
                                            year: 'numeric', month: 'long', day: 'numeric'
                                        })}
                                    </span>
                                </div>
                                <div className="meta-card type">
                                    <span className="meta-label">Type</span>
                                    <span className="meta-value" style={{ textTransform: 'capitalize' }}>
                                        {viewingReport.type}
                                    </span>
                                </div>
                            </div>

                            {/* Description */}
                            {viewingReport.description && (
                                <div className="content-section description-section">
                                    <h4>Description</h4>
                                    <p>{viewingReport.description}</p>
                                </div>
                            )}

                            {/* Text Content */}
                            {viewingReport.content && (
                                <div className="content-section text-content">
                                    <h4>Report Content</h4>
                                    <p>{viewingReport.content}</p>
                                </div>
                            )}

                            {/* File Attachment */}
                            {viewingReport.fileUrl && (
                                <div className="content-section file-section">
                                    <h4>Attached Document</h4>
                                    <div className="file-preview-card">
                                        <div className="file-icon-wrapper">
                                            📄
                                        </div>
                                        <div className="file-details">
                                            <div className="file-name">{viewingReport.fileName}</div>
                                            <div className="file-size">
                                                {(viewingReport.fileSize / 1024).toFixed(2)} KB • {viewingReport.type.toUpperCase()}
                                            </div>
                                        </div>
                                        <button
                                            className="btn-download-pro"
                                            onClick={() => handleDownload(viewingReport._id, viewingReport.fileName)}
                                        >
                                            <Download size={16} /> Download
                                        </button>
                                    </div>

                                    {/* Image Preview */}
                                    {viewingReport.type === 'image' && (
                                        <div className="image-preview-container">
                                            <img
                                                src={viewingReport.fileUrl}
                                                alt={viewingReport.title}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* AI Summary */}
                            {viewingReport.aiSummary && (
                                <div className="content-section ai-summary-pro">
                                    <h4><span>🤖</span> AI Summary</h4>
                                    <p>{viewingReport.aiSummary}</p>
                                </div>
                            )}

                            {/* No Content */}
                            {!viewingReport.content && !viewingReport.fileUrl && (
                                <div className="empty-state-pro">
                                    <p>No content available for this report</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportsSection;
