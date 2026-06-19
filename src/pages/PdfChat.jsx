import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { uploadPdf, chatWithPdf } from '../services/api.js';
import { useNavigate } from 'react-router-dom';

// const API = import.meta.env.VITE_API_URL;

export default function PdfChat() {
    const navigate = useNavigate();

      const userRole = localStorage.getItem('role') || 'user';
    const backRoute = userRole === 'admin' ? '/dashboard' : '/profile';


    // ── State ─────────────────────────────────────────────
    const [file, setFile]           = useState(null);       // selected PDF file
    const [docId, setDocId]         = useState(null);       // MongoDB doc ID after upload
    const [filename, setFilename]   = useState('');         // uploaded PDF name
    const [question, setQuestion]   = useState('');         // user's question input
    const [messages, setMessages]   = useState([]);         // chat history
    const [uploading, setUploading] = useState(false);      // upload loading state
    const [asking, setAsking]       = useState(false);      // chat loading state
    const [error, setError]         = useState('');         // error message
    const fileInputRef              = useRef(null);         // ref for file input

    

    // ── Upload PDF ────────────────────────────────────────
   const handleUpload = async () => {
    console.log('handleUpload called', file);  // 👈 add this
    if (!file) return setError('Please select a PDF file first.');
    setUploading(true);
    setError('');

    try {
        const data = await uploadPdf(file);  // 👈 clean, uses service

        if (!data.success) throw new Error(data.error);

        setDocId(data.docId);
        setFilename(data.filename);
        setMessages([{
            role: 'system',
            text: `✅ "${data.filename}" uploaded! Split into ${data.chunks} chunks. Ask me anything about it.`
        }]);

    } catch (err) {
        setError(err.message || 'Upload failed.');
    } finally {
        setUploading(false);
    }
};
   // ✅ CORRECT - clean version
const handleAsk = async () => {
    if (!question.trim()) return setError('Please enter a question.');
    if (!docId) return setError('Please upload a PDF first.');
    setAsking(true);
    setError('');

    const userMsg = { role: 'user', text: question };
    setMessages(prev => [...prev, userMsg]);
    setQuestion('');

    try {
        const data = await chatWithPdf(question, docId);
        if (!data.success) throw new Error(data.error);
        setMessages(prev => [...prev, { role: 'ai', text: data.answer }]);

    } catch (err) {
        setMessages(prev => [...prev, { role: 'ai', text: '❌ ' + (err.message || 'Failed to get answer.') }]);
    } finally {
        setAsking(false);
    }
};
    // ── Send on Enter key ─────────────────────────────────
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAsk();
        }
    };

    // ── Clear / Reset ─────────────────────────────────────
    const handleReset = () => {
        setFile(null);
        setDocId(null);
        setFilename('');
        setMessages([]);
        setQuestion('');
        setError('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // ── Render ────────────────────────────────────────────
    return (
        <div className="pdf-chat-page">

            {/* ── Header ── */}
           <div className="pdf-chat-header">
    <div className="pdf-chat-header-left">
        <div className="logo-icon">📄</div>
        <div className="header-text">
            <h2>PDF Chat</h2>
            <p>Upload a PDF and ask questions about it</p>
        </div>
    </div>
    <div className="pdf-chat-header-right">
        <button className="back-btn" onClick={() => navigate(backRoute)}>
            ← {userRole === 'admin' ? 'Dashboard' : 'Profile'}
        </button>
    </div>
</div>

            {/* ── Upload Section ── */}
            <div className="pdf-upload-box">
                <input
                    type="file"
                    accept=".pdf"
                    ref={fileInputRef}
                    onChange={(e) => {
                        console.log('File selected:', e.target.files[0]); // 👈 add
                        setFile(e.target.files[0]);
                        setError('');
                    }}
                    className="pdf-file-input"
                />

                <button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="btn-upload"
                >
                    {uploading ? '⏳ Uploading...' : '⬆️ Upload PDF'}
                </button>

                {/* Show uploaded filename */}
                {filename && (
                    <div className="pdf-filename-badge">
                        📎 {filename}
                        <button onClick={handleReset} className="btn-reset">✕ Clear</button>
                    </div>
                )}
            </div>

            {/* ── Error Message ── */}
            {error && <div className="pdf-error">{error}</div>}

            {/* ── Chat Window ── */}
            <div className="pdf-chat-window">
                {messages.length === 0 && (
                    <div className="pdf-chat-empty">
                        Upload a PDF above to get started 👆
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} className={`pdf-msg pdf-msg--${msg.role}`}>
                        <span className="pdf-msg-label">
                            {msg.role === 'user' ? '🧑 You' : msg.role === 'ai' ? '🤖 AI' : 'ℹ️'}
                        </span>
                        <div className="pdf-msg-text">
                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                    </div>
                ))}

                {/* Typing indicator */}
                {asking && (
                    <div className="pdf-msg pdf-msg--ai">
                        <span className="pdf-msg-label">🤖 AI</span>
                        <div className="pdf-typing">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Input Box ── */}
            <div className="pdf-input-row">
                <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={docId ? 'Ask a question about your PDF...' : 'Upload a PDF first...'}
                    disabled={!docId || asking}
                    className="pdf-question-input"
                    rows={2}
                />
                <button
                    onClick={handleAsk}
                    disabled={!docId || asking || !question.trim()}
                    className="btn-ask"
                >
                    {asking ? '⏳' : '➤'}
                </button>
            </div>

        </div>
    );
}