import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Activity, Calendar, Bed, Stethoscope, AlertCircle, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCriticalIndex } from '../context/CriticalIndexContext';
import './PatientCard.css';

const PatientCard = ({ patient, onDelete }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { getPatientRiskLevel, getCriticalIndex } = useCriticalIndex();

    const handleCardClick = (e) => {
        // Prevent navigation if clicking delete
        if (e.target.closest('.delete-btn')) return;
        navigate(`/patient/${patient._id}`);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete patient ${patient.name}? This cannot be undone.`)) {
            if (onDelete) onDelete(patient._id);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusBadge = () => {
        if (patient.status === 'admitted') {
            return <span className="badge badge-success">Admitted</span>;
        }
        return <span className="badge badge-info">Discharged</span>;
    };

    // Get critical index data safely
    let riskLevel = 'unknown';
    let criticalData = null;

    try {
        riskLevel = getPatientRiskLevel(patient._id);
        criticalData = getCriticalIndex(patient._id);
    } catch (error) {
        // Silently handle errors
    }

    const getCardClassName = () => {
        let className = "patient-card";
        if (riskLevel === 'critical') {
            className += " critical-risk";
        } else if (riskLevel === 'warning') {
            className += " warning-risk";
        }
        return className;
    };

    const getCriticalIndicator = () => {
        if (!criticalData) return null;

        const getIndicatorConfig = () => {
            switch (riskLevel) {
                case 'critical':
                    return { icon: '🚨', text: `CI: ${criticalData.score}`, className: 'critical' };
                case 'warning':
                    return { icon: '⚠️', text: `CI: ${criticalData.score}`, className: 'warning' };
                case 'moderate':
                    return { icon: '⚡', text: `CI: ${criticalData.score}`, className: 'moderate' };
                default:
                    return { icon: '✅', text: `CI: ${criticalData.score}`, className: 'stable' };
            }
        };

        const config = getIndicatorConfig();
        return (
            <div className={`critical-indicator ${config.className}`}>
                <span className="indicator-icon">{config.icon}</span>
                <span className="indicator-text">{config.text}</span>
            </div>
        );
    };

    if (!patient) {
        return <div className="patient-card error">Invalid patient data</div>;
    }

    return (
        <div className={getCardClassName()} onClick={handleCardClick}>
            <div className="patient-card-header">
                <div className="patient-info">
                    <h3>{patient.name}</h3>
                    <span className="patient-id">{patient.patientId}</span>
                </div>

                <div className="header-badges">
                    {/* Admin Only Delete Button */}
                    {user?.role === 'admin' && (
                        <button
                            className="delete-btn"
                            onClick={handleDelete}
                            title="Delete Patient"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        {getCriticalIndicator()}
                        {getStatusBadge()}
                    </div>
                </div>
            </div>

            <div className="patient-details">
                <div className="detail-item">
                    <User size={16} />
                    <span>{patient.age} years • {patient.gender}</span>
                </div>

                <div className="detail-item">
                    <AlertCircle size={16} />
                    <span className="reason">{patient.reasonForAdmission}</span>
                </div>

                <div className="detail-item">
                    <Bed size={16} />
                    <span>Room {patient.roomNumber} • Bed {patient.bedNumber}</span>
                </div>

                <div className="detail-item">
                    <Stethoscope size={16} />
                    <span>{patient.assignedDoctor}</span>
                </div>

                <div className="detail-item">
                    <Calendar size={16} />
                    <span>Admitted: {formatDate(patient.admissionDate)}</span>
                </div>
            </div>

            <div className="patient-card-footer">
                <span className="view-details-text">
                    Click anywhere to view details →
                </span>
            </div>
        </div>
    );
};

export default PatientCard;
