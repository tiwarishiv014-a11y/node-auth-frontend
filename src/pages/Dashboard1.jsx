// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getDashboard, updateUserStatus, deleteUser, getUserDetail, logoutUser, getAiChatLogs, getPdfChatLogs,
    banUser, unbanUser, resetUserOtp, getUserChats, getUserPdfs
} from '../services/api';
// import './Dashboard.css';
// import './App.css';

function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [roleFilter, setRoleFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState(null);
    const [detailLoad, setDetailLoad] = useState(false);

    const [userChats, setUserChats] = useState([]);
    const [userPdfs, setUserPdfs] = useState([]);
   
    const [banReason, setBanReason] = useState('');
    const [banModal, setBanModal] = useState(false);
    const [actionUser, setActionUser] = useState(null);
    const [panelTab,  setPanelTab]  = useState('info');
const [panelLoad, setPanelLoad] = useState(false);
const [chatPage, setChatPage] = useState(1);
const [expandedChat, setExpandedChat] = useState(null);


    // ✅ NEW: logs state
    const [aiLogs, setAiLogs] = useState([]);
    const [pdfLogs, setPdfLogs] = useState([]);
    const [logsTab, setLogsTab] = useState(null);
    const [logsLoad, setLogsLoad] = useState(false);


    const PERPAGE = 5;
    const token = localStorage.getItem('token');
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
        fetchLogs();  // ✅ NEW
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await getDashboard(token);
            setData(res);
        } catch {
            setError('Cannot load dashboard');
        } finally {
            setLoading(false);
        }
    };

    // ✅ NEW: fetch both logs
    const fetchLogs = async () => {
        setLogsLoad(true);
        try {
            const [aiRes, pdfRes] = await Promise.all([
                getAiChatLogs(token),
                getPdfChatLogs(token),
            ]);
            if (aiRes.success) setAiLogs(aiRes.logs);
            if (pdfRes.success) setPdfLogs(pdfRes.logs);
        } catch {
            console.error('Failed to load logs');
        } finally {
            setLogsLoad(false);
        }
    };

    const handleLogout = async () => {
        await logoutUser(token);
        localStorage.clear();
        navigate('/login');
    };

    const handleStatus = async (phone, status) => {
        await updateUserStatus(phone, status, token);
        loadData();
        if (selectedUser?.phone === phone) setSelectedUser(prev => ({ ...prev, status }));
    };

    const handleDelete = async (phone) => {
        if (!window.confirm(`Delete user ${phone}?`)) return;
        await deleteUser(phone, token);
        setSelectedUser(null);
        loadData();
    };

    const handleView = async (phone) => {
        setDetailLoad(true);
        setPanelTab('info');   // ✅ reset to info tab
    setUserChats([]);      // ✅ clear old data
    setUserPdfs([]);       // ✅ clear old data
    setChatPage(1);  // ✅ reset chat page
    setExpandedChat(null);  // ✅ reset expanded chat
        const res = await getUserDetail(phone, token);
        setSelectedUser(res.user);
        setDetailLoad(false);
    };
    // for highlighted actions like ban/unban, reset OTP, view chats/pdfs

    const handleBan = async () => {
        const data = await banUser(actionUser.phone, banReason, token);
        if (data.success) {
            alert(`✅ User banned`);
            setBanModal(false);
            setBanReason('');
            loadData();
            if (selectedUser?.phone === actionUser.phone) {
                setSelectedUser(prev => ({ ...prev, isBanned: true }));
            }
        }
    };

    const handleUnban = async (phone) => {
        const data = await unbanUser(phone, token);
        if (data.success) {
            alert(`✅ User unbanned`);
            loadData();
            if (selectedUser?.phone === phone) {
                setSelectedUser(prev => ({ ...prev, isBanned: false }));
            }
        }
    };

    const handleResetOtp = async (phone) => {
        if (!window.confirm(`Reset OTP for ${phone}?`)) return;
        const data = await resetUserOtp(phone, token);
        alert(data.success ? '✅ OTP reset successfully' : '❌ Failed to reset OTP');
    };

    const handleViewChats = async (userId) => {
        const data = await getUserChats(userId, token);
        if (data.success) {
            setUserChats(data.chats);
            setChatsModal(true);
        }
    };

    const handleViewPdfs = async (userId) => {
        const data = await getUserPdfs(userId, token);
        if (data.success) {
            setUserPdfs(data.pdfs);
            setPdfsModal(true);
        }
    };
    const handlePanelTab = async (tab) => {
    setPanelTab(tab);

    if (tab === 'chats' && userChats.length === 0) {
        setPanelLoad(true);
        const data = await getUserChats(selectedUser._id, token);
        if (data.success) setUserChats(data.chats);
        setPanelLoad(false);
    }

    if (tab === 'pdfs' && userPdfs.length === 0) {
        setPanelLoad(true);
        const data = await getUserPdfs(selectedUser._id, token);
        if (data.success) setUserPdfs(data.pdfs);
        setPanelLoad(false);
    }
};

    const exportCSV = () => {
        const headers = ['Phone', 'Name', 'Email', 'Role', 'Status', 'Joined'];
        const rows = data.users.map(u => [
            u.phone, u.name || '', u.email || '',
            u.role, u.status, u.createdAt?.slice(0, 10) || ''
        ]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'users.csv';
        a.click();
    };

    if (loading) return (
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
            <div className="text-center">
                <div className="spinner-border text-primary mb-3" />
                <p className="text-muted">Loading dashboard...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="container mt-5">
            <div className="alert alert-danger">{error}</div>
        </div>
    );

    const filtered = data.users.filter(u => {
        if (filter !== 'all' && u.status !== filter) return false;
        if (roleFilter !== 'all' && u.role !== roleFilter) return false;
        if (search && !u.phone.includes(search) &&
            !(u.name || '').toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const totalPages = Math.ceil(filtered.length / PERPAGE);
    const paginated = filtered.slice((page - 1) * PERPAGE, page * PERPAGE);

    const metrics = [
        { label: 'Total', value: data.metrics.total, color: 'primary', cls: 'all' },
        { label: 'Pending', value: data.metrics.pending, color: 'warning', cls: 'pending' },
        { label: 'Approved', value: data.metrics.approved, color: 'success', cls: 'approved' },
        { label: 'Rejected', value: data.metrics.rejected, color: 'danger', cls: 'rejected' },
    ];

    return (
        <div className="dashboard-page">

            {/* ── Navbar ── */}
            <nav className="navbar dashboard-navbar">
                <span className="navbar-brand">🛡️ Admin Dashboard</span>
                <div className="d-flex align-items-center gap-2">
                    <span className="nav-user-info">
                        👤 {localStorage.getItem('name') || localStorage.getItem('phone')}
                    </span>
                    <button className="btn btn-sm btn-outline-light" onClick={() => navigate('/profile')}>
                        <i className="bi bi-person me-1" />Profile
                    </button>
                    {/* <button className="btn btn-sm btn-outline-warning" onClick={() => navigate('/chat')}>
                        <i className="bi bi-chat-dots me-1" />AI Chat
                    </button> */}
                    <button className="btn btn-sm btn-outline-light" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right me-1" />Logout
                    </button>
                </div>
            </nav>

            <div className="container-fluid px-4 py-4">

                {/* ── Metric Cards ── */}
                <div className="row mb-4">
                    {metrics.map(m => (
                        <div className="col-6 col-md-3 mb-3" key={m.label}>
                            <div
                                className={`card metric-card ${m.cls}`}
                                onClick={() => { setFilter(m.cls); setPage(1); }}
                            >
                                <div className="card-body text-center py-3">
                                    <div className={`metric-value text-${m.color}`}>{m.value}</div>
                                    <div className="metric-label">{m.label}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="row">

                    {/* ── Table Column ── */}
                    <div className={selectedUser ? 'col-md-7' : 'col-12'}>

                        {/* Filter Bar */}
                        <div className="filter-bar d-flex gap-2 flex-wrap align-items-center">
                            <input
                                className="form-control"
                                style={{ maxWidth: 220 }}
                                placeholder="🔍 Search phone or name..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            />
                            <select
                                className="form-select"
                                style={{ maxWidth: 140 }}
                                value={filter}
                                onChange={(e) => { setFilter(e.target.value); setPage(1); }}
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                            <select
                                className="form-select"
                                style={{ maxWidth: 130 }}
                                value={roleFilter}
                                onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                            >
                                <option value="all">All Roles</option>
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                            <button className="btn btn-outline-secondary" onClick={loadData} title="Refresh">
                                <i className="bi bi-arrow-clockwise" />
                            </button>
                            <button className="btn btn-outline-success export-btn ms-auto" onClick={exportCSV}>
                                <i className="bi bi-download me-1" />Export CSV
                            </button>
                        </div>

                        {/* Result count */}
                        <p className="result-count mb-2">
                            Showing {paginated.length} of {filtered.length} users
                            {filter !== 'all' && ` — filtered by: ${filter}`}
                        </p>

                        {/* Table */}
                        <div className="users-table-wrap">
                            <div className="table-responsive">
                                <table className="table users-table table-hover align-middle">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Phone</th>
                                            <th>Name</th>
                                            <th>Role</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginated.length === 0 ? (
                                            <tr className="empty-row">
                                                <td colSpan="6" className="text-center py-4">
                                                    <i className="bi bi-inbox fs-4 d-block mb-2 text-muted" />
                                                    No users found
                                                </td>
                                            </tr>
                                        ) : paginated.map((u, i) => (
                                            <tr key={u.phone} className={selectedUser?.phone === u.phone ? 'row-active' : ''}>
                                                <td className="text-muted">{(page - 1) * PERPAGE + i + 1}</td>
                                                <td className="phone-cell">{u.phone}</td>
                                                <td>{u.name || <span className="text-muted">—</span>}</td>
                                                <td>
                                                    <span className={`role-badge badge bg-${u.role === 'admin' ? 'danger' : 'secondary'}`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`status-badge badge bg-${u.status === 'approved' ? 'success' :
                                                            u.status === 'pending' ? 'warning' : 'danger'
                                                        }`}>
                                                        {u.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-1 flex-wrap">
                                                        <button className="btn btn-sm btn-info text-white action-btn" onClick={() => handleView(u.phone)}>
                                                            <i className="bi bi-eye me-1" />View
                                                        </button>
                                                        {u.status === 'pending' && (
                                                            <>
                                                                <button className="btn btn-sm btn-success action-btn" onClick={() => handleStatus(u.phone, 'approved')}>
                                                                    <i className="bi bi-check-lg" />
                                                                </button>
                                                                <button className="btn btn-sm btn-warning action-btn" onClick={() => handleStatus(u.phone, 'rejected')}>
                                                                    <i className="bi bi-x-lg" />
                                                                </button>
                                                            </>
                                                        )}
                                                        <button className="btn btn-sm btn-danger action-btn" onClick={() => handleDelete(u.phone)}>
                                                            <i className="bi bi-trash3" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="pagination-wrap d-flex justify-content-between align-items-center">
                                    <small className="text-muted">Page {page} of {totalPages}</small>
                                    <div className="d-flex gap-1">
                                        <button className="btn btn-sm btn-outline-secondary" onClick={() => setPage(1)} disabled={page === 1}>«</button>
                                        <button className="btn btn-sm btn-outline-secondary" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                            <button
                                                key={p}
                                                className={`btn btn-sm ${page === p ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                onClick={() => setPage(p)}
                                            >{p}</button>
                                        ))}
                                        <button className="btn btn-sm btn-outline-secondary" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>›</button>
                                        <button className="btn btn-sm btn-outline-secondary" onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── User Detail Panel ── */}
                    {/* ── User Detail Panel ── */}
{selectedUser && (
    <div className="col-md-5">
        <div className="card detail-card">
            <div className="card-body">

                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="detail-header">
                        <i className="bi bi-person-circle me-2 text-primary" />User Detail
                    </span>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedUser(null)}>
                        <i className="bi bi-x-lg" />
                    </button>
                </div>

                {detailLoad ? (
                    <div className="text-center py-4">
                        <div className="spinner-border spinner-border-sm text-primary" />
                    </div>
                ) : (
                    <>
                        {/* Avatar */}
                        <div className="text-center mb-3">
                            {selectedUser.profilePicture ? (
                                <img
                                    src={`http://localhost:3000/${selectedUser.profilePicture}`}
                                    alt="Profile"
                                    className="detail-avatar-img"
                                />
                            ) : (
                                <div className="detail-avatar-placeholder">
                                    {selectedUser.name ? selectedUser.name[0].toUpperCase() : '?'}
                                </div>
                            )}
                            <div className="detail-name">{selectedUser.name || '—'}</div>
                            <div className="detail-phone">{selectedUser.phone}</div>
                            {selectedUser.isBanned && (
                                <span className="badge bg-danger mt-1">🚫 Banned</span>
                            )}
                        </div>

                        {/* ── Panel Tabs ── */}
                        <div className="btn-group w-100 mb-3" role="group">
                            {['info', 'activity', 'chats', 'pdfs'].map(tab => (
                                <button
                                    key={tab}
                                    className={`btn btn-sm ${panelTab === tab ? 'btn-primary' : 'btn-outline-secondary'}`}
                                    onClick={() => handlePanelTab(tab)}
                                >
                                    {tab === 'info'     && '👤 Info'}
                                    {tab === 'activity' && '📋 Activity'}
                                    {tab === 'chats'    && '💬 Chats'}
                                    {tab === 'pdfs'     && '📄 PDFs'}
                                </button>
                            ))}
                        </div>

                        {/* ── Tab: Info ── */}
                        {panelTab === 'info' && (
                            <>
                                {[
                                    { label: 'Phone',   value: selectedUser.phone   },
                                    { label: 'Name',    value: selectedUser.name    },
                                    { label: 'Email',   value: selectedUser.email   },
                                    { label: 'Address', value: selectedUser.address },
                                    { label: 'Gender',  value: selectedUser.gender  },
                                    { label: 'Role',    value: selectedUser.role    },
                                    { label: 'Status',  value: selectedUser.status  },
                                    { label: 'Joined',  value: selectedUser.createdAt?.slice(0,10) },
                                ].map(f => (
                                    <div className="detail-row" key={f.label}>
                                        <span className="detail-label">{f.label}</span>
                                        <span className="detail-value">{f.value || '—'}</span>
                                    </div>
                                ))}

                                {selectedUser.isBanned && (
                                    <div className="alert alert-danger mt-2 py-1 px-2" style={{ fontSize: '0.8rem' }}>
                                        🚫 {selectedUser.banReason}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="d-flex gap-2 mt-3 flex-wrap">
                                    {selectedUser.status === 'pending' && (
                                        <>
                                            <button className="btn btn-success btn-sm" onClick={() => handleStatus(selectedUser.phone, 'approved')}>
                                                <i className="bi bi-check-lg me-1" />Approve
                                            </button>
                                            <button className="btn btn-warning btn-sm" onClick={() => handleStatus(selectedUser.phone, 'rejected')}>
                                                <i className="bi bi-x-lg me-1" />Reject
                                            </button>
                                        </>
                                    )}
                                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selectedUser.phone)}>
                                        <i className="bi bi-trash3 me-1" />Delete
                                    </button>
                                    <button className="btn btn-outline-secondary btn-sm" onClick={() => handleResetOtp(selectedUser.phone)}>
                                        <i className="bi bi-arrow-counterclockwise me-1" />Reset OTP
                                    </button>
                                    {selectedUser.isBanned ? (
                                        <button className="btn btn-success btn-sm" onClick={() => handleUnban(selectedUser.phone)}>
                                            <i className="bi bi-unlock me-1" />Unban
                                        </button>
                                    ) : (
                                        <button className="btn btn-danger btn-sm" onClick={() => { setActionUser(selectedUser); setBanModal(true); }}>
                                            <i className="bi bi-slash-circle me-1" />Ban
                                        </button>
                                    )}
                                </div>
                            </>
                        )}

                        {/* ── Tab: Activity ── */}
                        {panelTab === 'activity' && (
                            <>
                                <div className="activity-title">
                                    <i className="bi bi-clock-history me-1" />Activity Log
                                </div>
                                {selectedUser.activityLog?.length ? (
                                    <div className="activity-log">
                                        {[...selectedUser.activityLog].reverse().slice(0, 10).map((log, i) => (
                                            <div key={i} className="activity-row">
                                                <span className={`badge bg-${
                                                    log.action === 'login'       ? 'success' :
                                                    log.action === 'otp_request' ? 'primary' :
                                                    log.action === 'otp_failed'  ? 'warning' : 'secondary'
                                                }`}>
                                                    {log.action}
                                                </span>
                                                <span className="activity-time">
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted" style={{ fontSize: 12 }}>No activity yet</p>
                                )}
                            </>
                        )}

               {userChats.slice((chatPage - 1) * 5, chatPage * 5).map((chat, i) => (
    <div key={i} className="mb-2 border border-secondary rounded p-2">
        <div className="d-flex justify-content-between">
            <span className="badge bg-primary">{chat.aiModel || 'sarvam'}</span>
            <div className="d-flex gap-1 align-items-center">
                <small className="text-muted" style={{ fontSize: '10px' }}>
                    {new Date(chat.updatedAt).toLocaleDateString()}
                </small>
                {/* ✅ Toggle button */}
                <button
                    className="btn btn-xs btn-outline-secondary"
                    style={{ fontSize: '10px', padding: '1px 6px' }}
                    onClick={() => setExpandedChat(expandedChat === i ? null : i)}
                >
                    {expandedChat === i ? '▲ Hide' : '▼ All'}
                </button>
            </div>
        </div>

        {/* ── Collapsed: show first message only ── */}
        {expandedChat !== i && (
            <small className="d-block mt-1" style={{ fontSize: '11px' }}>
                🧑 {chat.messages[0]?.content}
            </small>
        )}

        {/* ── Expanded: show ALL messages ── */}
        {expandedChat === i && (
            <div className="mt-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {chat.messages.map((msg, j) => (
                    <div key={j} className={`mb-2 ${msg.role === 'user' ? 'text-end' : 'text-start'}`}>
                        <span className={`badge ${msg.role === 'user' ? 'bg-primary' : 'bg-secondary'} me-1`}>
                            {msg.role === 'user' ? '🧑' : '🤖'}
                        </span>
                        <small style={{ fontSize: '11px' }}>{msg.content}</small>
                    </div>
                ))}
            </div>
        )}

        <small className="text-muted" style={{ fontSize: '10px' }}>
            {chat.messages.length} messages
        </small>
    </div>
))}
                        {/* ── Tab: PDFs ── */}
                        {panelTab === 'pdfs' && (
                            <>
                                {panelLoad ? (
                                    <div className="text-center py-3">
                                        <div className="spinner-border spinner-border-sm text-primary" />
                                    </div>
                                ) : userPdfs.length === 0 ? (
                                    <p className="text-muted text-center py-3">No PDFs found</p>
                                ) : userPdfs.map((pdf, i) => (
                                    <div key={i} className="mb-3 border border-secondary rounded p-2">
                                        <div className="d-flex justify-content-between mb-1">
                                            <span><i className="bi bi-file-earmark-pdf text-danger me-1" />{pdf.filename}</span>
                                            <small className="text-muted">{new Date(pdf.createdAt).toLocaleString()}</small>
                                        </div>
                                        <small className="text-muted">{pdf.chunks?.length} chunks · {pdf.chatHistory?.length} Q&As</small>
                                        {pdf.chatHistory?.slice(0, 2).map((h, j) => (
                                            <div key={j} className="mt-1 border-top border-secondary pt-1">
                                                <small className="text-info">Q: {h.question}</small><br />
                                                <small className="text-muted">A: {h.answer?.substring(0, 80)}...</small>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    </div>
)}
                </div>

                {/* ── Activity Logs ── */}

                <div className="mt-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">📋 Activity Logs</h5>
                        <button className="btn btn-sm btn-outline-secondary" onClick={fetchLogs}>
                            <i className="bi bi-arrow-clockwise" /> Refresh
                        </button>
                    </div>
                    <div className="d-flex gap-2">
                        <button
                            className="btn btn-primary"
                            onClick={() => setLogsTab('ai')}
                        >
                            🤖 AI Chat Logs ({aiLogs.length})
                        </button>
                        <button
                            className="btn btn-warning text-dark"
                            onClick={() => setLogsTab('pdf')}
                        >
                            📄 PDF Chat Logs ({pdfLogs.length})
                        </button>
                    </div>
                </div>

                {/* ── Floating AI Chat Button ── */}
                <div className="text-center mt-4 mb-4 d-flex justify-content-center gap-3 flex-wrap">
                    <button
                        className="btn btn-lg px-5 py-3"
                        onClick={() => navigate('/chat')}
                        style={{
                            background: 'linear-gradient(135deg, #7c6af7, #c084fc)',
                            border: 'none',
                            borderRadius: '50px',
                            color: 'white',
                            fontWeight: '700',
                            fontSize: '16px',
                            boxShadow: '0 8px 24px rgba(124,106,247,0.4)',
                        }}
                    >
                        <i className="bi bi-chat-dots-fill me-2" />
                        Open AI Chat
                    </button>
                    <button
                        className="btn btn-lg px-5 py-3"
                        onClick={() => navigate('/pdf-chat')}
                        style={{
                            background: 'linear-gradient(135deg, #f97316, #ef4444)',
                            border: 'none',
                            borderRadius: '50px',
                            color: 'white',
                            fontWeight: '700',
                            fontSize: '16px',
                            boxShadow: '0 8px 24px rgba(239,68,68,0.4)',
                        }}
                    >
                        <i className="bi bi-file-earmark-pdf-fill me-2" />
                        PDF Chat
                    </button>
                </div>
            </div>
            {/* ── Logs Modal ── */}
            {logsTab && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(225, 224, 224, 0.7)' }}>
                    <div className="modal-dialog modal-xl modal-dialog-scrollable">
                        <div className="modal-content bg-dark text-white">

                            {/* Modal Header */}
                            <div className="modal-header border-secondary">
                                <h5 className="modal-title">
                                    {logsTab === 'ai' ? '🤖 AI Chat Logs' : '📄 PDF Chat Logs'}
                                </h5>
                                <button
                                    className="btn-close btn-close-white"
                                    onClick={() => setLogsTab(null)}
                                />
                            </div>

                            {/* Modal Body */}
                            <div className="modal-body">

                                {logsLoad && (
                                    <div className="text-center py-3">
                                        <div className="spinner-border spinner-border-sm text-primary" />
                                    </div>
                                )}

                                {/* AI Chat Logs */}
                                

                                {/* PDF Chat Logs */}
                                
                            </div>

                            {/* Modal Footer */}
                            <div className="modal-footer border-secondary">
                                <small className="text-muted me-auto" style={{ color: 'rgba(255,255,255,0.7)' }}>
                                    {logsTab === 'ai' ? `${aiLogs.length} logs` : `${pdfLogs.length} logs`}
                                </small>
                                <button className="btn btn-sm btn-outline-secondary" onClick={fetchLogs}>
                                    <i className="bi bi-arrow-clockwise me-1" />Refresh
                                </button>
                                <button className="btn btn-sm btn-secondary" onClick={() => setLogsTab(null)}>
                                    Close
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            )}
            {/* ── Ban Modal ── */}
{banModal && (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
        <div className="modal-dialog">
            <div className="modal-content bg-dark text-white">
                <div className="modal-header border-secondary">
                    <h5 className="modal-title">🚫 Ban User — {actionUser?.phone}</h5>
                    <button className="btn-close btn-close-white" onClick={() => setBanModal(false)} />
                </div>
                <div className="modal-body">
                    <label className="form-label">Reason for ban</label>
                    <input
                        className="form-control bg-dark text-white border-secondary"
                        placeholder="e.g. Spam, abuse, etc."
                        value={banReason}
                        onChange={(e) => setBanReason(e.target.value)}
                    />
                </div>
                <div className="modal-footer border-secondary">
                    <button className="btn btn-secondary btn-sm" onClick={() => setBanModal(false)}>Cancel</button>
                    <button className="btn btn-danger btn-sm" onClick={handleBan}>Confirm Ban</button>
                </div>
            </div>
        </div>
    </div>
)}

{/* ── User Chats Modal ── */}

{/* ── User PDFs Modal ── */}

        </div>
    );
}

export default Dashboard;