import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard, updateUserStatus, deleteUser, getUserDetail, logoutUser } from '../services/api';

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

    const PERPAGE  = 5; // users per page
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
        if (selectedUser?.phone === phone) {
            setSelectedUser(prev => ({ ...prev, status }));
        }
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

    // ── Export CSV ────────────────────────────────────────
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
        <div className="container mt-5 text-center">
            <div className="spinner-border text-primary"></div>
            <p className="mt-2">Loading...</p>
        </div>
    );

    if (error) return (
        <div className="container mt-5">
            <div className="alert alert-danger">{error}</div>
        </div>
    );

    // ── Filter + Search ───────────────────────────────────
    const filtered = data.users.filter(u => {
        if (filter     !== 'all' && u.status !== filter)   return false;
        if (roleFilter !== 'all' && u.role   !== roleFilter) return false;
        if (search && !u.phone.includes(search) &&
            !(u.name || '').toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    // ── Pagination ────────────────────────────────────────
    const totalPages = Math.ceil(filtered.length / PERPAGE);
    const paginated  = filtered.slice((page - 1) * PERPAGE, page * PERPAGE);

    return (
        <div>
            {/* Navbar */}
            <nav className="navbar navbar-dark bg-dark px-4">
                <span className="navbar-brand mb-0 h1">Admin Dashboard</span>
                <div className="d-flex align-items-center gap-3">
                    <span className="text-white" style={{ fontSize:'14px' }}>
                        👤 {localStorage.getItem('phone')}
                    </span>
                    <button className="btn btn-outline-warning btn-sm" onClick={() => navigate('/profile')}>
                        Profile
                    </button>
                    <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
                        Logout
                    </button>
                    <button  className="btn btn-outline-light btn-sm" onClick={() => navigate('/chat')}>
  Open AI Chat
</button>
                </div>
            </nav>

            <div className="container-fluid mt-4 px-4">

                {/* Metrics */}
                <div className="row mb-4">
                    {[
                        { label:'Total',    value: data.metrics.total,    color:'primary' },
                        { label:'Pending',  value: data.metrics.pending,  color:'warning' },
                        { label:'Approved', value: data.metrics.approved, color:'success' },
                        { label:'Rejected', value: data.metrics.rejected, color:'danger'  },
                    ].map(m => (
                        <div className="col-6 col-md-3 mb-3" key={m.label}>
                            <div
                                className={`card border-${m.color} text-center`}
                                style={{ cursor:'pointer' }}
                                onClick={() => { setFilter(m.label.toLowerCase()); setPage(1); }}
                            >
                                <div className="card-body py-3">
                                    <h2 className={`text-${m.color} mb-0`}>{m.value}</h2>
                                    <small className="text-muted">{m.label}</small>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="row">

                    {/* Table */}
                    <div className={selectedUser ? 'col-md-7' : 'col-12'}>

                        {/* Search + Filter bar */}
                        <div className="d-flex gap-2 mb-3 flex-wrap align-items-center">
                            <input
                                className="form-control"
                                style={{ maxWidth:'220px' }}
                                placeholder="Search phone or name..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            />
                            <select
                                className="form-select"
                                style={{ maxWidth:'130px' }}
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
                                style={{ maxWidth:'120px' }}
                                value={roleFilter}
                                onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                            >
                                <option value="all">All Roles</option>
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                            <button className="btn btn-outline-secondary" onClick={loadData}>
                                ↻
                            </button>
                            <button className="btn btn-outline-success ms-auto" onClick={exportCSV}>
                                ↓ Export CSV
                            </button>
                        </div>

                        {/* Result count */}
                        <p className="text-muted small mb-2">
                            Showing {paginated.length} of {filtered.length} users
                            {filter !== 'all' && ` — filtered by: ${filter}`}
                        </p>

                        {/* Table */}
                        <div className="table-responsive">
                            <table className="table table-bordered table-hover align-middle">
                                <thead className="table-dark">
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
                                        <tr>
                                            <td colSpan="6" className="text-center text-muted py-3">
                                                No users found
                                            </td>
                                        </tr>
                                    ) : paginated.map((u, i) => (
                                        <tr key={u.phone} className={selectedUser?.phone === u.phone ? 'table-active' : ''}>
                                            <td className="text-muted small">{(page-1)*PERPAGE + i + 1}</td>
                                            <td style={{ fontFamily:'monospace' }}>{u.phone}</td>
                                            <td>{u.name || <span className="text-muted">—</span>}</td>
                                            <td>
                                                <span className={`badge bg-${u.role === 'admin' ? 'danger' : 'secondary'}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge bg-${
                                                    u.status === 'approved' ? 'success' :
                                                    u.status === 'pending'  ? 'warning' : 'danger'
                                                }`}>
                                                    {u.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="d-flex gap-1 flex-wrap">
                                                    <button className="btn btn-sm btn-info text-white" onClick={() => handleView(u.phone)}>
                                                        View
                                                    </button>
                                                    {u.status === 'pending' && (
                                                        <>
                                                            <button className="btn btn-sm btn-success" onClick={() => handleStatus(u.phone, 'approved')}>
                                                                ✓
                                                            </button>
                                                            <button className="btn btn-sm btn-warning" onClick={() => handleStatus(u.phone, 'rejected')}>
                                                                ✗
                                                            </button>
                                                        </>
                                                    )}
                                                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u.phone)}>
                                                        🗑
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
                            <div className="d-flex justify-content-between align-items-center mt-2">
                                <small className="text-muted">
                                    Page {page} of {totalPages}
                                </small>
                                <div className="d-flex gap-1">
                                    <button
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() => setPage(1)}
                                        disabled={page === 1}
                                    >
                                        «
                                    </button>
                                    <button
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() => setPage(p => p - 1)}
                                        disabled={page === 1}
                                    >
                                        ‹
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                        <button
                                            key={p}
                                            className={`btn btn-sm ${page === p ? 'btn-primary' : 'btn-outline-secondary'}`}
                                            onClick={() => setPage(p)}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                    <button
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() => setPage(p => p + 1)}
                                        disabled={page === totalPages}
                                    >
                                        ›
                                    </button>
                                    <button
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() => setPage(totalPages)}
                                        disabled={page === totalPages}
                                    >
                                        »
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* User Detail Panel */}
                    {selectedUser && (
                        <div className="col-md-5">
                            <div className="card shadow-sm">
                                <div className="card-body p-4">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h5 className="mb-0">User Detail</h5>
                                        <button className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedUser(null)}>
                                            ✕
                                        </button>
                                    </div>

                                    {detailLoad ? (
                                        <div className="text-center py-3">
                                            <div className="spinner-border spinner-border-sm"></div>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="text-center mb-3">
            {selectedUser.profilePicture ? (
                <img
                    src={`http://localhost:3000/${selectedUser.profilePicture}`}
                    alt="Profile"
                    style={{
                        width: '80px', height: '80px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '3px solid #dee2e6'
                    }}
                />
            ) : (
                <div style={{
                    width: '80px', height: '80px',
                    borderRadius: '50%',
                    background: '#0d6efd',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem', color: '#fff',
                    margin: '0 auto'
                }}>
                    {selectedUser.name ? selectedUser.name[0].toUpperCase() : '?'}
                </div>
            )}
            <h6 className="mt-2 mb-0">{selectedUser.name || '—'}</h6>
            <small className="text-muted">{selectedUser.phone}</small>
        </div>
                                            {[
                                                { label:'Phone',   value: selectedUser.phone   },
                                                { label:'Name',    value: selectedUser.name    },
                                                { label:'Email',   value: selectedUser.email   },
                                                { label:'Address', value: selectedUser.address },
                                                { label:'Gender',  value: selectedUser.gender  },
                                                { label:'Role',    value: selectedUser.role    },
                                                { label:'Status',  value: selectedUser.status  },
                                                { label:'Joined',  value: selectedUser.createdAt?.slice(0,10) },
                                            ].map(f => (
                                                <div className="d-flex justify-content-between border-bottom py-2" key={f.label}>
                                                    <span className="text-muted small">{f.label}</span>
                                                    <span className="fw-bold small">{f.value || '—'}</span>
                                                </div>
                                            ))}

                                            {/* Activity Log */}
                                            <h6 className="mt-3 mb-2">Activity Log</h6>
                                            {selectedUser.activityLog?.length ? (
                                                <div style={{ maxHeight:'180px', overflowY:'auto' }}>
                                                    {[...selectedUser.activityLog].reverse().slice(0,10).map((log, i) => (
                                                        <div key={i} className="d-flex justify-content-between border-bottom py-1">
                                                            <span className={`badge bg-${
                                                                log.action === 'login'       ? 'success' :
                                                                log.action === 'otp_request' ? 'primary' :
                                                                log.action === 'otp_failed'  ? 'warning' :
                                                                'secondary'
                                                            }`}>
                                                                {log.action}
                                                            </span>
                                                            <small className="text-muted">
                                                                {new Date(log.timestamp).toLocaleString()}
                                                            </small>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-muted small">No activity yet</p>
                                            )}

                                            {/* Actions */}
                                            <div className="d-flex gap-2 mt-3">
                                                {selectedUser.status === 'pending' && (
                                                    <>
                                                        <button className="btn btn-success btn-sm" onClick={() => handleStatus(selectedUser.phone, 'approved')}>
                                                            Approve
                                                        </button>
                                                        <button className="btn btn-warning btn-sm" onClick={() => handleStatus(selectedUser.phone, 'rejected')}>
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selectedUser.phone)}>
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;