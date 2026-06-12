import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateProfile, logoutUser, uploadPicture } from '../services/api';

function Profile() {
    const [user,    setUser]    = useState(null);
    const [form,    setForm]    = useState({ name:'', email:'', address:'', gender:'' });
    const [loading, setLoading] = useState(true);
    const [saving,  setSaving]  = useState(false);
    const [message, setMessage] = useState('');
    const [error,   setError]   = useState('');
    const [editing, setEditing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [activeTab, setActiveTab] = useState('profile'); // profile | activity

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
                    gender:  data.gender  || ''
                });
                setLoading(false);
            })
            .catch(() => {
                setError('Cannot load profile');
                setLoading(false);
            });
    }, []);

    const handleChange  = (e) => setForm({ ...form, [e.target.name]: e.target.value });

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

    // ── Upload Picture ────────────────────────────────────
    const handlePicture = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const data = await uploadPicture(file, token);
        if (data.user) {
            setUser(data.user);
            setMessage('Picture updated!');
        } else {
            setError(data.error || 'Upload failed');
        }
        setUploading(false);
    };

    if (loading) return (
        <div className="container mt-5 text-center">
            <div className="spinner-border text-primary"></div>
        </div>
    );

    if (!user) return (
        <div className="container mt-5">
            <div className="alert alert-danger">Could not load profile. Please login again.</div>
        </div>
    );

    return (
        <div>
            {/* Navbar */}
            <nav className="navbar navbar-dark bg-dark px-4">
                <span className="navbar-brand mb-0 h1">My Profile</span>
                <div className="d-flex align-items-center gap-3">
                    <span className="text-white" style={{ fontSize: '14px' }}>
                        👤 {user.phone}
                        <span className={`badge bg-${role === 'admin' ? 'danger' : 'primary'} ms-2`}>
                            {role}
                        </span> 
                        

                    </span>
                    {role === 'admin' && (
                        <button className="btn btn-outline-warning btn-sm" onClick={() => navigate('/dashboard')}>
                            Dashboard
                        </button>
                    )}
                    <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </nav>

            <div className="container mt-4">
                <div className="row justify-content-center">
                    <div className="col-md-7">
                        <div className="card shadow">
                            <div className="card-body p-4">

                                {/* Avatar + Picture Upload */}
                                <div className="text-center mb-4">
                                    <div style={{ position: 'relative', display: 'inline-block' }}>
                                        {user.profilePicture ? (
                                            <img
                                                src={`http://localhost:3000/${user.profilePicture}`}
                                                alt="Profile"
                                                style={{ width:'90px', height:'90px', borderRadius:'50%', objectFit:'cover' }}
                                            />
                                        ) : (
                                            <div style={{
                                                width:'90px', height:'90px', borderRadius:'50%',
                                                background:'#0d6efd', display:'flex',
                                                alignItems:'center', justifyContent:'center',
                                                fontSize:'2rem', color:'#fff', margin:'0 auto'
                                            }}>
                                                {user.name ? user.name[0].toUpperCase() : '?'}
                                            </div>
                                        )}
                                        {/* Upload button over avatar */}
                                        <label style={{
                                            position:'absolute', bottom:0, right:0,
                                            background:'#0d6efd', borderRadius:'50%',
                                            width:'28px', height:'28px', display:'flex',
                                            alignItems:'center', justifyContent:'center',
                                            cursor:'pointer', color:'#fff', fontSize:'14px'
                                        }}>
                                            {uploading ? '...' : '📷'}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handlePicture}
                                                style={{ display:'none' }}
                                            />
                                        </label>
                                    </div>
                                    <h4 className="mt-2">{user.name || 'No name yet'}</h4>
                                    <span className={`badge bg-${role === 'admin' ? 'danger' : 'primary'} me-1`}>
                                        {role}
                                    </span>
                                    <span className={`badge bg-${user.status === 'approved' ? 'success' : 'warning'}`}>
                                        {user.status}
                                    </span>
                                </div>

                                {message && <div className="alert alert-success py-2">{message}</div>}
                                {error   && <div className="alert alert-danger  py-2">{error}</div>}

                                {/* Tabs */}
                                <ul className="nav nav-tabs mb-3">
                                    <li className="nav-item">
                                        <button
                                            className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                                            onClick={() => setActiveTab('profile')}
                                        >
                                            Profile
                                        </button>
                                    </li>
                                    <li className="nav-item">
                                        <button
                                            className={`nav-link ${activeTab === 'activity' ? 'active' : ''}`}
                                            onClick={() => setActiveTab('activity')}
                                        >
                                            Activity Log
                                        </button>
                                    </li>
                                </ul>

                                {/* ── Profile Tab ── */}
                                {activeTab === 'profile' && (
                                    <div>
                                        {!editing ? (
                                            <div>
                                                {[
                                                    { label:'Phone',   value: user.phone   },
                                                    { label:'Email',   value: user.email   },
                                                    { label:'Address', value: user.address },
                                                    { label:'Gender',  value: user.gender  },
                                                    { label:'Joined',  value: user.createdAt?.slice(0,10) },
                                                ].map(f => (
                                                    <div className="d-flex justify-content-between border-bottom py-2" key={f.label}>
                                                        <span className="text-muted">{f.label}</span>
                                                        <span className="fw-bold">{f.value || '—'}</span>
                                                    </div>
                                                ))}
                                                <button className="btn btn-primary w-100 mt-3" onClick={() => setEditing(true)}>
                                                    Edit Profile
                                                </button>
                                            </div>
                                        ) : (
                                            <div>
                                                {['name','email','address'].map(field => (
                                                    <div className="mb-3" key={field}>
                                                        <label className="form-label text-capitalize">{field}</label>
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
                                                    <button className="btn btn-success w-50" onClick={handleUpdate} disabled={saving}>
                                                        {saving ? 'Saving...' : 'Save'}
                                                    </button>
                                                    <button className="btn btn-outline-secondary w-50" onClick={() => { setEditing(false); setError(''); }}>
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── Activity Log Tab ── */}
                                {activeTab === 'activity' && (
                                    <div>
                                        {user.activityLog?.length ? (
                                            <div style={{ maxHeight:'300px', overflowY:'auto' }}>
                                                {[...user.activityLog].reverse().map((log, i) => (
                                                    <div key={i} className="d-flex justify-content-between align-items-center border-bottom py-2">
                                                        <span className={`badge bg-${
                                                            log.action === 'login'       ? 'success' :
                                                            log.action === 'otp_request' ? 'primary' :
                                                            log.action === 'otp_failed'  ? 'warning' :
                                                            log.action === 'logout'      ? 'secondary' :
                                                            'dark'
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
                                            <p className="text-muted text-center py-3">No activity yet</p>
                                        )}
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;