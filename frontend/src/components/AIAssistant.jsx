import React, { useState, useEffect, useRef } from 'react';
import { aiAPI } from '../utils/api';
import {
    Brain,
    RefreshCw,
    MessageCircle,
    Send,
    AlertTriangle,
    Activity,
    Loader,
    ChevronRight,
    ChevronLeft,
    Maximize2,
    Minimize2,
    Sun,
    Moon
} from 'lucide-react';
import './AIAssistant.css';

// Critical Index Component
const CriticalIndex = ({ cards, insights }) => {
    const calculateCriticalIndex = () => {
        if (!cards || cards.length === 0) return { score: 0, level: 'stable', color: 'var(--color-success)' };

        const criticalCount = cards.filter(card => card.severity === 'critical').length;
        const warningCount = cards.filter(card => card.severity === 'medium').length;
        const totalCards = cards.length;

        // Calculate score based on severity distribution
        const criticalWeight = 10;
        const warningWeight = 5;
        const infoWeight = 1;

        const score = Math.min(100, Math.round(
            ((criticalCount * criticalWeight) + (warningCount * warningWeight) + ((totalCards - criticalCount - warningCount) * infoWeight)) / totalCards * 10
        ));

        let level, color, bgColor, textColor;
        if (score >= 80) {
            level = 'critical';
            color = 'var(--color-danger)';
            bgColor = 'var(--danger-bg)';
            textColor = 'var(--danger-text)';
        } else if (score >= 50) {
            level = 'warning';
            color = 'var(--color-warning)';
            bgColor = 'var(--warning-bg)';
            textColor = 'var(--warning-text)';
        } else if (score >= 25) {
            level = 'moderate';
            color = 'var(--color-primary)';
            bgColor = 'var(--info-bg)';
            textColor = 'var(--info-text)';
        } else {
            level = 'stable';
            color = 'var(--color-success)';
            bgColor = 'var(--color-secondary-light)';
            textColor = 'var(--color-secondary-dark)';
        }

        return { score, level, color, bgColor, textColor, criticalCount, warningCount };
    };

    const indexData = calculateCriticalIndex();

    const getLevelIcon = () => {
        switch (indexData.level) {
            case 'critical': return <AlertTriangle size={24} />;
            case 'warning': return <AlertTriangle size={24} />;
            case 'moderate': return <Activity size={24} />;
            default: return <Activity size={24} />;
        }
    };

    const getLevelText = () => {
        switch (indexData.level) {
            case 'critical': return 'Critical Attention Required';
            case 'warning': return 'Elevated Monitoring Needed';
            case 'moderate': return 'Moderate Concern Level';
            default: return 'Patient Condition Stable';
        }
    };

    return (
        <div className="critical-index-container">
            <div
                className="critical-index-card"
                style={{
                    borderColor: indexData.color,
                    backgroundColor: indexData.bgColor
                }}
            >
                <div className="critical-index-header">
                    <div className="critical-index-icon" style={{ color: indexData.color }}>
                        {getLevelIcon()}
                    </div>
                    <div className="critical-index-info">
                        <h3 className="critical-index-title">Critical Index</h3>
                        <p className="critical-index-subtitle" style={{ color: indexData.textColor }}>
                            {getLevelText()}
                        </p>
                    </div>
                    <div className="critical-index-score">
                        <div
                            className="score-circle"
                            style={{
                                borderColor: indexData.color,
                                color: indexData.color
                            }}
                        >
                            <span className="score-number">{indexData.score}</span>
                            <span className="score-label">CI</span>
                        </div>
                    </div>
                </div>

                {cards && cards.length > 0 && (
                    <div className="critical-index-breakdown">
                        <div className="breakdown-item">
                            <AlertTriangle size={16} className="breakdown-icon" />
                            <span className="breakdown-text">Critical: {indexData.criticalCount}</span>
                        </div>
                        <div className="breakdown-item">
                            <AlertTriangle size={16} className="breakdown-icon" />
                            <span className="breakdown-text">Warning: {indexData.warningCount}</span>
                        </div>
                        <div className="breakdown-item">
                            <Activity size={16} className="breakdown-icon" />
                            <span className="breakdown-text">Info: {cards.length - indexData.criticalCount - indexData.warningCount}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// InsightCard Component with enhanced light/dark mode support
const InsightCard = ({ severity, message, timestamp }) => {
    const getSeverityConfig = () => {
        switch (severity) {
            case 'critical':
                return {
                    color: 'var(--color-danger)',
                    bgColor: 'var(--danger-bg)',
                    textColor: 'var(--danger-text)',
                    label: 'Critical',
                    icon: <AlertTriangle size={20} />
                };
            case 'medium':
                return {
                    color: 'var(--color-warning)',
                    bgColor: 'var(--warning-bg)',
                    textColor: 'var(--warning-text)',
                    label: 'Warning',
                    icon: <Activity size={20} />
                };
            default:
                return {
                    color: 'var(--color-primary)',
                    bgColor: 'var(--info-bg)',
                    textColor: 'var(--info-text)',
                    label: 'Info',
                    icon: <Activity size={20} />
                };
        }
    };

    const config = getSeverityConfig();

    return (
        <div className="insight-card" style={{ borderLeftColor: config.color }}>
            <div className="insight-card-header">
                <div className="insight-badge-group">
                    <span className="insight-icon">{config.icon}</span>
                    <span
                        className="insight-badge"
                        style={{
                            backgroundColor: config.color,
                            color: 'white'
                        }}
                    >
                        {config.label}
                    </span>
                </div>
                <span className="insight-timestamp">{timestamp}</span>
            </div>
            <div className="insight-card-content">
                {message}
            </div>
        </div>
    );
};

const AIAssistant = ({ patientId, patient, onStateChange, onCriticalIndexChange, mode = 'sidebar', demoMode = false }) => {
    // State management
    const [isMinimized, setIsMinimized] = useState(false);
    const [isExpanded, setIsExpanded] = useState(mode === 'full');
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [activeView, setActiveView] = useState('insights');
    // const [criticalIndexData, setCriticalIndexData] = useState(null); // Removed to prevent infinite loop
    const messagesEndRef = useRef(null);

    // Auto-generate insights on mount and every 5 minutes
    useEffect(() => {
        if (!isMinimized) {
            generateInsights();
        }

        if (autoRefresh && !isMinimized) {
            const interval = setInterval(() => {
                generateInsights(true); // Silent refresh
            }, 5 * 60 * 1000); // 5 minutes

            return () => clearInterval(interval);
        }
    }, [patientId, autoRefresh, isMinimized]);

    // Notify parent about state changes
    useEffect(() => {
        if (onStateChange) {
            onStateChange(!isMinimized);
        }
    }, [isMinimized, onStateChange]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const generateInsights = async (silent = false) => {
        if (!silent) setLoading(true);
        setError(null);

        try {
            if (demoMode) {
                // Provide mock insights for demo mode
                const mockInsights = {
                    insights: `
**Patient Assessment**

### Immediate Concerns:
- **Critical:** Elevated heart rate detected at 125 bpm with irregular rhythm patterns
- **Warning:** Blood pressure reading 145/95 mmHg exceeds normal range for patient age
- **Critical:** Oxygen saturation dropped to 88%, supplemental oxygen initiated
- **Info:** Patient medication adherence at 95% for the past week

### Recommendations:
- **Critical:** Immediate cardiology consultation required for ECG abnormalities
- **Warning:** Consider medication adjustment for hypertension management
- **Info:** Continue current monitoring protocol every 2 hours
- **Warning:** Monitor temperature closely - slight elevation noted
- **Info:** Patient vitals stable for the past 4 hours overall

### Action Items:
- Schedule immediate cardiology consult
- Adjust medication dosage as per protocol
- Continue oxygen therapy monitoring
- Review diet and exercise plan with patient
                    `,
                    generatedAt: new Date().toISOString()
                };

                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 1500));
                setInsights(mockInsights);
            } else {
                const response = await aiAPI.generateInsights(patientId);
                setInsights(response.data.data);
            }
        } catch (err) {
            console.error('AI Insights Error:', err);
            if (demoMode) {
                setError('Demo mode: AI service simulation failed. This is expected in demo mode.');
            } else {
                setError(err.response?.data?.message || 'AI service unavailable. Check if AI service is running and API key is configured.');
            }
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const sendChatMessage = async () => {
        if (!chatInput.trim()) return;

        const userMessage = { role: 'user', content: chatInput };
        setChatMessages(prev => [...prev, userMessage]);
        setChatInput('');
        setChatLoading(true);

        try {
            if (demoMode) {
                // Provide mock chat responses for demo mode
                const mockResponses = [
                    `Based on ${patient?.name || 'the patient'}'s current condition, I can see several areas of concern. The elevated heart rate and blood pressure readings suggest we need to monitor cardiovascular status closely.`,
                    `The patient's vital signs show some irregularities. I recommend immediate cardiology consultation and continued monitoring of oxygen levels.`,
                    `Looking at the current data, the patient appears to be responding well to treatment overall, but we should watch for any changes in the cardiac rhythm patterns.`,
                    `The medication adherence is good at 95%, which is positive. However, the recent vital sign changes warrant closer observation and possible medication adjustments.`,
                    `I'd recommend continuing the current monitoring protocol while we wait for the cardiology consultation. The oxygen therapy seems to be helping stabilize the patient.`
                ];

                // Simulate AI thinking time
                await new Promise(resolve => setTimeout(resolve, 2000));

                const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
                const aiMessage = {
                    role: 'assistant',
                    content: randomResponse
                };

                setChatMessages(prev => [...prev, aiMessage]);
            } else {
                const conversationHistory = chatMessages.map(msg => ({
                    role: msg.role,
                    content: msg.content
                }));

                const response = await aiAPI.chat(patientId, {
                    message: chatInput,
                    conversationHistory
                });

                const aiMessage = {
                    role: 'assistant',
                    content: response.data.data.response
                };

                setChatMessages(prev => [...prev, aiMessage]);
            }
        } catch (err) {
            console.error('Chat Error:', err);
            const errorMessage = {
                role: 'assistant',
                content: demoMode
                    ? 'Demo mode: Chat simulation failed. This is expected in demo mode without AI service.'
                    : 'AI service error. Please ensure the AI service is running with a valid Gemini API key.'
            };
            setChatMessages(prev => [...prev, errorMessage]);
        } finally {
            setChatLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
        }
    };

    // Parse insights into individual cards
    const parseInsightsToCards = (text) => {
        if (!text) return [];

        const cards = [];
        const lines = text.split('\n');
        let currentCard = null;

        lines.forEach((line) => {
            const trimmed = line.trim();
            if (!trimmed) return;

            // Detect severity keywords to create new cards
            const severityMatch = trimmed.match(/^[-•*]\s*\*\*(Critical|Warning|Info|Alert|Urgent|High Priority|Medium Priority|Low Priority)[\*:]*/i);

            if (severityMatch) {
                // Save previous card if exists
                if (currentCard && currentCard.message) {
                    cards.push(currentCard);
                }

                // Determine severity level
                const keyword = severityMatch[1].toLowerCase();
                let severity = 'low';
                if (keyword.includes('critical') || keyword.includes('urgent') || keyword === 'alert') {
                    severity = 'critical';
                } else if (keyword.includes('warning') || keyword.includes('high')) {
                    severity = 'medium';
                }

                // Extract message after severity marker
                const message = trimmed.replace(/^[-•*]\s*\*\*[^*]+\*\*:?\s*/i, '');

                currentCard = {
                    severity,
                    message,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
            } else if (currentCard) {
                // Append to current card's message
                const cleanLine = trimmed.replace(/^[-•*]\s+/, '');
                if (cleanLine) {
                    currentCard.message += ' ' + cleanLine;
                }
            } else if (trimmed.match(/^[-•*]\s+/)) {
                // Generic bullet point becomes a low priority card
                const message = trimmed.replace(/^[-•*]\s+/, '').replace(/^\*\*/, '').replace(/\*\*:?\s*/, '');
                if (message.length > 10) {
                    cards.push({
                        severity: 'low',
                        message,
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    });
                }
            }
        });

        // Push last card
        if (currentCard && currentCard.message) {
            cards.push(currentCard);
        }

        // If no cards were detected, create generic cards from major lines
        if (cards.length === 0) {
            lines.forEach((line) => {
                const trimmed = line.trim();
                if (trimmed && trimmed.length > 20 && !trimmed.match(/^###|^\*\*[A-Za-z\s]+:\*\*|^---/)) {
                    cards.push({
                        severity: 'low',
                        message: trimmed.replace(/^[-•*]\s+/, ''),
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    });
                }
            });
        }

        return cards;
    };

    // Calculate and update critical index when insights change
    // Critical Index calculation moved to CriticalIndex component to prevent useEffect loop


    // Format insights for full view
    const formatInsights = (text) => {
        if (!text) return null;

        const sections = text.split('\n\n');

        return sections.map((section, idx) => {
            if (section.startsWith('**') || section.startsWith('#')) {
                const title = section.replace(/\*\*/g, '').replace(/#/g, '').trim();
                return (
                    <div key={idx} className="insight-section">
                        <h4>{title}</h4>
                    </div>
                );
            }

            if (section.includes('- ') || section.includes('• ')) {
                const items = section.split('\n').filter(line => line.trim());
                return (
                    <ul key={idx} className="insight-list">
                        {items.map((item, i) => (
                            <li key={i}>{item.replace(/^[-•]\s*/, '')}</li>
                        ))}
                    </ul>
                );
            }

            return <p key={idx} className="insight-text">{section}</p>;
        });
    };

    // Render floating button when minimized
    if (isMinimized && mode === 'sidebar') {
        return (
            <button
                className="ai-floating-button"
                onClick={() => setIsMinimized(false)}
                aria-label="Open AI Assistant"
            >
                <Brain size={24} />
                <span className="floating-badge">AI</span>
            </button>
        );
    }

    // Render full page mode
    if (mode === 'full' || isExpanded) {
        return (
            <div className="ai-assistant-full fade-in">
                <div className="ai-full-header">
                    <div className="header-left">
                        <Brain size={28} className="brain-icon" />
                        <div>
                            <h2>AI Command Center</h2>
                            <p className="text-muted">Real-time intelligent recommendations powered by Google Gemini</p>
                        </div>
                    </div>

                    <div className="header-actions">
                        <label className="auto-refresh-toggle">
                            <input
                                type="checkbox"
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                            />
                            <span>Auto-refresh (5 min)</span>
                        </label>

                        <button
                            className="btn-primary"
                            onClick={() => generateInsights()}
                            disabled={loading}
                        >
                            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
                            {loading ? 'Analyzing...' : 'Refresh Insights'}
                        </button>

                        {mode === 'sidebar' && (
                            <button
                                className="btn-secondary"
                                onClick={() => setIsExpanded(false)}
                            >
                                <Minimize2 size={18} />
                                Minimize
                            </button>
                        )}
                    </div>
                </div>

                <div className="ai-full-content">
                    {/* Main Insights Panel */}
                    <div className="insights-panel">
                        <div className="panel-header">
                            <Activity size={20} />
                            <h3>Clinical Analysis & Recommendations</h3>
                            {insights && (
                                <span className="last-updated">
                                    Updated: {new Date(insights.generatedAt).toLocaleTimeString()}
                                </span>
                            )}
                        </div>

                        <div className="panel-body">
                            {loading && !insights ? (
                                <div className="loading-state">
                                    <Loader size={48} className="spinning" />
                                    <p>AI is analyzing patient data...</p>
                                    <small className="text-muted">This may take a few seconds</small>
                                </div>
                            ) : error ? (
                                <div className="error-state">
                                    <AlertTriangle size={48} />
                                    <h4>AI Service Unavailable</h4>
                                    <p>{error}</p>
                                    <button className="btn-secondary" onClick={() => generateInsights()}>
                                        Try Again
                                    </button>
                                </div>
                            ) : insights ? (
                                <div className="insights-display">
                                    <CriticalIndex
                                        cards={parseInsightsToCards(insights.insights)}
                                        insights={insights}
                                    />
                                    {formatInsights(insights.insights)}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <Brain size={48} />
                                    <p>Click "Refresh Insights" to generate AI analysis</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* AI Chatbot Panel */}
                    <div className="chat-panel">
                        <div className="panel-header">
                            <MessageCircle size={20} />
                            <h3>Ask AI Assistant</h3>
                        </div>

                        <div className="chat-messages">
                            {chatMessages.length === 0 ? (
                                <div className="chat-empty">
                                    <MessageCircle size={40} />
                                    <p>Ask me anything about patient's condition</p>
                                    <div className="suggested-questions">
                                        <button
                                            className="suggestion-btn"
                                            onClick={() => setChatInput('What are the main concerns for this patient?')}
                                        >
                                            Main concerns?
                                        </button>
                                        <button
                                            className="suggestion-btn"
                                            onClick={() => setChatInput('Summarize the vital signs trends')}
                                        >
                                            Vital trends?
                                        </button>
                                        <button
                                            className="suggestion-btn"
                                            onClick={() => setChatInput('What should we monitor closely?')}
                                        >
                                            What to monitor?
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {chatMessages.map((msg, idx) => (
                                        <div key={idx} className={`chat-message ${msg.role}`}>
                                            <div className="message-avatar">
                                                {msg.role === 'user' ? '👤' : '🤖'}
                                            </div>
                                            <div className="message-content">
                                                <div className="message-text">{msg.content}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {chatLoading && (
                                        <div className="chat-message assistant">
                                            <div className="message-avatar">🤖</div>
                                            <div className="message-content">
                                                <div className="typing-indicator">
                                                    <span></span><span></span><span></span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </>
                            )}
                        </div>

                        <div className="chat-input-container">
                            <input
                                type="text"
                                className="chat-input"
                                placeholder="Ask about patient condition, trends, recommendations..."
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                disabled={chatLoading}
                            />
                            <button
                                className="send-button"
                                onClick={sendChatMessage}
                                disabled={chatLoading || !chatInput.trim()}
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Render sidebar mode
    return (
        <div className="ai-assistant-sidebar">
            {/* Header */}
            <div className="ai-sidebar-header">
                <div className="header-title">
                    <Brain size={20} className="brain-icon-pulse" />
                    <h3>AI Assistant</h3>
                </div>
                <div className="header-actions">
                    <button
                        className="icon-btn"
                        onClick={() => setIsExpanded(true)}
                        aria-label="Expand to full view"
                        title="Expand to full view"
                    >
                        <Maximize2 size={16} />
                    </button>
                    <button
                        className="icon-btn"
                        onClick={() => setIsMinimized(true)}
                        aria-label="Minimize"
                        title="Minimize"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {/* View Tabs */}
            <div className="ai-tabs">
                <button
                    className={`ai-tab ${activeView === 'insights' ? 'active' : ''}`}
                    onClick={() => setActiveView('insights')}
                >
                    <Brain size={16} />
                    Insights
                </button>
                <button
                    className={`ai-tab ${activeView === 'chat' ? 'active' : ''}`}
                    onClick={() => setActiveView('chat')}
                >
                    <MessageCircle size={16} />
                    Chat
                </button>
            </div>

            {/* Content Area */}
            <div className="ai-sidebar-content">
                {activeView === 'insights' ? (
                    <div className="insights-view">
                        <div className="insights-header-actions">
                            <button
                                className="refresh-btn"
                                onClick={generateInsights}
                                disabled={loading}
                            >
                                <RefreshCw size={16} className={loading ? 'spinning' : ''} />
                                {loading ? 'Analyzing...' : 'Refresh'}
                            </button>
                        </div>

                        <div className="insights-body">
                            {loading ? (
                                <div className="loading-state">
                                    <Loader size={40} className="spinning" />
                                    <p>AI is analyzing...</p>
                                </div>
                            ) : error ? (
                                <div className="error-state">
                                    <AlertTriangle size={40} />
                                    <h4>Service Unavailable</h4>
                                    <p>{error}</p>
                                    <button className="retry-btn" onClick={generateInsights}>
                                        Try Again
                                    </button>
                                </div>
                            ) : insights ? (
                                <div className="insights-display">
                                    <CriticalIndex
                                        cards={parseInsightsToCards(insights.insights)}
                                        insights={insights}
                                    />
                                    {parseInsightsToCards(insights.insights).map((card, index) => (
                                        <InsightCard
                                            key={index}
                                            severity={card.severity}
                                            message={card.message}
                                            timestamp={card.timestamp}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <Brain size={40} />
                                    <p>Click Refresh to generate AI insights</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="chat-view">
                        <div className="chat-messages">
                            {chatMessages.length === 0 ? (
                                <div className="chat-empty">
                                    <MessageCircle size={36} />
                                    <p>Ask about {patient?.name}</p>
                                    <div className="quick-questions">
                                        <p className="quick-questions-label">QUICK QUESTIONS:</p>
                                        <button onClick={() => setChatInput('What are the main concerns?')}>
                                            Main concerns?
                                        </button>
                                        <button onClick={() => setChatInput('Summarize vital trends')}>
                                            Vital trends?
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {chatMessages.map((msg, idx) => (
                                        <div key={idx} className={`chat-msg ${msg.role}`}>
                                            <div className="msg-avatar">
                                                {msg.role === 'user' ? '👤' : '🤖'}
                                            </div>
                                            <div className="msg-content">{msg.content}</div>
                                        </div>
                                    ))}
                                    {chatLoading && (
                                        <div className="chat-msg assistant">
                                            <div className="msg-avatar">🤖</div>
                                            <div className="typing-dots">
                                                <span></span><span></span><span></span>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </>
                            )}
                        </div>

                        <div className="chat-input-area">
                            <input
                                type="text"
                                placeholder="Ask AI..."
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                disabled={chatLoading}
                            />
                            <button
                                onClick={sendChatMessage}
                                disabled={chatLoading || !chatInput.trim()}
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIAssistant;