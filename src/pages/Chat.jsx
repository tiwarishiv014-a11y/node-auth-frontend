// src/pages/Chat.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    sendChatMessage, getChatSessions, getChatSession,
    deleteChatSession, clearAllChats, transcribeAudio, speakText,
} from '../services/api';

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
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins < 1)   return 'Just now';
    if (mins < 60)  return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

export default function Chat() {
    const [messages, setMessages]               = useState([]);
    const [sessions, setSessions]               = useState([]);
    const [activeChatId, setActiveChatId]       = useState(null);
    const [input, setInput]                     = useState('');
    const [language, setLanguage]               = useState('hi-IN');
    const [loading, setLoading]                 = useState(false);
    const [sessionsLoading, setSessionsLoading] = useState(true);
    const [error, setError]                     = useState('');
    const [showSidebar, setShowSidebar]         = useState(true);
    // Voice states
    const [recording, setRecording]             = useState(false);
    const [transcribing, setTranscribing]       = useState(false);
    const [speaking, setSpeaking]               = useState(false);
    const [autoSpeak, setAutoSpeak]             = useState(false);

    const messagesEndRef   = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef   = useRef([]);
    const audioPlayerRef   = useRef(null);
    const navigate         = useNavigate();

    const token     = localStorage.getItem('token');
    const userPhone = localStorage.getItem('phone') || 'User';
    const userRole  = localStorage.getItem('role')  || 'user';
    const backRoute = userRole === 'admin' ? '/dashboard' : '/profile';

    useEffect(() => { if (!token) navigate('/login'); }, [token, navigate]);

    useEffect(() => {
        if (!token) return;
        loadSessions();
    }, [token]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const loadSessions = async () => {
        setSessionsLoading(true);
        try {
            const data = await getChatSessions(token);
            if (data.success) setSessions(data.sessions || []);
        } finally {
            setSessionsLoading(false);
        }
    };

    const startNewChat = () => {
        setActiveChatId(null);
        setMessages([]);
        setError('');
    };

    const openSession = async (chatId) => {
        if (chatId === activeChatId) return;
        setError('');
        const data = await getChatSession(chatId, token);
        if (data.success) {
            setActiveChatId(chatId);
            setMessages(data.chat.messages.map((m) => ({
                role: m.role, text: m.content, time: getTime(),
            })));
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

        setInput('');
        setError('');
        setMessages((prev) => [...prev, { role: 'user', text: msg, time: getTime() }]);
        setLoading(true);

        const data = await sendChatMessage(msg, language, token, activeChatId);
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

            // Auto-speak AI reply if enabled
            if (autoSpeak && data.reply) {
                playTextAsAudio(data.reply);
            }
        } else {
            setError(data.error || 'Something went wrong.');
            setMessages((prev) => prev.slice(0, -1));
        }
    };

    // ── STT: Record voice ─────────────────────────────────────
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioChunksRef.current = [];
            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            recorder.onstop = async () => {
                stream.getTracks().forEach((t) => t.stop());
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setTranscribing(true);
                try {
                    const data = await transcribeAudio(blob, language, token);
                    if (data.success && data.transcript) {
                        setInput(data.transcript);
                    } else {
                        setError('Could not understand audio. Try again.');
                    }
                } finally {
                    setTranscribing(false);
                }
            };

            recorder.start();
            mediaRecorderRef.current = recorder;
            setRecording(true);
        } catch (err) {
            setError('Microphone access denied.');
        }
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setRecording(false);
    };

    const toggleRecording = () => {
        if (recording) stopRecording();
        else startRecording();
    };

    // ── TTS: Play AI reply ────────────────────────────────────
    const playTextAsAudio = async (text) => {
        setSpeaking(true);
        try {
            const data = await speakText(text, language, token);
            if (data.success && data.audio) {
                const audioSrc = `data:audio/wav;base64,${data.audio}`;
                if (audioPlayerRef.current) {
                    audioPlayerRef.current.pause();
                }
                const audio = new Audio(audioSrc);
                audioPlayerRef.current = audio;
                audio.onended = () => setSpeaking(false);
                audio.onerror = () => setSpeaking(false);
                await audio.play();
            }
        } catch {
            setSpeaking(false);
        }
    };

    const stopSpeaking = () => {
        audioPlayerRef.current?.pause();
        audioPlayerRef.current = null;
        setSpeaking(false);
    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    const hasMessages = messages.length > 0;

    return (
        <div style={s.page}>

            {/* ── Sidebar ── */}
            <div style={{ ...s.sidebar, marginLeft: showSidebar ? 0 : -280 }}>
                <div style={s.sidebarTop}>
                    <div style={s.userCard}>
                        <div style={s.userAvatar}>{userRole === 'admin' ? '👑' : '👤'}</div>
                        <div style={{ flex:1, minWidth:0 }}>
                            <div style={s.userPhone}>{userPhone}</div>
                            <div style={s.userRoleBadge(userRole)}>
                                {userRole === 'admin' ? 'Admin' : 'User'}
                            </div>
                        </div>
                        <button onClick={() => setShowSidebar(false)} style={s.iconBtn}>✕</button>
                    </div>
                    <button onClick={startNewChat} style={s.newChatBtn}>
                        <span>✏️</span> New Chat
                    </button>
                </div>

                <div style={s.sessionsList}>
                    {sessionsLoading ? (
                        <p style={s.sidebarEmpty}>Loading chats...</p>
                    ) : sessions.length === 0 ? (
                        <p style={s.sidebarEmpty}>No chats yet.<br />Start a conversation!</p>
                    ) : sessions.map((session) => (
                        <div key={session._id} onClick={() => openSession(session._id)}
                            style={{ ...s.sessionItem, ...(activeChatId === session._id ? s.sessionItemActive : {}) }}>
                            <div style={s.sessionIcon}>💬</div>
                            <div style={{ flex:1, minWidth:0 }}>
                                <div style={s.sessionTitle}>{session.title}</div>
                                <div style={s.sessionMeta}>{timeAgo(session.updatedAt)}</div>
                            </div>
                            <button onClick={(e) => removeSession(e, session._id)} style={s.iconBtn} title="Delete">🗑</button>
                        </div>
                    ))}
                </div>

                <div style={s.sidebarFooter}>
                    <button onClick={() => navigate(backRoute)} style={s.backBtn2}>
                        ← {userRole === 'admin' ? 'Dashboard' : 'Profile'}
                    </button>
                    {sessions.length > 0 && (
                        <button onClick={handleClearAll} style={s.clearAllBtn}>🗑 All</button>
                    )}
                </div>
            </div>

            {/* ── Main ── */}
            <div style={s.main}>

                {/* Header */}
                <div style={s.header}>
                    <div style={s.headerLeft}>
                        {!showSidebar && (
                            <button onClick={() => setShowSidebar(true)} style={s.iconBtnLight}>☰</button>
                        )}
                        <div style={s.logo}>🤖</div>
                        <div>
                            <div style={s.headerTitle}>
                                {activeChatId
                                    ? (sessions.find((x) => x._id === activeChatId)?.title || 'Chat')
                                    : 'Sarvam AI Assistant'}
                            </div>
                            <div style={s.headerSub}><span style={s.dot} /> Online · sarvam-30b</div>
                        </div>
                    </div>
                    <div style={s.headerRight}>
                        <select value={language} onChange={(e) => setLanguage(e.target.value)} style={s.select}>
                            {LANGUAGES.map((l) => (
                                <option key={l.code} value={l.code}>{l.label}</option>
                            ))}
                        </select>
                        {/* Auto-speak toggle */}
                        <button
                            onClick={() => setAutoSpeak((v) => !v)}
                            title={autoSpeak ? 'Auto-speak ON' : 'Auto-speak OFF'}
                            style={{ ...s.iconBtnLight, background: autoSpeak ? 'rgba(124,106,247,0.2)' : 'transparent', color: autoSpeak ? '#a78bfa' : '#7a7a9a' }}
                        >
                            🔊
                        </button>
                        <button onClick={startNewChat} style={s.iconBtnLight} title="New chat">✏️</button>
                    </div>
                </div>

                {/* Messages */}
                <div style={s.messages}>
                    {!hasMessages ? (
                        <div style={s.welcome}>
                            <div style={s.welcomeIcon}>🙏</div>
                            <h2 style={s.welcomeTitle}>Namaste, {userPhone}!</h2>
                            <p style={s.welcomeSub}>
                                Type or <strong>speak</strong> your message in any Indian language.
                            </p>
                            <div style={s.chips}>
                                {SUGGESTIONS.map((sg) => (
                                    <button key={sg} style={s.chip} onClick={() => handleSend(sg)}>{sg}</button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            {messages.map((m, i) => (
                                <div key={i} style={{ ...s.msgRow, justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                                    {m.role === 'assistant' && <div style={s.avatarBot}>🤖</div>}
                                    <div>
                                        <div style={m.role === 'user' ? s.bubbleUser : s.bubbleBot}>
                                            {m.text}
                                        </div>
                                        <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4, justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                                            {m.time && <span style={s.msgTime}>{m.time}</span>}
                                            {/* Speak button on AI messages */}
                                            {m.role === 'assistant' && (
                                                <button
                                                    onClick={() => speaking ? stopSpeaking() : playTextAsAudio(m.text)}
                                                    style={s.speakBtn}
                                                    title="Listen to this message"
                                                >
                                                    {speaking ? '⏹' : '🔊'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {m.role === 'user' && (
                                        <div style={s.avatarUser}>{userRole === 'admin' ? '👑' : '👤'}</div>
                                    )}
                                </div>
                            ))}

                            {loading && (
                                <div style={{ ...s.msgRow, justifyContent: 'flex-start' }}>
                                    <div style={s.avatarBot}>🤖</div>
                                    <div style={s.typingBubble}>
                                        <span style={{ ...s.typingDot, animationDelay:'0s' }} />
                                        <span style={{ ...s.typingDot, animationDelay:'0.2s' }} />
                                        <span style={{ ...s.typingDot, animationDelay:'0.4s' }} />
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {error && <div style={s.errorBar}>{error}</div>}

                {/* Input */}
                <div style={s.inputArea}>
                    {/* Status bar */}
                    {(recording || transcribing || speaking) && (
                        <div style={s.voiceStatus}>
                            {recording   && <><span style={s.recDot} /> Recording… tap mic to stop</>}
                            {transcribing && <>⏳ Transcribing…</>}
                            {speaking     && <>🔊 Speaking… <button onClick={stopSpeaking} style={s.stopBtn}>Stop</button></>}
                        </div>
                    )}
                    <div style={s.inputRow}>
                        {/* Mic button */}
                        <button
                            onClick={toggleRecording}
                            disabled={transcribing || loading}
                            title={recording ? 'Stop recording' : 'Start voice input'}
                            style={{
                                ...s.micBtn,
                                background: recording ? '#f87171' : 'rgba(124,106,247,0.15)',
                                border: recording ? '1px solid #f87171' : '1px solid #7c6af7',
                                color: recording ? 'white' : '#a78bfa',
                                animation: recording ? 'micPulse 1s infinite' : 'none',
                            }}
                        >
                            {transcribing ? '⏳' : recording ? '⏹' : '🎤'}
                        </button>

                        <textarea
                            rows={1}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKey}
                            placeholder={recording ? 'Listening…' : 'Type or speak your message…'}
                            style={s.textarea}
                        />

                        <button
                            onClick={() => handleSend()}
                            disabled={loading || !input.trim()}
                            style={{ ...s.sendBtn, opacity: loading || !input.trim() ? 0.4 : 1, cursor: loading || !input.trim() ? 'not-allowed' : 'pointer' }}
                        >
                            ➤
                        </button>
                    </div>
                    <p style={s.hint}>
                        🎤 Tap mic to speak · 🔊 Toggle auto-speak · Supports 10+ Indian languages
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes typingBounce { 0%,60%,100%{transform:translateY(0);opacity:0.4} 30%{transform:translateY(-5px);opacity:1} }
                @keyframes dotPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
                @keyframes micPulse { 0%,100%{box-shadow:0 0 0 0 rgba(248,113,113,0.4)} 50%{box-shadow:0 0 0 8px rgba(248,113,113,0)} }
                @keyframes recBlink { 0%,100%{opacity:1} 50%{opacity:0.2} }
            `}</style>
        </div>
    );
}

const s = {
    page: { display:'flex', height:'100vh', background:'#0f0f13', color:'#e8e8f0', fontFamily:"'Inter',sans-serif", overflow:'hidden' },

    sidebar: { width:280, flexShrink:0, background:'#1a1a24', borderRight:'1px solid #2e2e3f', display:'flex', flexDirection:'column', transition:'margin-left 0.3s ease' },
    sidebarTop: { padding:'14px 12px', borderBottom:'1px solid #2e2e3f' },
    userCard: { display:'flex', alignItems:'center', gap:8, marginBottom:12 },
    userAvatar: { width:34, height:34, borderRadius:10, flexShrink:0, background:'rgba(124,106,247,0.2)', border:'1px solid #7c6af7', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 },
    userPhone: { fontSize:13, fontWeight:600, color:'#e8e8f0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
    userRoleBadge: (role) => ({ fontSize:10, fontWeight:600, padding:'1px 7px', borderRadius:20, background: role==='admin'?'rgba(251,191,36,0.15)':'rgba(124,106,247,0.15)', color: role==='admin'?'#fbbf24':'#a78bfa', border: role==='admin'?'1px solid #fbbf24':'1px solid #7c6af7' }),
    newChatBtn: { width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'linear-gradient(135deg,#7c6af7,#c084fc)', border:'none', borderRadius:10, color:'white', padding:'9px 14px', fontSize:13, fontWeight:600, cursor:'pointer' },
    sessionsList: { flex:1, overflowY:'auto', padding:'8px' },
    sidebarEmpty: { color:'#7a7a9a', fontSize:13, textAlign:'center', marginTop:24, lineHeight:1.8 },
    sessionItem: { display:'flex', alignItems:'center', gap:8, padding:'9px 10px', borderRadius:10, cursor:'pointer', marginBottom:2, border:'1px solid transparent' },
    sessionItemActive: { background:'rgba(124,106,247,0.12)', border:'1px solid rgba(124,106,247,0.3)' },
    sessionIcon: { fontSize:14, flexShrink:0 },
    sessionTitle: { fontSize:13, color:'#e8e8f0', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
    sessionMeta: { fontSize:10, color:'#7a7a9a', marginTop:2 },
    sidebarFooter: { padding:'10px 12px', borderTop:'1px solid #2e2e3f', display:'flex', gap:8 },
    backBtn2: { flex:1, background:'transparent', border:'1px solid #2e2e3f', color:'#7a7a9a', padding:'7px 10px', borderRadius:8, fontSize:12, cursor:'pointer' },
    clearAllBtn: { background:'transparent', border:'1px solid #f87171', color:'#f87171', padding:'7px 10px', borderRadius:8, fontSize:12, cursor:'pointer' },

    main: { flex:1, display:'flex', flexDirection:'column', overflow:'hidden' },
    header: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', background:'#1a1a24', borderBottom:'1px solid #2e2e3f', flexShrink:0, gap:12 },
    headerLeft: { display:'flex', alignItems:'center', gap:12, flex:1, minWidth:0 },
    logo: { width:36, height:36, borderRadius:10, flexShrink:0, background:'linear-gradient(135deg,#7c6af7,#c084fc)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 },
    headerTitle: { fontSize:14, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
    headerSub: { fontSize:11, color:'#7a7a9a', display:'flex', alignItems:'center', gap:5 },
    dot: { display:'inline-block', width:6, height:6, borderRadius:'50%', background:'#34d399', animation:'dotPulse 2s infinite' },
    headerRight: { display:'flex', alignItems:'center', gap:8, flexShrink:0 },
    select: { background:'#22222f', border:'1px solid #2e2e3f', color:'#e8e8f0', padding:'5px 8px', borderRadius:8, fontSize:12, cursor:'pointer', outline:'none' },

    messages: { flex:1, overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column', gap:16 },
    welcome: { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1, gap:14, textAlign:'center', padding:'40px 20px' },
    welcomeIcon: { width:64, height:64, borderRadius:18, background:'rgba(124,106,247,0.15)', border:'1px solid #7c6af7', display:'flex', alignItems:'center', justifyContent:'center', fontSize:30 },
    welcomeTitle: { fontSize:20, fontWeight:600, margin:0 },
    welcomeSub: { fontSize:14, color:'#7a7a9a', lineHeight:1.6, margin:0 },
    chips: { display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center', marginTop:8 },
    chip: { background:'#22222f', border:'1px solid #2e2e3f', color:'#7a7a9a', padding:'7px 14px', borderRadius:20, fontSize:13, cursor:'pointer' },

    msgRow: { display:'flex', gap:10, alignItems:'flex-end' },
    avatarBot: { width:30, height:30, borderRadius:8, flexShrink:0, background:'linear-gradient(135deg,#7c6af7,#c084fc)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 },
    avatarUser: { width:30, height:30, borderRadius:8, flexShrink:0, background:'#2d2550', border:'1px solid #7c6af7', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 },
    bubbleUser: { background:'#2d2550', border:'1px solid rgba(124,106,247,0.3)', borderRadius:'14px 14px 4px 14px', padding:'10px 14px', fontSize:14, lineHeight:1.6, maxWidth:500, wordBreak:'break-word', color:'#e8e8f0' },
    bubbleBot: { background:'#1e1e2b', border:'1px solid #2e2e3f', borderRadius:'14px 14px 14px 4px', padding:'10px 14px', fontSize:14, lineHeight:1.6, maxWidth:500, wordBreak:'break-word', color:'#e8e8f0' },
    msgTime: { fontSize:10, color:'#7a7a9a' },
    speakBtn: { background:'transparent', border:'none', color:'#7a7a9a', fontSize:12, cursor:'pointer', padding:'0 2px' },

    typingBubble: { display:'flex', gap:4, padding:'12px 16px', background:'#1e1e2b', border:'1px solid #2e2e3f', borderRadius:'14px 14px 14px 4px', alignItems:'center' },
    typingDot: { display:'inline-block', width:7, height:7, background:'#7c6af7', borderRadius:'50%', animation:'typingBounce 1.2s infinite' },
    errorBar: { background:'#2d1515', border:'1px solid #f87171', color:'#f87171', padding:'10px 20px', fontSize:13, textAlign:'center', flexShrink:0 },

    inputArea: { background:'#1a1a24', borderTop:'1px solid #2e2e3f', padding:'12px 20px', flexShrink:0 },
    voiceStatus: { display:'flex', alignItems:'center', gap:8, fontSize:12, color:'#a78bfa', marginBottom:8, padding:'6px 10px', background:'rgba(124,106,247,0.08)', borderRadius:8 },
    recDot: { display:'inline-block', width:8, height:8, borderRadius:'50%', background:'#f87171', animation:'recBlink 1s infinite' },
    stopBtn: { background:'transparent', border:'1px solid #f87171', color:'#f87171', padding:'2px 8px', borderRadius:6, fontSize:11, cursor:'pointer', marginLeft:4 },

    inputRow: { display:'flex', gap:8, alignItems:'flex-end', background:'#22222f', border:'1px solid #2e2e3f', borderRadius:14, padding:'10px 12px' },
    micBtn: { width:36, height:36, borderRadius:10, border:'none', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.2s' },
    textarea: { flex:1, background:'transparent', border:'none', outline:'none', color:'#e8e8f0', fontSize:14, fontFamily:'inherit', resize:'none', lineHeight:1.5, maxHeight:120 },
    sendBtn: { background:'#7c6af7', border:'none', borderRadius:10, width:36, height:36, color:'white', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
    hint: { fontSize:11, color:'#7a7a9a', marginTop:8, textAlign:'center' },

    iconBtn: { background:'transparent', border:'none', color:'#7a7a9a', fontSize:14, cursor:'pointer', padding:4 },
    iconBtnLight: { background:'transparent', border:'1px solid #2e2e3f', color:'#7a7a9a', width:34, height:34, borderRadius:8, fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' },
};