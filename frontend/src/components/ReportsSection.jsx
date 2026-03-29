import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../utils/api';
import { FileText, Upload, Plus, Download, Trash2, Calendar, Tag, AlertCircle, Zap, Check, X, Edit3, Loader, ChevronDown, ChevronUp } from 'lucide-react';
import './ReportsSection.css';

const ReportsSection = ({ patientId, readOnly = false }) => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [uploadType, setUploadType] = useState('text'); // 'text' or 'file'
    const [viewingReport, setViewingReport] = useState(null);

    // Extraction state
    const [extractingId, setExtractingId] = useState(null);
    const [extractedData, setExtractedData] = useState(null);
    const [showExtractionModal, setShowExtractionModal] = useState(false);
    const [extractionReportId, setExtractionReportId] = useState(null);
    const [savingExtraction, setSavingExtraction] = useState(false);
    const [expandedExtraction, setExpandedExtraction] = useState({});

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
                category: 'lab',
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

    // --- Extraction Handlers ---
    const handleExtractData = async (reportId) => {
        try {
            setExtractingId(reportId);
            const response = await reportsAPI.extractData(reportId);

            if (response.data.success) {
                setExtractedData({
                    patient_info: response.data.data.patient_info || { Name: '', Age: '', Gender: '', Date: '' },
                    results: response.data.data.results || []
                });
                setExtractionReportId(reportId);
                setShowExtractionModal(true);
            }
        } catch (error) {
            console.error('Extraction failed:', error);
            const message = error.response?.data?.message || 'Failed to extract data from report';
            alert(`Extraction Error: ${message}`);
        } finally {
            setExtractingId(null);
        }
    };

    const handlePatientInfoChange = (field, value) => {
        setExtractedData(prev => ({
            ...prev,
            patient_info: {
                ...prev.patient_info,
                [field]: value
            }
        }));
    };

    const handleResultChange = (index, field, value) => {
        setExtractedData(prev => {
            const newResults = [...prev.results];
            newResults[index] = { ...newResults[index], [field]: value };
            return { ...prev, results: newResults };
        });
    };

    const handleAddRow = () => {
        setExtractedData(prev => ({
            ...prev,
            results: [...prev.results, { Parameter: '', Value: '', Unit: '', 'Reference Range': '' }]
        }));
    };

    const handleRemoveRow = (index) => {
        setExtractedData(prev => ({
            ...prev,
            results: prev.results.filter((_, i) => i !== index)
        }));
    };

    const handleConfirmExtraction = async () => {
        if (!extractedData || !extractionReportId) return;
        try {
            setSavingExtraction(true);
            await reportsAPI.confirmExtraction(extractionReportId, {
                patient_info: extractedData.patient_info,
                results: extractedData.results
            });

            setShowExtractionModal(false);
            setExtractedData(null);
            setExtractionReportId(null);
            fetchReports();
        } catch (error) {
            console.error('Failed to save extraction:', error);
            alert('Failed to save extracted data. Please try again.');
        } finally {
            setSavingExtraction(false);
        }
    };

    const toggleExtraction = (reportId) => {
        setExpandedExtraction(prev => ({
            ...prev,
            [reportId]: !prev[reportId]
        }));
    };

    // Render saved extracted data inline
    const renderSavedExtraction = (report) => {
        if (!report.extractedData?.results?.length) return null;
        const isExpanded = expandedExtraction[report._id];

        return (
            <div className="extracted-data-preview">
                <button
                    className="extraction-toggle-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleExtraction(report._id);
                    }}
                >
                    <Zap size={14} />
                    <span>Extracted Data ({report.extractedData.results.length} parameters)</span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {isExpanded && (
                    <div className="extraction-inline-data">
                        <div className="extraction-patient-inline">
                            <span><strong>Patient:</strong> {report.extractedData.patientInfo?.name || '—'}</span>
                            <span><strong>Age:</strong> {report.extractedData.patientInfo?.age || '—'}</span>
                            <span><strong>Gender:</strong> {report.extractedData.patientInfo?.gender || '—'}</span>
                        </div>
                        <div className="extraction-results-mini">
                            {report.extractedData.results.slice(0, 5).map((r, i) => (
                                <div key={i} className="extraction-result-row-mini">
                                    <span className="param-name">{r.parameter}</span>
                                    <span className="param-value">{r.value} {r.unit}</span>
                                </div>
                            ))}
                            {report.extractedData.results.length > 5 && (
                                <div className="more-params">+{report.extractedData.results.length - 5} more parameters</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
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

                                {/* Show saved extracted data inline */}
                                {renderSavedExtraction(report)}

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
                                    {/* Extract Data button for image reports */}
                                    {!readOnly && report.type === 'image' && (
                                        <button
                                            className={`action-btn extract ${extractingId === report._id ? 'extracting' : ''}`}
                                            onClick={() => handleExtractData(report._id)}
                                            disabled={extractingId === report._id}
                                        >
                                            {extractingId === report._id ? (
                                                <>
                                                    <Loader size={16} className="spin" />
                                                    Extracting...
                                                </>
                                            ) : (
                                                <>
                                                    <Zap size={16} />
                                                    {report.extractedData?.results?.length ? 'Re-Extract' : 'Extract Data'}
                                                </>
                                            )}
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

                            {/* Saved Extracted Data (read-only table in modal) */}
                            {viewingReport.extractedData?.results?.length > 0 && (
                                <div className="content-section extraction-section-modal">
                                    <h4><span>🔬</span> Extracted Report Data</h4>
                                    <div className="extracted-patient-card">
                                        <div className="epc-item">
                                            <span className="epc-label">Name</span>
                                            <span className="epc-value">{viewingReport.extractedData.patientInfo?.name || '—'}</span>
                                        </div>
                                        <div className="epc-item">
                                            <span className="epc-label">Age</span>
                                            <span className="epc-value">{viewingReport.extractedData.patientInfo?.age || '—'}</span>
                                        </div>
                                        <div className="epc-item">
                                            <span className="epc-label">Gender</span>
                                            <span className="epc-value">{viewingReport.extractedData.patientInfo?.gender || '—'}</span>
                                        </div>
                                        <div className="epc-item">
                                            <span className="epc-label">Date</span>
                                            <span className="epc-value">{viewingReport.extractedData.patientInfo?.date || '—'}</span>
                                        </div>
                                    </div>
                                    <div className="extracted-results-table-wrapper">
                                        <table className="extracted-results-table">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Parameter</th>
                                                    <th>Value</th>
                                                    <th>Unit</th>
                                                    <th>Reference Range</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {viewingReport.extractedData.results.map((r, i) => (
                                                    <tr key={i}>
                                                        <td>{i + 1}</td>
                                                        <td>{r.parameter}</td>
                                                        <td className="value-cell">{r.value}</td>
                                                        <td>{r.unit}</td>
                                                        <td>{r.referenceRange}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {viewingReport.extractedData.confirmedAt && (
                                        <div className="extraction-confirmed-badge">
                                            <Check size={14} />
                                            Confirmed on {new Date(viewingReport.extractedData.confirmedAt).toLocaleDateString('en-US', {
                                                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
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

            {/* Extraction Review Modal */}
            {showExtractionModal && extractedData && (
                <div className="modal-overlay" onClick={() => {
                    setShowExtractionModal(false);
                    setExtractedData(null);
                }}>
                    <div className="extraction-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="extraction-modal-header">
                            <div className="extraction-modal-title">
                                <Zap size={22} />
                                <h3>Review Extracted Data</h3>
                            </div>
                            <p className="extraction-modal-subtitle">
                                AI has extracted the following data from the report image. Please review and edit if needed, then confirm to save.
                            </p>
                            <button className="close-btn-pro" onClick={() => {
                                setShowExtractionModal(false);
                                setExtractedData(null);
                            }}>&times;</button>
                        </div>

                        <div className="extraction-modal-body">
                            {/* Patient Info Section */}
                            <div className="extraction-form-section">
                                <h4>
                                    <span className="section-icon">👤</span>
                                    Patient Information
                                </h4>
                                <div className="extraction-patient-grid">
                                    <div className="extraction-field">
                                        <label>Name</label>
                                        <input
                                            type="text"
                                            value={extractedData.patient_info.Name || ''}
                                            onChange={(e) => handlePatientInfoChange('Name', e.target.value)}
                                        />
                                    </div>
                                    <div className="extraction-field">
                                        <label>Age</label>
                                        <input
                                            type="text"
                                            value={extractedData.patient_info.Age || ''}
                                            onChange={(e) => handlePatientInfoChange('Age', e.target.value)}
                                        />
                                    </div>
                                    <div className="extraction-field">
                                        <label>Gender</label>
                                        <input
                                            type="text"
                                            value={extractedData.patient_info.Gender || ''}
                                            onChange={(e) => handlePatientInfoChange('Gender', e.target.value)}
                                        />
                                    </div>
                                    <div className="extraction-field">
                                        <label>Date</label>
                                        <input
                                            type="text"
                                            value={extractedData.patient_info.Date || ''}
                                            onChange={(e) => handlePatientInfoChange('Date', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Test Results Section */}
                            <div className="extraction-form-section">
                                <div className="extraction-results-header">
                                    <h4>
                                        <span className="section-icon">🧪</span>
                                        Test Results ({extractedData.results.length} parameters)
                                    </h4>
                                    <button className="btn-add-row" onClick={handleAddRow}>
                                        <Plus size={16} /> Add Row
                                    </button>
                                </div>

                                <div className="extraction-table-wrapper">
                                    <table className="extraction-edit-table">
                                        <thead>
                                            <tr>
                                                <th className="th-num">#</th>
                                                <th className="th-param">Parameter</th>
                                                <th className="th-value">Value</th>
                                                <th className="th-unit">Unit</th>
                                                <th className="th-ref">Reference Range</th>
                                                <th className="th-action"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {extractedData.results.map((result, index) => (
                                                <tr key={index}>
                                                    <td className="td-num">{index + 1}</td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            value={result.Parameter || ''}
                                                            onChange={(e) => handleResultChange(index, 'Parameter', e.target.value)}
                                                            placeholder="Parameter name"
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            value={result.Value || ''}
                                                            onChange={(e) => handleResultChange(index, 'Value', e.target.value)}
                                                            placeholder="Value"
                                                            className="value-input"
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            value={result.Unit || ''}
                                                            onChange={(e) => handleResultChange(index, 'Unit', e.target.value)}
                                                            placeholder="Unit"
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            value={result['Reference Range'] || ''}
                                                            onChange={(e) => handleResultChange(index, 'Reference Range', e.target.value)}
                                                            placeholder="e.g. 4.0-11.0"
                                                        />
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn-remove-row"
                                                            onClick={() => handleRemoveRow(index)}
                                                            title="Remove row"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="extraction-modal-footer">
                            <button
                                className="btn-secondary"
                                onClick={() => {
                                    setShowExtractionModal(false);
                                    setExtractedData(null);
                                }}
                            >
                                <X size={16} /> Discard
                            </button>
                            <button
                                className="btn-confirm-extraction"
                                onClick={handleConfirmExtraction}
                                disabled={savingExtraction}
                            >
                                {savingExtraction ? (
                                    <>
                                        <Loader size={16} className="spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Check size={16} />
                                        Confirm & Save
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportsSection;
