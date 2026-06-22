import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard, logoutUser, getAdminInsights } from '../services/api';
import Sidebar from '../components/Sidebar';

const PURPLE = '#7c6af7';
const PINK   = '#f472b6';
const GREEN  = '#10b981';
const YELLOW = '#f59e0b';

export default function Insights() {
    const [insights, setInsights] = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [error,    setError]    = useState('');
    const [activeSection, setActiveSection] = useState('insights');

    const token    = localStorage.getItem('token');
    const navigate = useNavigate();

    useEffect(() => { fetchInsights(); }, []);

    const fetchInsights = async () => {
        setLoading(true);
        try {
            const res = await getAdminInsights(token);
            if (res.success) setInsights(res.insights);
        } catch { setError('Cannot load insights'); }
        finally { setLoading(false); }
    };

    const handleLogout = async () => {
        await logoutUser(token);
        localStorage.clear();
        navigate('/login');
    };

    if (loading) return (
        <div style={{ minHeight: '100vh', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="text-center">
                <div className="spinner-border mb-3" style={{ color: PURPLE }} />
                <p style={{ color: '#6b7280' }}>Loading insights...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="container mt-5">
            <div className="alert alert-danger">{error}</div>
        </div>
    );

    // Top 3 card styles
    const medalStyles = [
        { bg: 'linear-gradient(135deg, #fef3c7, #fde68a)', border: '#f59e0b', color: '#92400e' },
        { bg: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)', border: '#94a3b8', color: '#475569' },
        { bg: 'linear-gradient(135deg, #fef9ee, #fed7aa)', border: '#f97316', color: '#9a3412' },
    ];

    return (
        <div className="dash-root">
            <Sidebar
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                handleLogout={handleLogout}
            />

            <main className="dash-main">
                <header className="dash-topbar">
                    <div>
                        <h1 className="dash-page-title">🏆 Insights</h1>
                        <p className="dash-page-sub">Leaderboard & user activity rankings</p>
                    </div>
                    <button className="dash-icon-btn" onClick={fetchInsights} title="Refresh">
                        <i className="bi bi-arrow-clockwise" />
                    </button>
                </header>

                <div className="dash-section">

                    {/* ── Top 3 Medal Cards ── */}
                    <div className="row g-3 mb-4">
                        {insights.slice(0, 3).map((u, i) => (
                            <div className="col-md-4" key={i}>
                                <div style={{
                                    background: medalStyles[i].bg,
                                    border: `2px solid ${medalStyles[i].border}`,
                                    borderRadius: 16,
                                    padding: 24,
                                    textAlign: 'center',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>
                                        {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                                    </div>
                                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: medalStyles[i].color }}>
                                        {u.name === '—' ? u.phone : u.name}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#6b7280', fontFamily: 'monospace', marginBottom: 12 }}>
                                        {u.phone}
                                    </div>
                                    <div className="d-flex gap-2 justify-content-center">
                                        <span className="dash-badge badge-purple">💬 {u.chatCount} chats</span>
                                        <span className="dash-badge badge-pink">📄 {u.pdfCount} PDFs</span>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 10 }}>
                                        Last active: {u.lastActive ? new Date(u.lastActive).toLocaleDateString() : '—'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── Summary Stats ── */}
                    <div className="row g-3 mb-4">
                        {[
                            { label: 'Total Users',   value: insights.length,                              color: PURPLE, bg: '#ede9fe', icon: '👥' },
                            { label: 'Active Chatters', value: insights.filter(u => u.chatCount > 0).length, color: GREEN,  bg: '#d1fae5', icon: '💬' },
                            { label: 'PDF Users',     value: insights.filter(u => u.pdfCount > 0).length,  color: PINK,   bg: '#fce7f3', icon: '📄' },
                            { label: 'Total Chats',   value: insights.reduce((a, u) => a + u.chatCount, 0), color: YELLOW, bg: '#fef3c7', icon: '🤖' },
                        ].map(s => (
                            <div className="col-6 col-md-3" key={s.label}>
                                <div className="dash-metric-card" style={{ borderTop: `3px solid ${s.color}` }}>
                                    <div className="dash-metric-icon" style={{ background: s.bg }}>
                                        {s.icon}
                                    </div>
                                    <div>
                                        <div className="dash-metric-value" style={{ color: s.color }}>{s.value}</div>
                                        <div className="dash-metric-label">{s.label}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── Full Leaderboard ── */}
                    <div className="dash-chart-card">
                        <h6 className="dash-chart-title">📋 Full Leaderboard</h6>
                        <div className="dash-table-wrap">
                            <table className="dash-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>User</th>
                                        <th>Phone</th>
                                        <th>💬 Chats</th>
                                        <th>📄 PDFs</th>
                                        <th>Last Active</th>
                                        <th>Joined</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {insights.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-4" style={{ color: '#9ca3af' }}>
                                                No data yet
                                            </td>
                                        </tr>
                                    ) : insights.map((u, i) => (
                                        <tr key={i}>
                                            <td style={{ fontWeight: 700, fontSize: '1rem' }}>
                                                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span style={{ color: '#9ca3af' }}>{i + 1}</span>}
                                            </td>
                                            <td style={{ fontWeight: 600 }}>{u.name}</td>
                                            <td><small style={{ color: '#6b7280', fontFamily: 'monospace' }}>{u.phone}</small></td>
                                            <td><span className="dash-badge badge-purple">{u.chatCount}</span></td>
                                            <td><span className="dash-badge badge-pink">{u.pdfCount}</span></td>
                                            <td><small style={{ color: '#6b7280' }}>{u.lastActive ? new Date(u.lastActive).toLocaleDateString() : '—'}</small></td>
                                            <td><small style={{ color: '#6b7280' }}>{new Date(u.joinedAt).toLocaleDateString()}</small></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}