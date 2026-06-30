// src/pages/Profile.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateProfile, logoutUser, uploadPicture } from '../services/api';
import Sidebar from '../components/Sidebar';
import './Profile.css';

/* ── Design tokens — LIGHT ─────────────────────────────── */
const T = {
    accent:    '#7c6af7',
    accentDk:  '#6254d4',
    violet:    '#a855f7',
    danger:    '#ef4444',
    text3:     '#9ca3af',
};

/* ── Toast ──────────────────────────────────────────────── */
function Toast({ msg, type, onClose }) {
    useEffect(() => {
        if (!msg) return;
        const t = setTimeout(onClose, 3200);
        return () => clearTimeout(t);
    }, [msg]);
    if (!msg) return null;
    const toastType = type === 'danger' ? 'toast-danger' : 'toast-success';
    const icon = type === 'danger' ? 'bi-exclamation-circle-fill' : 'bi-check-circle-fill';
    return (
        <div className={`toast-container ${toastType}`}>
            <i className={`bi ${icon}`} />{msg}
            <button onClick={onClose} className="toast-close-btn">
                <i className="bi bi-x-lg" />
            </button>
        </div>
    );
}

/* ── Field row ──────────────────────────────────────────── */
function FieldRow({ icon, label, value }) {
    return (
        <div className="field-row">
            <div className="field-icon">
                <i className={`bi ${icon}`} />
            </div>
            <div>
                <div className="field-label">{label}</div>
                <div className={value ? 'field-value-present' : 'field-value-empty'}>
                    {value || '—'}
                </div>
            </div>
        </div>
    );
}

/* ── Edit input ─────────────────────────────────────────── */
function EditInput({ label, name, value, onChange, type = 'text' }) {
    return (
        <div className="edit-input-group">
            <label className="edit-label">{label}</label>
            <input
                name={name} value={value} onChange={onChange} type={type}
                placeholder={`Enter ${label.toLowerCase()}`}
                className="edit-input"
            />
        </div>
    );
}

/* ════════════════════════════════════════════════════════ */
export default function Profile() {
    const [user,      setUser]      = useState(null);
    const [form,      setForm]      = useState({ name:'', email:'', address:'', gender:'' });
    const [loading,   setLoading]   = useState(true);
    const [saving,    setSaving]    = useState(false);
    const [uploading, setUploading] = useState(false);
    const [editing,   setEditing]   = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const [toast,     setToast]     = useState({ msg:'', type:'success' });
    const fileRef = useRef();

    const token  = localStorage.getItem('token');
    const role   = localStorage.getItem('role');
    const navigate = useNavigate();

    const notify = (msg, type = 'success') => setToast({ msg, type });

    useEffect(() => {
        getProfile(token)
            .then(data => {
                setUser(data);
                setForm({ name:data.name||'', email:data.email||'', address:data.address||'', gender:data.gender||'' });
                setLoading(false);
            })
            .catch(() => { notify('Could not load profile', 'danger'); setLoading(false); });
    }, []);

    const handleChange  = (e) => setForm({ ...form, [e.target.name]: e.target.value });
    const handleUpdate  = async () => {
        setSaving(true);
        const data = await updateProfile(form, token);
        if (data.user) { setUser(data.user); notify('Profile saved'); setEditing(false); }
        else notify(data.error || 'Update failed', 'danger');
        setSaving(false);
    };
    const handleLogout  = async () => { await logoutUser(token); localStorage.clear(); navigate('/login'); };
    const handlePicture = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const data = await uploadPicture(file, token);
        if (data.user) { setUser(data.user); notify('Photo updated'); }
        else notify(data.error || 'Upload failed', 'danger');
        setUploading(false);
    };

    /* ── Loaders ── */
    if (loading) return (
        <div className="loading-container">
            <div className="loading-spinner" />
            <p className="loading-text">Loading your profile…</p>
        </div>
    );
    if (!user) return (
        <div className="error-container">
            <p className="error-text">Could not load profile. Please log in again.</p>
        </div>
    );

    const initials   = (user.name?.[0] || user.phone?.[0] || '?').toUpperCase();
    const daysSince  = user.createdAt ? Math.floor((Date.now() - new Date(user.createdAt)) / 86400000) : 0;
    const loginCount = user.activityLog?.filter(l => l.action === 'login').length || 0;
    const actCount   = user.activityLog?.length || 0;
    const avatarSrc  = user.profilePicture ? `${import.meta.env.VITE_API_URL}/${user.profilePicture}` : null;

    const actColors = {
        login:       { bg:'#ecfdf5', color:'#059669', icon:'bi-box-arrow-in-right', label:'Signed in'     },
        otp_request: { bg:'#ede9fe', color:T.accent,  icon:'bi-phone',              label:'OTP requested' },
        otp_failed:  { bg:'#fffbeb', color:'#d97706', icon:'bi-exclamation-circle', label:'OTP failed'    },
        logout:      { bg:'#f3f4f6', color:'#6b7280', icon:'bi-box-arrow-right',    label:'Signed out'    },
    };

    return (
        <>
            <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg:'', type:'success' })} />

            <div className="dash-root">
                <Sidebar handleLogout={handleLogout} />

                <main className="dash-main">

                    {/* ══ BANNER ══════════════════════════════════════════ */}
                    <div className="profile-banner">
                        <div className="banner-orb-large" />
                        <div className="banner-orb-medium" />
                        <div className="banner-orb-small" />

                        <div className="banner-pills">
                            <span className="pill">
                                {role === 'admin' ? '⚡ Admin' : '👤 User'}
                            </span>
                            <span className={`pill ${user.status === 'approved' ? 'pill-success' : 'pill-warning'}`}>
                                {user.status === 'approved' ? '✓ Approved' : user.status}
                            </span>
                        </div>
                    </div>

                    {/* ══ AVATAR ROW ════════════════════════════════════ */}
                    <div className="avatar-row">
                        <div className="avatar-wrapper">
                            <div className="avatar-ring">
                                <div className="avatar-inner">
                                   <div className="avatar-image-wrap">
                {avatarSrc ? (
                    <>
                        <img 
                            src={avatarSrc} 
                            alt="Profile" 
                            className="avatar-img"
                            onError={(e) => {
                                console.error('Image failed to load:', avatarSrc);
                                e.target.style.display = 'none';
                            }}
                            onLoad={() => {
                                console.log('Image loaded successfully:', avatarSrc);
                            }}
                        />
                        <span className="avatar-initials" style={{ display: 'none' }}>
                            {initials}
                        </span>
                    </>
                ) : (
                    <span className="avatar-initials">
                        {initials}
                    </span>
                )}
            </div>
                                </div>
                            </div>

                            <label className="camera-badge"
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                {uploading
                                    ? <div className="upload-spinner" />
                                    : <i className="bi bi-camera-fill" />
                                }
                                <input type="file" accept="image/*" ref={fileRef} onChange={handlePicture} />
                            </label>
                        </div>

                        <div className="user-info">
                            <h2 className="user-name">{user.name || 'Unnamed user'}</h2>
                            <p className="user-phone">
                                <i className="bi bi-phone me-1" />+91 {user.phone}
                            </p>
                        </div>
                    </div>

                    {/* ══ BODY ════════════════════════════════════════════ */}
                    <div className="profile-body">

                        {/* Stats strip */}
                        <div className="stats-strip">
                            {[
                                { label:'Total logins', value:loginCount, color:'#059669', icon:'bi-box-arrow-in-right' },
                                { label:'Activities',   value:actCount,   color:T.accent,  icon:'bi-activity'           },
                                { label:'Days with us', value:daysSince,  color:T.violet,  icon:'bi-calendar-heart'     },
                            ].map((s, i) => (
                                <div key={i} className="stat-item">
                                    {i > 0 && <div className="stat-divider" />}
                                    <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                                    <div className="stat-label">
                                        <i className={`bi ${s.icon} me-1`} />{s.label}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Two-column layout */}
                        <div className="profile-content">

                            {/* LEFT */}
                            <div className="profile-sidebar">

                                {/* Account snapshot */}
                                <div className="card">
                                    <div className="card-header">
                                        <p className="card-title">Account details</p>
                                    </div>
                                    {[
                                        { icon:'bi-envelope-fill', label:'Email',  value:user.email || 'Not set'             },
                                        { icon:'bi-calendar3',     label:'Joined', value:user.createdAt?.slice(0,10) || '—'  },
                                        { icon:'bi-person-fill',   label:'Gender', value:user.gender || 'Not set'            },
                                    ].map((item, i) => (
                                        <div key={i} className="detail-item">
                                            <div className="detail-icon">
                                                <i className={`bi ${item.icon}`} />
                                            </div>
                                            <div>
                                                <div className="detail-label">{item.label}</div>
                                                <div className="detail-value">{item.value}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Quick access */}
                                {role !== 'admin' && (
                                    <div className="card">
                                        <div className="card-header">
                                            <p className="card-title">Quick access</p>
                                        </div>
                                        <div className="card-body">
                                            {[
                                                { label:'AI Chat',  sub:'Ask anything',  icon:'🤖', route:'/chat',     bg:'#ede9fe', border:'#ddd6fe', tc:T.accentDk },
                                                { label:'PDF Chat', sub:'Chat with docs', icon:'📄', route:'/pdf-chat', bg:'#faf5ff', border:'#e9d5ff', tc:T.violet   },
                                            ].map(b => (
                                                <button key={b.label} onClick={() => navigate(b.route)} className="pf-quick-btn quick-access-btn" style={{
                                                    background:b.bg, border:`1px solid ${b.border}`,
                                                }}>
                                                    <span className="quick-access-icon">{b.icon}</span>
                                                    <div>
                                                        <div className="quick-access-title" style={{ color:b.tc }}>{b.label}</div>
                                                        <div className="quick-access-sub">{b.sub}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {role === 'admin' && (
                                    <button onClick={() => navigate('/dashboard')} className="pf-quick-btn admin-dash-btn">
                                        <span className="quick-access-icon">⚡</span>
                                        <div>
                                            <div className="quick-access-title" style={{ color: T.danger }}>Admin Dashboard</div>
                                            <div className="quick-access-sub">Manage users & settings</div>
                                        </div>
                                    </button>
                                )}
                            </div>

                            {/* RIGHT — tabbed panel */}
                            <div className="profile-panel">

                                {/* Tab bar */}
                                <div className="tab-bar">
                                    {[
                                        { id:'profile',  icon:'bi-person-lines-fill', label:'Profile Info' },
                                        { id:'activity', icon:'bi-clock-history',     label:'Activity'     },
                                    ].map(tab => (
                                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`pf-tab-btn ${activeTab === tab.id ? 'active' : ''}`}>
                                            <i className={`bi ${tab.icon}`} />{tab.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="tab-content">

                                    {/* ── Profile tab ── */}
                                    {activeTab === 'profile' && (
                                        !editing ? (
                                            <div>
                                                <FieldRow icon="bi-phone-fill"    label="Phone"   value={user.phone} />
                                                <FieldRow icon="bi-envelope-fill" label="Email"   value={user.email} />
                                                <FieldRow icon="bi-geo-alt-fill"  label="Address" value={user.address} />
                                                <FieldRow icon="bi-person-fill"   label="Gender"  value={user.gender} />
                                                <FieldRow icon="bi-calendar3"     label="Joined"  value={user.createdAt?.slice(0,10)} />
                                                <button onClick={() => setEditing(true)} className="pf-primary-btn save-btn" style={{ marginTop:24 }}>
                                                    <i className="bi bi-pencil-square" />Edit profile
                                                </button>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="edit-section-title">
                                                    <i className="bi bi-pencil-square me-2" />Editing profile
                                                </p>
                                                <EditInput label="Name"    name="name"    value={form.name}    onChange={handleChange} />
                                                <EditInput label="Email"   name="email"   value={form.email}   onChange={handleChange} type="email" />
                                                <EditInput label="Address" name="address" value={form.address} onChange={handleChange} />
                                                <div className="edit-input-group">
                                                    <label className="edit-label">Gender</label>
                                                    <select name="gender" value={form.gender} onChange={handleChange} className="edit-select" required>
                                                        <option value="">Select gender</option>
                                                        <option value="male">Male</option>
                                                        <option value="female">Female</option>
                                                        <option value="other">Other</option>
                                                    </select>
                                                </div>
                                                <div className="edit-actions">
                                                    <button onClick={handleUpdate} disabled={saving} className="pf-primary-btn save-btn">
                                                        {saving
                                                            ? <><div className="save-spinner" />Saving…</>
                                                            : <><i className="bi bi-check-lg" />Save changes</>
                                                        }
                                                    </button>
                                                    <button onClick={() => setEditing(false)} className="pf-ghost-btn cancel-btn">
                                                        <i className="bi bi-x-lg" />Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    )}

                                    {/* ── Activity tab ── */}
                                    {activeTab === 'activity' && (
                                        user.activityLog?.length ? (
                                            <div className="activity-timeline">
                                                <div className="timeline-line" />
                                                {[...user.activityLog].reverse().map((log, i) => {
                                                    const c = actColors[log.action] || { bg:'#f3f4f6', color:T.text3, icon:'bi-circle', label:log.action };
                                                    return (
                                                        <div key={i} className="pf-log-row">
                                                            <div className="activity-dot" style={{ background:c.bg, border:`1.5px solid ${c.color}` }}>
                                                                <i className={`bi ${c.icon}`} style={{ color:c.color }} />
                                                            </div>
                                                            <span className="activity-label" style={{ color:c.color }}>{c.label}</span>
                                                            <span className="activity-time">
                                                                {new Date(log.timestamp).toLocaleString(undefined, { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="empty-state">
                                                <i className="bi bi-clock-history empty-icon" />
                                                <p className="empty-title">No activity yet</p>
                                                <p className="empty-subtitle">Logins and OTP requests will appear here.</p>
                                            </div>
                                        )
                                    )}

                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}