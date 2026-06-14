// src/pages/Profile.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateProfile, logoutUser, uploadPicture } from '../services/api';
// import './Profile.css';

function Profile() {
    const [user,      setUser]      = useState(null);
    const [form,      setForm]      = useState({ name:'', email:'', address:'', gender:'' });
    const [loading,   setLoading]   = useState(true);
    const [saving,    setSaving]    = useState(false);
    const [message,   setMessage]   = useState('');
    const [error,     setError]     = useState('');
    const [editing,   setEditing]   = useState(false);
    const [uploading, setUploading] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');

    const token    = localStorage.getItem('token');
    const role     = localStorage.getItem('role');
    const navigate = useNavigate();

    useEffect(() => {
        getProfile(token)
            .then(data => {
                setUser(data);
                setForm({
                    name:    data.name    || '',
                    email:   data.email   || '',
                    address: data.address || '',
                    gender:  data.gender  || '',
                });
                setLoading(false);
            })
            .catch(() => { setError('Cannot load profile'); setLoading(false); });
    }, []);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleUpdate = async () => {
        setSaving(true); setError(''); setMessage('');
        const data = await updateProfile(form, token);
        if (data.user) {
            setUser(data.user);
            setMessage('Profile updated!');
            setEditing(false);
        } else {
            setError(data.error || 'Update failed');
        }
        setSaving(false);
    };

    const handleLogout = async () => {
        await logoutUser(token);
        localStorage.clear();
        navigate('/login');
    };

    const handlePicture = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const data = await uploadPicture(file, token);
        if (data.user) { setUser(data.user); setMessage('Picture updated!'); }
        else setError(data.error || 'Upload failed');
        setUploading(false);
    };

    if (loading) return (
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight:'100vh' }}>
            <div className="text-center">
                <div className="spinner-border text-primary mb-3" />
                <p className="text-muted">Loading profile...</p>
            </div>
        </div>
    );

    if (!user) return (
        <div className="container mt-5">
            <div className="alert alert-danger">Could not load profile. Please login again.</div>
        </div>
    );

    return (
        <div className="profile-page">

            {/* ── Navbar ── */}
            <nav className="navbar profile-navbar">
                <span className="navbar-brand">👤 My Profile</span>
                <div className="d-flex align-items-center gap-2">
                    <span className="nav-user-info">{user.phone}</span>
                    <span className={`badge bg-${role === 'admin' ? 'danger' : 'primary'}`}>{role}</span>
                    {/* <button className="btn btn-sm btn-outline-light" onClick={() => navigate('/chat')}>
                        <i className="bi bi-chat-dots me-1" />AI Chat
                    </button> */}
                    {role === 'admin' && (
                        <button className="btn btn-sm btn-outline-warning" onClick={() => navigate('/dashboard')}>
                            <i className="bi bi-speedometer2 me-1" />Dashboard
                        </button>
                    )}
                    <button className="btn btn-sm btn-outline-light" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right me-1" />Logout
                    </button>
                </div>
            </nav>

            <div className="container mt-4">
                <div className="row justify-content-center">
                    <div className="col-md-7">
                        <div className="card profile-card">
                            <div className="card-body">

                                {/* ── Avatar ── */}
                                <div className="text-center mb-4">
                                    <div className="avatar-wrap">
                                        {user.profilePicture ? (
                                            <img
                                                // src={`http://localhost:3000/${user.profilePicture}`}
                                                src={`${import.meta.env.VITE_API_URL}/${user.profilePicture}`}
                                                alt="Profile"
                                                className="avatar-img"
                                                onError={(e) => { e.target.style.display='none'; }}
                                            />
                                        ) : (
                                            <div className="avatar-placeholder">
                                                {user.name ? user.name[0].toUpperCase() : '?'}
                                            </div>
                                        )}
                                        <label className="avatar-upload-btn" title="Change picture">
                                            {uploading
                                                ? <i className="bi bi-hourglass-split" />
                                                : <i className="bi bi-camera-fill" />}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handlePicture}
                                                style={{ display:'none' }}
                                            />
                                        </label>
                                    </div>
                                    <div className="profile-name">{user.name || 'No name yet'}</div>
                                    <div className="d-flex justify-content-center gap-2">
                                        <span className={`badge bg-${role === 'admin' ? 'danger' : 'primary'}`}>{role}</span>
                                        <span className={`badge bg-${user.status === 'approved' ? 'success' : 'warning'}`}>{user.status}</span>
                                    </div>
                                </div>

                                {/* ── Alerts ── */}
                                {message && (
                                    <div className="alert alert-success profile-alert">
                                        <i className="bi bi-check-circle me-2" />{message}
                                    </div>
                                )}
                                {error && (
                                    <div className="alert alert-danger profile-alert">
                                        <i className="bi bi-exclamation-circle me-2" />{error}
                                    </div>
                                )}

                                {/* ── Tabs ── */}
                                <ul className="nav profile-tabs">
                                    <li className="nav-item">
                                        <button
                                            className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                                            onClick={() => setActiveTab('profile')}
                                        >
                                            <i className="bi bi-person me-1" />Profile
                                        </button>
                                    </li>
                                    <li className="nav-item">
                                        <button
                                            className={`nav-link ${activeTab === 'activity' ? 'active' : ''}`}
                                            onClick={() => setActiveTab('activity')}
                                        >
                                            <i className="bi bi-clock-history me-1" />Activity Log
                                        </button>
                                    </li>
                                </ul>

                                {/* ── Profile Tab ── */}
                                {activeTab === 'profile' && (
                                    !editing ? (
                                        <div>
                                            {[
                                                { label:'Phone',   value: user.phone   },
                                                { label:'Email',   value: user.email   },
                                                { label:'Address', value: user.address },
                                                { label:'Gender',  value: user.gender  },
                                                { label:'Joined',  value: user.createdAt?.slice(0,10) },
                                            ].map(f => (
                                                <div className="profile-field" key={f.label}>
                                                    <span className="field-label">{f.label}</span>
                                                    <span className="field-value">{f.value || '—'}</span>
                                                </div>
                                            ))}
                                            <button className="btn edit-btn w-100 mt-3" onClick={() => setEditing(true)}>
                                                <i className="bi bi-pencil-square me-2" />Edit Profile
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="edit-form">
                                            {['name','email','address'].map(field => (
                                                <div className="mb-3" key={field}>
                                                    <label className="form-label">{field}</label>
                                                    <input
                                                        className="form-control"
                                                        name={field}
                                                        value={form[field]}
                                                        onChange={handleChange}
                                                        placeholder={`Enter ${field}`}
                                                    />
                                                </div>
                                            ))}
                                            <div className="mb-3">
                                                <label className="form-label">Gender</label>
                                                <select className="form-select" name="gender" value={form.gender} onChange={handleChange}>
                                                    <option value="">Select gender</option>
                                                    <option value="male">Male</option>
                                                    <option value="female">Female</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>
                                            <div className="d-flex gap-2">
                                                <button className="btn save-btn w-50" onClick={handleUpdate} disabled={saving}>
                                                    {saving
                                                        ? <><i className="bi bi-hourglass-split me-1" />Saving...</>
                                                        : <><i className="bi bi-check-lg me-1" />Save</>}
                                                </button>
                                                <button className="btn btn-outline-secondary cancel-btn w-50" onClick={() => { setEditing(false); setError(''); }}>
                                                    <i className="bi bi-x-lg me-1" />Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )
                                )}

                                {/* ── Activity Log Tab ── */}
                                {activeTab === 'activity' && (
                                    user.activityLog?.length ? (
                                        <div className="activity-scroll">
                                            {[...user.activityLog].reverse().map((log, i) => (
                                                <div key={i} className="activity-item">
                                                    <span className={`badge bg-${
                                                        log.action === 'login'       ? 'success' :
                                                        log.action === 'otp_request' ? 'primary' :
                                                        log.action === 'otp_failed'  ? 'warning' :
                                                        log.action === 'logout'      ? 'secondary' : 'dark'
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
                                        <div className="text-center py-4">
                                            <i className="bi bi-clock-history fs-3 text-muted d-block mb-2" />
                                            <p className="text-muted">No activity yet</p>
                                        </div>
                                    )
                                )}

                            </div>
                        </div>
                    </div>
                </div>
                {/* ── Floating AI Chat Button ── */}
<div className="text-center mt-4 mb-4">
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
</div>
            </div>
        </div>
    );
}

export default Profile;