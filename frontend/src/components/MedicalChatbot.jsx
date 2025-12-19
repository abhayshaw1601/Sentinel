
import React, { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../utils/api';
import {
    MessageCircle,
    X,
    Send,
    Paperclip,
    Trash2,
    Minimize2,
    Bot,
    User,
    Loader
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import './MedicalChatbot.css';

const MedicalChatbot = ({ patientId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const predefinedPrompts = [
        "What is this disease and whom should I consult?",
        "Explain my medical report",
        "What do these symptoms indicate?",
        "Review my test results"
    ];

    // Initial greeting
    useEffect(() => {
        const loadInitialMessage = async () => {
            if (messages.length === 0) {
                try {
                    const response = await chatAPI.getHistory(patientId);
                    if (response.data.data.messages && response.data.data.messages.length > 0) {
                        setMessages(response.data.data.messages);
                    } else {
                        setMessages([
                            {
                                role: 'bot',
                                content: "Hello! I'm your AI Medical Assistant. I can help analyze your medical reports, answer health questions, or review images of symptoms. How can I help you today?",
                                timestamp: new Date().toISOString()
                            }
                        ]);
                    }
                } catch (error) {
                    console.error("Failed to load history:", error);
                    setMessages([
                        {
                            role: 'bot',
                            content: "Hello! I'm your AI Medical Assistant. I can help analyze your medical reports, answer health questions, or review images of symptoms. How can I help you today?",
                            timestamp: new Date().toISOString()
                        }
                    ]);
                }
            }
        };

        if (isOpen) {
            loadInitialMessage();
        }
    }, [isOpen, patientId, messages.length]);

    // Scroll to bottom on new message
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            setUnreadCount(0);
        }
    }, [messages, isOpen]);

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('File size too large. Please upload an image smaller than 5MB.');
                return;
            }
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const clearImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!inputMessage.trim() && !selectedImage) || isLoading) return;

        const newUserMessage = {
            role: 'user',
            content: inputMessage,
            image: imagePreview,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, newUserMessage]);
        setInputMessage('');
        setIsLoading(true);

        // Clear image state but keep preview in message
        const imageToSend = selectedImage;
        clearImage();

        try {
            let response;
            if (imageToSend) {
                response = await chatAPI.analyzeImage(patientId, imageToSend, inputMessage);
            } else {
                response = await chatAPI.sendMessage(patientId, inputMessage);
            }

            const rawContent = response.data.data.response || response.data.data.analysis || response.data.data.aiResponse;

            // Format object content to string if necessary
            let formattedContent = rawContent;
            if (typeof rawContent === 'object' && rawContent !== null) {
                // If it's the structured analysis object (diagnosis, suggestions, etc.)
                let parts = [];
                if (rawContent.diagnosis) parts.push(`### Diagnosis\n${rawContent.diagnosis}`);
                if (rawContent.severity) parts.push(`**Severity:** ${rawContent.severity}`);
                if (rawContent.suggestions && Array.isArray(rawContent.suggestions)) {
                    parts.push(`### Recommended Actions\n${rawContent.suggestions.map(s => `- ${s}`).join('\n')}`);
                }
                if (rawContent.precautions && Array.isArray(rawContent.precautions)) {
                    parts.push(`### Precautions\n${rawContent.precautions.map(p => `- ${p}`).join('\n')}`);
                }
                if (rawContent.medications && Array.isArray(rawContent.medications)) {
                    parts.push(`### 💊 Possible Medications\n${rawContent.medications.map(m => `- ${m}`).join('\n')}`);
                }

                // Fallback for generic objects
                if (parts.length === 0) {
                    formattedContent = JSON.stringify(rawContent, null, 2);
                } else {
                    formattedContent = parts.join('\n\n');
                }
            }

            const botResponse = {
                role: 'bot',
                content: formattedContent,
                timestamp: new Date().toISOString()
            };

            setMessages(prev => [...prev, botResponse]);

            if (!isOpen) {
                setUnreadCount(prev => prev + 1);
            }

        } catch (error) {
            console.error('Chat Error:', error);
            const errorMessage = {
                role: 'bot',
                content: "I apologize, but I'm having trouble connecting to the service right now. Please try again in a moment.",
                isError: true,
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearChat = async () => {
        if (window.confirm('Are you sure you want to clear the chat history?')) {
            try {
                await chatAPI.clearHistory(patientId);
                setMessages([
                    {
                        role: 'bot',
                        content: "Chat history cleared. How can I help you today?",
                        timestamp: new Date().toISOString()
                    }
                ]);
            } catch (error) {
                console.error("Failed to clear history:", error);
            }
        }
    };

    return (
        <div className="medical-chatbot-container">
            {/* Chat Window */}
            {isOpen && (
                <div className="chatbot-window">
                    {/* Header */}
                    <div className="chatbot-header">
                        <div className="header-info">
                            <div className="bot-avatar-large">
                                <Bot size={24} />
                            </div>
                            <div className="header-text">
                                <h3>Medical Assistant</h3>
                                <div className="status-indicator">
                                    <span className="status-dot"></span>
                                    <span>Online</span>
                                </div>
                            </div>
                        </div>
                        <div className="header-actions">
                            <button className="action-btn" onClick={handleClearChat} title="Clear Chat">
                                <Trash2 size={18} />
                            </button>
                            <button className="action-btn" onClick={() => setIsOpen(false)}>
                                <Minimize2 size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Predefined Prompts */}
                    {messages.length <= 1 && (
                        <div className="predefined-prompts">
                            <div className="prompts-grid">
                                {predefinedPrompts.map((prompt, idx) => (
                                    <button
                                        key={idx}
                                        className="prompt-btn"
                                        onClick={async (e) => {
                                            e.preventDefault();
                                            setInputMessage(prompt);
                                            // Wait a moment for state to update
                                            await new Promise(resolve => setTimeout(resolve, 50));
                                            // Create a synthetic event
                                            const syntheticEvent = {
                                                preventDefault: () => { },
                                                target: { value: prompt }
                                            };
                                            handleSendMessage(syntheticEvent);
                                        }}
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Messages Area */}
                    <div className="chat-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`message ${msg.role} `}>
                                <div className="message-avatar">
                                    {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                                </div>
                                <div className="message-content">
                                    <div className="message-bubble">
                                        {msg.image && (
                                            <div className="message-image">
                                                <img src={msg.image} alt="User upload" />
                                            </div>
                                        )}
                                        {msg.role === 'bot' ? (
                                            <ReactMarkdown
                                                components={{
                                                    h3: ({ node, ...props }) => <h4 style={{ margin: '0.5rem 0', color: '#2563eb', fontSize: '1rem' }} {...props} />,
                                                    ul: ({ node, ...props }) => <ul style={{ paddingLeft: '1.2rem', margin: '0.5rem 0' }} {...props} />,
                                                    li: ({ node, ...props }) => <li style={{ marginBottom: '0.25rem' }} {...props} />
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        ) : (
                                            <div className="message-text">{msg.content}</div>
                                        )}
                                    </div>
                                    <span className="message-time">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="message bot">
                                <div className="message-avatar">
                                    <Bot size={20} />
                                </div>
                                <div className="message-content">
                                    <div className="message-bubble typing-indicator">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="chat-input-area">
                        {imagePreview && (
                            <div className="image-preview-container">
                                <div className="preview-content">
                                    <img src={imagePreview} alt="Preview" className="preview-thumbnail" />
                                    <span>Image attached</span>
                                </div>
                                <button className="remove-image-btn" onClick={clearImage}>
                                    <X size={16} />
                                </button>
                            </div>
                        )}

                        <form className="input-form" onSubmit={handleSendMessage}>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageSelect}
                                accept="image/*"
                                style={{ display: 'none' }}
                            />
                            <button
                                type="button"
                                className="file-btn"
                                onClick={() => fileInputRef.current?.click()}
                                title="Attach medical image"
                            >
                                <Paperclip size={20} />
                            </button>

                            <textarea
                                className="text-input"
                                placeholder="Type your health question..."
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage(e);
                                    }
                                }}
                                rows={1}
                            />

                            <button
                                type="submit"
                                className="send-btn"
                                disabled={isLoading || (!inputMessage.trim() && !selectedImage)}
                            >
                                {isLoading ? <Loader size={20} className="loader-icon" /> : <Send size={20} />}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            {!isOpen && (
                <button className="chatbot-toggle" onClick={() => setIsOpen(true)}>
                    <MessageCircle size={24} />
                    <span className="chatbot-toggle-text">Get AI medical assistance</span>
                    {unreadCount > 0 && (
                        <span className="notification-badge">{unreadCount}</span>
                    )}
                </button>
            )}
        </div>
    );
};

export default MedicalChatbot;
