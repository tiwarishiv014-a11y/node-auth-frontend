// src/pages/Chat.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    sendChatMessage, getChatSessions, getChatSession,
    deleteChatSession, clearAllChats, transcribeAudio, speakText,
} from '../services/api';
// import './Chat.css';
import ReactMarkdown from 'react-markdown';

const LANGUAGES = [
    { code: 'en-IN', label: '🇮🇳 English' },
    { code: 'hi-IN', label: 'हिंदी' },
    { code: 'mr-IN', label: 'मराठी' },
    { code: 'gu-IN', label: 'ગુજરાતી' },
    { code: 'ta-IN', label: 'தமிழ்' },
    { code: 'te-IN', label: 'తెలుగు' },
    { code: 'kn-IN', label: 'ಕನ್ನಡ' },
    { code: 'bn-IN', label: 'বাংলা' },
];

const SUGGESTIONS = [
    "I didn't receive my OTP",
    'How do I update my profile?',
    'मेरा OTP नहीं आया',
    'What is my account status?',
];

function getTime() {
    return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

export default function Chat() {
    const [messages, setMessages] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [activeChatId, setActiveChatId] = useState(null);
    const [input, setInput] = useState('');
    const [language, setLanguage] = useState('hi-IN');
    const [loading, setLoading] = useState(false);
    const [sessionsLoading, setSessionsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showSidebar, setShowSidebar] = useState(true);
    const [recording, setRecording] = useState(false);
    const [transcribing, setTranscribing] = useState(false);
    const [speaking, setSpeaking] = useState(false);
    const [autoSpeak, setAutoSpeak] = useState(false);
    const [aiModel, setAiModel] = useState('sarvam');

    const messagesEndRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const audioPlayerRef = useRef(null);
    const navigate = useNavigate();

    const token = localStorage.getItem('token');
    const userPhone = localStorage.getItem('phone') || 'User';
    const userRole = localStorage.getItem('role') || 'user';
    const backRoute = userRole === 'admin' ? '/dashboard' : '/profile';

    useEffect(() => { if (!token) navigate('/login'); }, [token, navigate]);
    useEffect(() => { if (token) loadSessions(); }, [token]);
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

    const loadSessions = async () => {
        setSessionsLoading(true);
        try {
            const data = await getChatSessions(token);
            if (data.success) setSessions(data.sessions || []);
        } finally {
            setSessionsLoading(false);
        }
    };

    const startNewChat = () => { setActiveChatId(null); setMessages([]); setError(''); };

    const openSession = async (chatId) => {
        if (chatId === activeChatId) return;
        setError('');
        const data = await getChatSession(chatId, token);
        if (data.success) {
            setActiveChatId(chatId);
            setMessages(data.chat.messages.map((m) => ({ role: m.role, text: m.content, time: getTime() })));
        }
    };

    const removeSession = async (e, chatId) => {
        e.stopPropagation();
        if (!window.confirm('Delete this chat?')) return;
        await deleteChatSession(chatId, token);
        if (activeChatId === chatId) startNewChat();
        setSessions((prev) => prev.filter((s) => s._id !== chatId));
    };

    const handleClearAll = async () => {
        if (!window.confirm('Delete ALL chat history?')) return;
        await clearAllChats(token);
        setSessions([]);
        startNewChat();
    };

    const handleSend = async (text) => {
        const msg = (text || input).trim();
        if (!msg || loading) return;
        setInput(''); setError('');
        setMessages((prev) => [...prev, { role: 'user', text: msg, time: getTime() }]);
        setLoading(true);
        const data = await sendChatMessage(msg, language, token, activeChatId, aiModel);
        setLoading(false);
        if (data.success) {
            setActiveChatId(data.chatId);
            setMessages((prev) => [...prev, { role: 'assistant', text: data.reply, time: getTime() }]);
            setSessions((prev) => {
                const exists = prev.find((s) => s._id === data.chatId);
                if (exists) return prev.map((s) => s._id === data.chatId
                    ? { ...s, title: data.title, updatedAt: new Date().toISOString() } : s);
                return [{ _id: data.chatId, title: data.title, preview: msg, updatedAt: new Date().toISOString() }, ...prev];
            });
            if (autoSpeak && data.reply) playTextAsAudio(data.reply);
        } else {
            setError(data.error || 'Something went wrong.');
            setMessages((prev) => prev.slice(0, -1));
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioChunksRef.current = [];
            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
            recorder.onstop = async () => {
                stream.getTracks().forEach((t) => t.stop());
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setTranscribing(true);
                try {
                    const data = await transcribeAudio(blob, language, token);
                    if (data.success && data.transcript) setInput(data.transcript);
                    else setError('Could not understand audio. Try again.');
                } finally { setTranscribing(false); }
            };
            recorder.start();
            mediaRecorderRef.current = recorder;
            setRecording(true);
        } catch { setError('Microphone access denied.'); }
    };

    const stopRecording = () => { mediaRecorderRef.current?.stop(); setRecording(false); };
    const toggleRecording = () => { if (recording) stopRecording(); else startRecording(); };

    const playTextAsAudio = async (text) => {
        setSpeaking(true);
        try {
            const data = await speakText(text, language, token);
            if (data.success && data.audio) {
                const audio = new Audio(`data:audio/wav;base64,${data.audio}`);
                audioPlayerRef.current = audio;
                audio.onended = () => setSpeaking(false);
                audio.onerror = () => setSpeaking(false);
                await audio.play();
            }
        } catch { setSpeaking(false); }
    };

    const stopSpeaking = () => { audioPlayerRef.current?.pause(); audioPlayerRef.current = null; setSpeaking(false); };
    const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

    return (
        <div className="d-flex chat-page">

            {/* ── Sidebar ── */}
            <div className={`sidebar d-flex flex-column ${showSidebar ? '' : 'hidden'}`}>

                {/* Top */}
                <div className="p-3 border-bottom border-dark">
                    {/* User card */}
                    <div className="d-flex align-items-center gap-2 mb-3">
                        <div className="user-avatar-sm d-flex align-items-center justify-content-center fs-5">
                            {userRole === 'admin' ? '👑' : '👤'}
                        </div>
                        <div className="flex-grow-1 overflow-hidden">
                            <div className="text-truncate user-phone">{userPhone}</div>
                            <span className={userRole === 'admin' ? 'role-badge-admin' : 'role-badge-user'}>
                                {userRole === 'admin' ? 'Admin' : 'User'}
                            </span>
                        </div>
                        <button className="plain-btn" onClick={() => setShowSidebar(false)}>✕</button>
                    </div>

                    {/* New chat */}
                    <button className="new-chat-btn btn w-100 d-flex align-items-center justify-content-center gap-2 py-2" onClick={startNewChat}>
                        <i className="bi bi-pencil-square" /> New Chat
                    </button>
                </div>

                {/* Sessions list */}
                <div className="sessions-list p-2">
                    {sessionsLoading ? (
                        <p className="text-center mt-4 session-meta">Loading chats...</p>
                    ) : sessions.length === 0 ? (
                        <p className="text-center mt-4 session-meta">No chats yet.<br />Start a conversation!</p>
                    ) : sessions.map((session) => (
                        <div key={session._id}
                            className={`session-item d-flex align-items-center gap-2 p-2 mb-1 ${activeChatId === session._id ? 'active' : ''}`}
                            onClick={() => openSession(session._id)}
                        >
                            <span style={{ fontSize: 14 }}>💬</span>
                            <div className="flex-grow-1 overflow-hidden">
                                <div className="text-truncate session-title">{session.title}</div>
                                <div className="session-meta">{timeAgo(session.updatedAt)}</div>
                            </div>
                            <button className="plain-btn" onClick={(e) => removeSession(e, session._id)} title="Delete">
                                <i className="bi bi-trash3" />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-2 d-flex gap-2 border-top border-dark">
                    <button className="back-btn btn flex-grow-1 py-1" onClick={() => navigate(backRoute)}>
                        ← {userRole === 'admin' ? 'Dashboard' : 'Profile'}
                    </button>
                    {sessions.length > 0 && (
                        <button className="clear-btn btn px-3 py-1" onClick={handleClearAll}>
                            <i className="bi bi-trash3" /> All
                        </button>
                    )}
                </div>
            </div>

            {/* ── Main ── */}
            <div className="d-flex flex-column flex-grow-1 overflow-hidden">

                {/* Header */}
                <div className="header-bar d-flex align-items-center justify-content-between px-3 py-2 gap-3">
                    <div className="d-flex align-items-center gap-2 flex-grow-1 overflow-hidden">
                        {!showSidebar && (
                            <button className="icon-btn btn d-flex align-items-center justify-content-center" onClick={() => setShowSidebar(true)}>
                                <i className="bi bi-list" />
                            </button>
                        )}
                        <div className="logo-icon d-flex align-items-center justify-content-center fs-5">🤖</div>
                        <div className="overflow-hidden">
                            <div className="text-truncate header-title">
                                {activeChatId
                                    ? (sessions.find((x) => x._id === activeChatId)?.title || 'Chat')
                                    : 'Sarvam AI Assistant'}
                            </div>
                            <div className="d-flex align-items-center gap-1 header-sub">
                                <span className="online-dot" /> Online · sarvam-30b
                            </div>
                        </div>
                    </div>
                    {/* ✅ NEW: Added AI Model Selector in Header */}
                    <div className="d-flex align-items-center gap-2 flex-shrink-0">
                        {/* ✅ NEW: AI Model Toggle Buttons */}
                       <div className="ai-model-toggle" role="group" aria-label="AI Model Selector">
    <button
        type="button"
        className={`ai-model-btn ${aiModel === 'sarvam' ? 'active-sarvam' : ''}`}
        onClick={() => setAiModel('sarvam')}
        title="Sarvam AI — Multilingual Indian language support"
    >
        🇮🇳 Sarvam
    </button>
    <button
        type="button"
        className={`ai-model-btn ${aiModel === 'groq' ? 'active-groq' : ''}`}
        onClick={() => setAiModel('groq')}
        title="Groq AI — Faster responses"
    >
        ⚡ Groq
    </button>
</div>

                        <select value={language} onChange={(e) => setLanguage(e.target.value)} className="lang-select form-select form-select-sm">
                            {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                        </select>

                        <button
                            className={`icon-btn btn d-flex align-items-center justify-content-center ${autoSpeak ? 'autospeak-on' : ''}`}
                            onClick={() => setAutoSpeak((v) => !v)}
                            title={autoSpeak ? 'Auto-speak ON' : 'Auto-speak OFF'}
                        >
                            <i className="bi bi-volume-up" />
                        </button>
                        <button className="icon-btn btn d-flex align-items-center justify-content-center" onClick={startNewChat} title="New chat">
                            <i className="bi bi-pencil-square" />
                        </button>
                    </div>
                </div>
            

            {/* Messages */}
            <div className="messages-area p-3 d-flex flex-column gap-3">
                {messages.length === 0 ? (
                    <div className="d-flex flex-column align-items-center justify-content-center flex-grow-1 text-center p-5 gap-3">
                        <div className="welcome-icon d-flex align-items-center justify-content-center">🙏</div>
                        <h5 className="welcome-title mb-0">Namaste, {userPhone}!</h5>
                        <p className="welcome-sub mb-0">
                            Type or <strong>speak</strong> your message in any Indian language.
                        </p>
                        {/* ✅ NEW: AI Model Status Badge in Welcome Screen */}
                        <div className="mt-2">
                            <span className={`badge ${aiModel === 'sarvam' ? 'bg-primary' : 'bg-success'} p-2`}>
                                {aiModel === 'sarvam' ? '🇮🇳' : '⚡'} Using {aiModel.toUpperCase()} AI
                            </span>
                            <span className="text-muted ms-2 small">
                                {aiModel === 'sarvam' ? '• Multilingual' : '• Fast responses'}
                            </span>
                        </div>
                        <div className="d-flex flex-wrap gap-2 justify-content-center">
                            {SUGGESTIONS.map((sg) => (
                                <button key={sg} className="chip btn px-3 py-2" onClick={() => handleSend(sg)}>{sg}</button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((m, i) => (
                            <div key={i} className={`d-flex gap-2 align-items-end ${m.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
                                {m.role === 'assistant' && (
                                    <div className="avatar-bot d-flex align-items-center justify-content-center">🤖</div>
                                )}
                                <div>
                                    {/* <div className={`${m.role === 'user' ? 'bubble-user' : 'bubble-bot'} px-3 py-2`}>
                                            {m.text}
                                        </div> */}
                                    {/* ✅ New - renders markdown */}
                                    <div className={`${m.role === 'user' ? 'bubble-user' : 'bubble-bot'} px-3 py-2`}>
                                        {m.role === 'assistant'
                                            ? <ReactMarkdown>{m.text}</ReactMarkdown>
                                            : m.text
                                        }
                                    </div>
                                    <div className={`d-flex align-items-center gap-2 mt-1 ${m.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
                                        {m.time && <span className="msg-time">{m.time}</span>}
                                        {m.role === 'assistant' && (
                                            <button className="speak-btn" onClick={() => speaking ? stopSpeaking() : playTextAsAudio(m.text)} title="Listen">
                                                <i className={`bi ${speaking ? 'bi-stop-fill' : 'bi-volume-up'}`} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {m.role === 'user' && (
                                    <div className="avatar-user d-flex align-items-center justify-content-center">
                                        {userRole === 'admin' ? '👑' : '👤'}
                                    </div>
                                )}
                            </div>
                        ))}

                        {loading && (
                            <div className="d-flex gap-2 align-items-end justify-content-start">
                                <div className="avatar-bot d-flex align-items-center justify-content-center">🤖</div>
                                <div className="bubble-bot d-flex gap-1 align-items-center px-3 py-2">
                                    <span className="typing-dot" style={{ animationDelay: '0s' }} />
                                    <span className="typing-dot" style={{ animationDelay: '0.2s' }} />
                                    <span className="typing-dot" style={{ animationDelay: '0.4s' }} />
                                    {/* ✅ NEW: Show which AI model is responding */}
                                    <span className="ms-1 small text-muted">
                                        {aiModel === 'sarvam' ? 'Sarvam AI' : 'Groq AI'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Error */}
            {error && (
                <div className="error-bar mx-3 mb-2 px-3 py-2 text-center">
                    <i className="bi bi-exclamation-circle me-2" />{error}
                </div>
            )}

            {/* Input Area */}
            <div className="input-area p-3">
                {/* Voice status */}
                {(recording || transcribing || speaking) && (
                    <div className="voice-status d-flex align-items-center gap-2 p-2 mb-2">
                        {recording && <><span className="rec-dot" /> Recording… tap mic to stop</>}
                        {transcribing && <><i className="bi bi-hourglass-split" /> Transcribing…</>}
                        {speaking && (
                            <><i className="bi bi-volume-up" /> Speaking…
                                <button className="stop-btn ms-1" onClick={stopSpeaking}>Stop</button>
                            </>
                        )}
                    </div>
                )}

                {/* Input row */}
                <div className="input-wrap d-flex align-items-end gap-2 p-2">
                    <button
                        className={`mic-btn d-flex align-items-center justify-content-center ${recording ? 'recording' : ''}`}
                        onClick={toggleRecording}
                        disabled={transcribing || loading}
                        title={recording ? 'Stop recording' : 'Start voice input'}
                    >
                        {transcribing
                            ? <i className="bi bi-hourglass-split" />
                            : recording
                                ? <i className="bi bi-stop-fill" />
                                : <i className="bi bi-mic-fill" />}
                    </button>

                    <textarea
                        rows={1}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKey}
                        placeholder={recording ? 'Listening…' : `Type or speak your message (${aiModel.toUpperCase()})…`}
                        className="chat-input"
                    />

                    {/* ✅ CHANGED: Dynamic button color based on AI model */}
                    <button
                        className={`send-btn d-flex align-items-center justify-content-center ${aiModel === 'groq' ? 'btn-success' : ''}`}
                        onClick={() => handleSend()}
                        disabled={loading || !input.trim()}
                        style={aiModel === 'groq' ? { backgroundColor: '#28a745', borderColor: '#28a745' } : {}}
                    >
                        <i className="bi bi-send-fill" />
                    </button>
                </div>

                <p className="input-hint text-center mt-2 mb-0">
                    <i className="bi bi-mic me-1" />Tap mic to speak ·
                    <i className="bi bi-volume-up mx-1" />Toggle auto-speak ·
                    Supports 10+ Indian languages
                    <span className={`ms-1 fw-bold ${aiModel === 'groq' ? 'text-success' : 'text-primary'}`}>
                        {aiModel.toUpperCase()}
                    </span>
                </p>
            </div>
               
        </div>
        </div>
    );
}