import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain, Maximize2, Minimize2 } from 'lucide-react';
import AIAssistant from '../components/AIAssistant';
import { useTheme } from '../context/ThemeContext';
import { useCriticalIndex } from '../context/CriticalIndexContext';
import './AIDemo.css';

const AIDemo = () => {
    const navigate = useNavigate();
    const { isDarkMode, toggleTheme } = useTheme();
    const { updateCriticalIndex } = useCriticalIndex();
    const [viewMode, setViewMode] = useState('full');

    // Mock patient data for demo - using a valid ObjectId format
    const mockPatient = {
        _id: '507f1f77bcf86cd799439011', // Valid ObjectId format for demo
        id: '507f1f77bcf86cd799439011',
        name: 'John Doe',
        patientId: 'P001',
        age: 45,
        gender: 'Male',
        status: 'admitted',
        roomNumber: '302',
        bedNumber: 'A',
        assignedDoctor: 'Dr. Smith',
        admissionDate: new Date().toISOString()
    };

    return (
        <div className="ai-demo-page fade-in">
            <div className="demo-header">
                <button className="back-btn" onClick={() => navigate('/dashboard')}>
                    <ArrowLeft size={20} />
                    Back to Dashboard
                </button>

                <div className="demo-title">
                    <Brain size={32} className="brain-icon" />
                    <div>
                        <h1>AI Assistant Demo</h1>
                        <p className="text-muted">Experience the merged AI components with enhanced light/dark mode support</p>
                    </div>
                </div>

                <div className="demo-controls">
                    <button
                        className={`mode-btn ${viewMode === 'full' ? 'active' : ''}`}
                        onClick={() => setViewMode('full')}
                    >
                        <Maximize2 size={16} />
                        Full View
                    </button>
                    <button
                        className={`mode-btn ${viewMode === 'sidebar' ? 'active' : ''}`}
                        onClick={() => setViewMode('sidebar')}
                    >
                        <Minimize2 size={16} />
                        Sidebar View
                    </button>
                    <button
                        className="theme-toggle"
                        onClick={toggleTheme}
                        title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
                    >
                        {isDarkMode ? '☀️' : '🌙'}
                        {isDarkMode ? 'Light' : 'Dark'} Mode
                    </button>
                </div>
            </div>

            <div className="demo-content">
                {viewMode === 'full' ? (
                    <AIAssistant
                        patientId={mockPatient._id}
                        patient={mockPatient}
                        onCriticalIndexChange={(indexData) => updateCriticalIndex(mockPatient._id, indexData)}
                        mode="full"
                        demoMode={true}
                    />
                ) : (
                    <div className="sidebar-demo-container">
                        <div className="demo-main-content">
                            <div className="demo-card">
                                <h3>Main Content Area</h3>
                                <p>This demonstrates how the AI Assistant works as a sidebar alongside your main content.</p>
                                
                                <div className="demo-notice">
                                    <div className="demo-badge">
                                        <span className="demo-icon">🎭</span>
                                        <span className="demo-text">Demo Mode Active</span>
                                    </div>
                                    <p>This demo uses simulated AI responses and mock patient data. The AI assistant will work without requiring a backend connection.</p>
                                </div>

                                <div className="feature-list">
                                    <h4>✨ New Features:</h4>
                                    <ul>
                                        <li>🔄 <strong>Merged Components:</strong> Combined AIInsights and AISidebar into one unified component</li>
                                        <li>🎨 <strong>Enhanced Theming:</strong> Optimized for both light and dark modes with smooth transitions</li>
                                        <li>📱 <strong>Responsive Design:</strong> Works perfectly on all screen sizes</li>
                                        <li>🔧 <strong>Flexible Modes:</strong> Switch between sidebar and full-page views</li>
                                        <li>💬 <strong>Improved Chat:</strong> Better chat interface with typing indicators</li>
                                        <li>📊 <strong>Smart Cards:</strong> Insights displayed as interactive cards with severity levels</li>
                                        <li>🚨 <strong>Critical Index:</strong> Visual risk assessment with dashboard alerts</li>
                                        <li>⚡ <strong>Performance:</strong> Optimized rendering and state management</li>
                                    </ul>
                                </div>

                                <div className="theme-showcase">
                                    <h4>🎨 Theme Showcase:</h4>
                                    <p>Toggle between light and dark modes to see the enhanced theming in action!</p>
                                    <div className="theme-samples">
                                        <div className="sample-card">
                                            <div className="sample-header">Sample Card</div>
                                            <div className="sample-content">
                                                This card demonstrates the theme-aware styling with proper contrast and readability.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <AIAssistant
                            patientId={mockPatient._id}
                            patient={mockPatient}
                            onCriticalIndexChange={(indexData) => updateCriticalIndex(mockPatient._id, indexData)}
                            mode="sidebar"
                            demoMode={true}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIDemo;