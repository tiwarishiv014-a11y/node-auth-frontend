// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard, updateUserStatus, deleteUser, getUserDetail, logoutUser } from '../services/api';
// import './Dashboard.css';
// import './App.css';

function Dashboard() {
    const [data,         setData]         = useState(null);
    const [loading,      setLoading]      = useState(true);
    const [error,        setError]        = useState('');
    const [search,       setSearch]       = useState('');
    const [filter,       setFilter]       = useState('all');
    const [roleFilter,   setRoleFilter]   = useState('all');
    const [page,         setPage]         = useState(1);
    const [selectedUser, setSelectedUser] = useState(null);
    const [detailLoad,   setDetailLoad]   = useState(false);

    const PERPAGE  = 5;
    const token    = localStorage.getItem('token');
    const navigate = useNavigate();

    useEffect(() => { loadData(); }, []);

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
        const res = await getUserDetail(phone, token);
        setSelectedUser(res.user);
        setDetailLoad(false);
    };

    const exportCSV = () => {
        const headers = ['Phone', 'Name', 'Email', 'Role', 'Status', 'Joined'];
        const rows    = data.users.map(u => [
            u.phone, u.name || '', u.email || '',
            u.role, u.status, u.createdAt?.slice(0,10) || ''
        ]);
        const csv  = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = 'users.csv';
        a.click();
    };

    if (loading) return (
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight:'100vh' }}>
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
        if (filter     !== 'all' && u.status !== filter)     return false;
        if (roleFilter !== 'all' && u.role   !== roleFilter) return false;
        if (search && !u.phone.includes(search) &&
            !(u.name || '').toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const totalPages = Math.ceil(filtered.length / PERPAGE);
    const paginated  = filtered.slice((page - 1) * PERPAGE, page * PERPAGE);

    const metrics = [
        { label: 'Total',    value: data.metrics.total,    color: 'primary', cls: 'total'    },
        { label: 'Pending',  value: data.metrics.pending,  color: 'warning', cls: 'pending'  },
        { label: 'Approved', value: data.metrics.approved, color: 'success', cls: 'approved' },
        { label: 'Rejected', value: data.metrics.rejected, color: 'danger',  cls: 'rejected' },
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
                                onClick={() => { setFilter(m.label.toLowerCase()); setPage(1); }}
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
                                                <td className="text-muted">{(page-1)*PERPAGE + i + 1}</td>
                                                <td className="phone-cell">{u.phone}</td>
                                                <td>{u.name || <span className="text-muted">—</span>}</td>
                                                <td>
                                                    <span className={`role-badge badge bg-${u.role === 'admin' ? 'danger' : 'secondary'}`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`status-badge badge bg-${
                                                        u.status === 'approved' ? 'success' :
                                                        u.status === 'pending'  ? 'warning' : 'danger'
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
                                        <button className="btn btn-sm btn-outline-secondary" onClick={() => setPage(p => p-1)} disabled={page === 1}>‹</button>
                                        {Array.from({ length: totalPages }, (_, i) => i+1).map(p => (
                                            <button
                                                key={p}
                                                className={`btn btn-sm ${page === p ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                onClick={() => setPage(p)}
                                            >{p}</button>
                                        ))}
                                        <button className="btn btn-sm btn-outline-secondary" onClick={() => setPage(p => p+1)} disabled={page === totalPages}>›</button>
                                        <button className="btn btn-sm btn-outline-secondary" onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

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
                                            </div>

                                            {/* Fields */}
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

                                            {/* Activity Log */}
                                            <div className="activity-title">
                                                <i className="bi bi-clock-history me-1" />Activity Log
                                            </div>
                                            {selectedUser.activityLog?.length ? (
                                                <div className="activity-log">
                                                    {[...selectedUser.activityLog].reverse().slice(0,10).map((log, i) => (
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
                                                <p className="text-muted" style={{ fontSize:12 }}>No activity yet</p>
                                            )}

                                            {/* Actions */}
                                            <div className="d-flex gap-2 mt-3">
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
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
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
            
        </div>
    );
}

export default Dashboard;