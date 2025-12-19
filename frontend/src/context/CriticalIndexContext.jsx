import React, { createContext, useContext, useState, useEffect } from 'react';

const CriticalIndexContext = createContext();

export const useCriticalIndex = () => {
    const context = useContext(CriticalIndexContext);
    if (!context) {
        throw new Error('useCriticalIndex must be used within a CriticalIndexProvider');
    }
    return context;
};

export const CriticalIndexProvider = ({ children }) => {
    const [criticalIndexes, setCriticalIndexes] = useState(() => {
        // Load from localStorage on initialization
        try {
            const saved = localStorage.getItem('criticalIndexes');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('Error loading critical indexes from localStorage:', error);
            return {};
        }
    });

    // Save to localStorage whenever criticalIndexes change
    useEffect(() => {
        try {
            localStorage.setItem('criticalIndexes', JSON.stringify(criticalIndexes));
        } catch (error) {
            console.error('Error saving critical indexes to localStorage:', error);
        }
    }, [criticalIndexes]);

    const updateCriticalIndex = (patientId, indexData) => {
        setCriticalIndexes(prev => ({
            ...prev,
            [patientId]: {
                ...indexData,
                lastUpdated: new Date().toISOString()
            }
        }));
    };

    const getCriticalIndex = (patientId) => {
        return criticalIndexes[patientId] || null;
    };

    const removeCriticalIndex = (patientId) => {
        setCriticalIndexes(prev => {
            const newIndexes = { ...prev };
            delete newIndexes[patientId];
            return newIndexes;
        });
    };

    const getAllCriticalPatients = () => {
        return Object.entries(criticalIndexes)
            .filter(([_, data]) => data.level === 'critical' || data.level === 'warning')
            .map(([patientId, data]) => ({ patientId, ...data }));
    };

    const getPatientRiskLevel = (patientId) => {
        const index = criticalIndexes[patientId];
        if (!index) return 'unknown';
        return index.level;
    };

    return (
        <CriticalIndexContext.Provider value={{
            criticalIndexes,
            updateCriticalIndex,
            getCriticalIndex,
            removeCriticalIndex,
            getAllCriticalPatients,
            getPatientRiskLevel
        }}>
            {children}
        </CriticalIndexContext.Provider>
    );
};