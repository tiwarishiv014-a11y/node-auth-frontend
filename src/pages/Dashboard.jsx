import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getDashboard, updateUserStatus, deleteUser, getUserDetail, logoutUser,
  getAiChatLogs, getPdfChatLogs, banUser, unbanUser, resetUserOtp,
  getUserChats, getUserPdfs
} from '../services/api';
import Sidebar from '../components/Sidebar';

const PURPLE = '#7c6af7';
const VIOLET = '#c084fc';
const PINK = '#f472b6';
const GREEN = '#34d399';
const YELLOW = '#fbbf24';
const RED = '#f87171';
const DARK = '#0f0f1a';
const BORDER = '#2a2a4a';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoad, setDetailLoad] = useState(false);
  const [panelTab, setPanelTab] = useState('info');
  const [panelLoad, setPanelLoad] = useState(false);
  const [userChats, setUserChats] = useState([]);
  const [userPdfs, setUserPdfs] = useState([]);
  const [chatPage, setChatPage] = useState(1);
  const [expandedChat, setExpandedChat] = useState(null);
  const [banReason, setBanReason] = useState('');
  const [banModal, setBanModal] = useState(false);
  const [actionUser, setActionUser] = useState(null);
  const [aiLogs, setAiLogs] = useState([]);
  const [pdfLogs, setPdfLogs] = useState([]);
  const [logsTab, setLogsTab] = useState(null);
  const [logsLoad, setLogsLoad] = useState(false);
  const [logsError, setLogsError] = useState('');
  const [activeSection, setActiveSection] = useState('users');

  const PERPAGE = 5;
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    fetchLogs();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getDashboard(token);
      setData(res);
    } catch { setError('Cannot load dashboard'); }
    finally { setLoading(false); }
  };

  const fetchLogs = async () => {
    if (!token) return;
    setLogsLoad(true);
    setLogsError('');
    try {
      const [aiRes, pdfRes] = await Promise.all([
        getAiChatLogs(token),
        getPdfChatLogs(token),
      ]);
      if (aiRes.success) setAiLogs(aiRes.logs);
      else setLogsError(aiRes.error || 'Failed to load AI logs');

      if (pdfRes.success) setPdfLogs(pdfRes.logs);
      else setLogsError(prev => prev || pdfRes.error || 'Failed to load PDF logs');
    } catch {
      setLogsError('Cannot reach server. Check that the backend is running.');
    } finally {
      setLogsLoad(false);
    }
  };

  const openLogsTab = (tab) => {
    setLogsTab(tab);
    fetchLogs();
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
    setPanelTab('info');
    setUserChats([]);
    setUserPdfs([]);
    setChatPage(1);
    setExpandedChat(null);
    const res = await getUserDetail(phone, token);
    setSelectedUser(res.user);
    setDetailLoad(false);
  };

  const handleBan = async () => {
    const res = await banUser(actionUser.phone, banReason, token);
    if (res.success) {
      alert('✅ User banned');
      setBanModal(false);
      setBanReason('');
      loadData();
      if (selectedUser?.phone === actionUser.phone)
        setSelectedUser(prev => ({ ...prev, isBanned: true }));
    }
  };

  const handleUnban = async (phone) => {
    const res = await unbanUser(phone, token);
    if (res.success) {
      alert('✅ User unbanned');
      loadData();
      if (selectedUser?.phone === phone)
        setSelectedUser(prev => ({ ...prev, isBanned: false }));
    }
  };

  const handleResetOtp = async (phone) => {
    if (!window.confirm(`Reset OTP for ${phone}?`)) return;
    const res = await resetUserOtp(phone, token);
    alert(res.success ? '✅ OTP reset' : '❌ Failed');
  };

  const handlePanelTab = async (tab) => {
    setPanelTab(tab);
    if (tab === 'chats' && userChats.length === 0) {
      setPanelLoad(true);
      const res = await getUserChats(selectedUser._id, token);
      if (res.success) setUserChats(res.chats);
      setPanelLoad(false);
    }
    if (tab === 'pdfs' && userPdfs.length === 0) {
      setPanelLoad(true);
      const res = await getUserPdfs(selectedUser._id, token);
      if (res.success) setUserPdfs(res.pdfs);
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
    a.href = url; a.download = 'users.csv'; a.click();
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: DARK, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="text-center text-white">
        <div className="spinner-border mb-3" style={{ color: PURPLE }} />
        <p style={{ color: '#888' }}>Loading dashboard...</p>
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

  return (
    <div className="dash-root">
      {/* <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        handleLogout={handleLogout}
      /> */}
      <Sidebar handleLogout={handleLogout} />

      <main className="dash-main">
        <header className="dash-topbar">
          <div>
            <h1 className="dash-page-title">👥 User Management</h1>
            <p className="dash-page-sub">
              Welcome back, {localStorage.getItem('name') || localStorage.getItem('phone')}
            </p>
          </div>
          <div className="d-flex gap-2">
            <button className="dash-icon-btn" onClick={loadData} title="Refresh">
              <i className="bi bi-arrow-clockwise" />
            </button>
          </div>
        </header>

        <div className="dash-metrics">
          {[
            { label: 'Total Users', value: data.metrics.total, color: PURPLE, icon: '👥', filter: 'all' },
            { label: 'Pending', value: data.metrics.pending, color: YELLOW, icon: '⏳', filter: 'pending' },
            { label: 'Approved', value: data.metrics.approved, color: GREEN, icon: '✅', filter: 'approved' },
            { label: 'Rejected', value: data.metrics.rejected, color: RED, icon: '❌', filter: 'rejected' },
            { label: 'AI Logs', value: aiLogs.length, color: VIOLET, icon: '🤖', filter: null, logsType: 'ai' },
            { label: 'PDF Logs', value: pdfLogs.length, color: PINK, icon: '📄', filter: null, logsType: 'pdf' },
          ].map(m => (
            <div
              key={m.label}
              className="dash-metric-card"
              onClick={() => {
                if (m.filter) { setFilter(m.filter); setPage(1); }
                else if (m.logsType) openLogsTab(m.logsType);
              }}
              style={{ cursor: (m.filter || m.logsType) ? 'pointer' : 'default' }}
            >
              <div className="dash-metric-icon" style={{ background: m.color + '22', color: m.color }}>
                {m.icon}
              </div>
              <div>
                <div className="dash-metric-value" style={{ color: m.color }}>{m.value}</div>
                <div className="dash-metric-label">{m.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="dash-section" style={{ paddingTop: 0 }}>
          <div className="d-flex gap-2 mb-3">
            <button className="dash-log-btn purple" onClick={() => openLogsTab('ai')}>
              🤖 AI Logs <span className="dash-log-count">{aiLogs.length}</span>
            </button>
            <button className="dash-log-btn pink" onClick={() => openLogsTab('pdf')}>
              📄 PDF Logs <span className="dash-log-count">{pdfLogs.length}</span>
            </button>
          </div>

          <div className="row g-3">
            <div className={selectedUser ? 'col-md-7' : 'col-12'}>
              <div className="dash-filter-bar">
                <input
                  className="dash-input"
                  placeholder="🔍 Search phone or name..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                />
                <select className="dash-select" value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}>
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <select className="dash-select" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}>
                  <option value="all">All Roles</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <button className="dash-icon-btn ms-auto" onClick={exportCSV} title="Export CSV">
                  <i className="bi bi-download" />
                </button>
              </div>

              <p className="dash-result-count">
                {paginated.length} of {filtered.length} users
                {filter !== 'all' && ` · ${filter}`}
              </p>

              <div className="dash-table-wrap">
                <table className="dash-table">
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
                      <tr>
                        <td colSpan="6" className="text-center py-4" style={{ color: '#555' }}>
                          No users found
                        </td>
                      </tr>
                    ) : paginated.map((u, i) => (
                      <tr key={u.phone} className={selectedUser?.phone === u.phone ? 'active-row' : ''}>
                        <td style={{ color: '#555' }}>{(page - 1) * PERPAGE + i + 1}</td>
                        <td className="phone-cell">{u.phone}</td>
                        <td>{u.name || <span style={{ color: '#555' }}>—</span>}</td>
                        <td>
                          <span className={`dash-badge ${u.role === 'admin' ? 'badge-red' : 'badge-gray'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          <span className={`dash-badge ${
                            u.status === 'approved' ? 'badge-green' :
                            u.status === 'pending' ? 'badge-yellow' : 'badge-red'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex gap-1 flex-wrap">
                            <button className="dash-action-btn info" onClick={() => handleView(u.phone)}>
                              <i className="bi bi-eye" />
                            </button>
                            {u.status === 'pending' && (
                              <>
                                <button className="dash-action-btn success" onClick={() => handleStatus(u.phone, 'approved')}>
                                  <i className="bi bi-check-lg" />
                                </button>
                                <button className="dash-action-btn warning" onClick={() => handleStatus(u.phone, 'rejected')}>
                                  <i className="bi bi-x-lg" />
                                </button>
                              </>
                            )}
                            <button className="dash-action-btn danger" onClick={() => handleDelete(u.phone)}>
                              <i className="bi bi-trash3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="dash-pagination">
                  <small style={{ color: '#555' }}>Page {page} of {totalPages}</small>
                  <div className="d-flex gap-1">
                    <button className="dash-page-btn" onClick={() => setPage(1)} disabled={page === 1}>«</button>
                    <button className="dash-page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button key={p} className={`dash-page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                    ))}
                    <button className="dash-page-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>›</button>
                    <button className="dash-page-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</button>
                  </div>
                </div>
              )}
            </div>

            {selectedUser && (
              <div className="col-md-5">
                <div className="dash-panel">
                  <div className="dash-panel-header">
                    <span>User Detail</span>
                    <button className="dash-icon-btn" onClick={() => setSelectedUser(null)}>
                      <i className="bi bi-x-lg" />
                    </button>
                  </div>

                  {detailLoad ? (
                    <div className="text-center py-4">
                      <div className="spinner-border spinner-border-sm" style={{ color: PURPLE }} />
                    </div>
                  ) : (
                    <>
                      <div className="text-center mb-3">
                        {selectedUser.profilePicture ? (
                          <img src={`${import.meta.env.VITE_API_URL}/${selectedUser.profilePicture}`} alt="Profile" className="dash-avatar-img" />
                        ) : (
                          <div className="dash-avatar">
                            {selectedUser.name ? selectedUser.name[0].toUpperCase() : '?'}
                          </div>
                        )}
                        <div className="dash-user-name">{selectedUser.name || '—'}</div>
                        <div className="dash-user-phone">{selectedUser.phone}</div>
                        {selectedUser.isBanned && <span className="dash-badge badge-red mt-1">🚫 Banned</span>}
                      </div>

                      <div className="dash-tabs">
                        {['info', 'activity', 'chats', 'pdfs'].map(tab => (
                          <button
                            key={tab}
                            className={`dash-tab ${panelTab === tab ? 'active' : ''}`}
                            onClick={() => handlePanelTab(tab)}
                          >
                            {tab === 'info' && '👤'}
                            {tab === 'activity' && '📋'}
                            {tab === 'chats' && '💬'}
                            {tab === 'pdfs' && '📄'}
                            <span className="ms-1 text-capitalize">{tab}</span>
                          </button>
                        ))}
                      </div>

                      {panelTab === 'info' && (
                        <>
                          {[
                            { label: 'Phone', value: selectedUser.phone },
                            { label: 'Name', value: selectedUser.name },
                            { label: 'Email', value: selectedUser.email },
                            { label: 'Address', value: selectedUser.address },
                            { label: 'Gender', value: selectedUser.gender },
                            { label: 'Role', value: selectedUser.role },
                            { label: 'Status', value: selectedUser.status },
                            { label: 'Joined', value: selectedUser.createdAt?.slice(0, 10) },
                          ].map(f => (
                            <div className="dash-field-row" key={f.label}>
                              <span className="dash-field-label">{f.label}</span>
                              <span className="dash-field-value">{f.value || '—'}</span>
                            </div>
                          ))}
                          {selectedUser.isBanned && (
                            <div className="dash-alert-danger">🚫 {selectedUser.banReason}</div>
                          )}
                          <div className="d-flex gap-2 mt-3 flex-wrap">
                            {selectedUser.status === 'pending' && (
                              <>
                                <button className="dash-btn success" onClick={() => handleStatus(selectedUser.phone, 'approved')}>✅ Approve</button>
                                <button className="dash-btn warning" onClick={() => handleStatus(selectedUser.phone, 'rejected')}>❌ Reject</button>
                              </>
                            )}
                            <button className="dash-btn danger" onClick={() => handleDelete(selectedUser.phone)}>🗑 Delete</button>
                            <button className="dash-btn gray" onClick={() => handleResetOtp(selectedUser.phone)}>🔄 Reset OTP</button>
                            {selectedUser.isBanned ? (
                              <button className="dash-btn success" onClick={() => handleUnban(selectedUser.phone)}>🔓 Unban</button>
                            ) : (
                              <button className="dash-btn danger" onClick={() => { setActionUser(selectedUser); setBanModal(true); }}>🚫 Ban</button>
                            )}
                          </div>
                        </>
                      )}

                      {panelTab === 'activity' && (
                        <div className="dash-activity">
                          {selectedUser.activityLog?.length ? (
                            [...selectedUser.activityLog].reverse().slice(0, 10).map((log, i) => (
                              <div key={i} className="dash-activity-row">
                                <span className={`dash-badge ${
                                  log.action === 'login' ? 'badge-green' :
                                  log.action === 'otp_request' ? 'badge-purple' :
                                  log.action === 'otp_failed' ? 'badge-yellow' : 'badge-gray'
                                }`}>{log.action}</span>
                                <span className="dash-activity-time">{new Date(log.timestamp).toLocaleString()}</span>
                              </div>
                            ))
                          ) : <p style={{ color: '#555', fontSize: 12 }}>No activity yet</p>}
                        </div>
                      )}

                      {panelTab === 'chats' && (
                        <>
                          {panelLoad ? (
                            <div className="text-center py-3"><div className="spinner-border spinner-border-sm" style={{ color: PURPLE }} /></div>
                          ) : userChats.length === 0 ? (
                            <p style={{ color: '#555' }} className="text-center py-3">No chats found</p>
                          ) : (
                            <>
                              {userChats.slice((chatPage - 1) * 5, chatPage * 5).map((chat, i) => (
                                <div key={i} className="dash-chat-item">
                                  <div className="d-flex justify-content-between align-items-center">
                                    <span className="dash-badge badge-purple">{chat.aiModel || 'sarvam'}</span>
                                    <div className="d-flex gap-1 align-items-center">
                                      <small style={{ color: '#555', fontSize: 10 }}>{new Date(chat.updatedAt).toLocaleDateString()}</small>
                                      <button
                                        className="dash-expand-btn"
                                        onClick={() => setExpandedChat(expandedChat === i ? null : i)}
                                      >{expandedChat === i ? '▲' : '▼'}</button>
                                    </div>
                                  </div>
                                  {expandedChat !== i ? (
                                    <small style={{ fontSize: 11, color: '#aaa' }}>
                                      🧑 {chat.messages[0]?.content}
                                    </small>
                                  ) : (
                                    <div style={{ maxHeight: 250, overflowY: 'auto', marginTop: 6 }}>
                                      {chat.messages.map((msg, j) => (
                                        <div key={j} className={`dash-msg ${msg.role}`}>
                                          <span className={`dash-badge ${msg.role === 'user' ? 'badge-purple' : 'badge-gray'}`}>
                                            {msg.role === 'user' ? '🧑' : '🤖'}
                                          </span>
                                          <small style={{ fontSize: 11 }}>{msg.content}</small>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  <small style={{ color: '#555', fontSize: 10 }}>{chat.messages.length} messages</small>
                                </div>
                              ))}
                              {userChats.length > 5 && (
                                <div className="d-flex justify-content-between align-items-center mt-2">
                                  <small style={{ color: '#555' }}>{chatPage}/{Math.ceil(userChats.length / 5)}</small>
                                  <div className="d-flex gap-1">
                                    <button className="dash-page-btn" onClick={() => setChatPage(p => p - 1)} disabled={chatPage === 1}>‹</button>
                                    <button className="dash-page-btn" onClick={() => setChatPage(p => p + 1)} disabled={chatPage === Math.ceil(userChats.length / 5)}>›</button>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </>
                      )}

                      {panelTab === 'pdfs' && (
                        <>
                          {panelLoad ? (
                            <div className="text-center py-3"><div className="spinner-border spinner-border-sm" style={{ color: PURPLE }} /></div>
                          ) : userPdfs.length === 0 ? (
                            <p style={{ color: '#555' }} className="text-center py-3">No PDFs found</p>
                          ) : userPdfs.map((pdf, i) => (
                            <div key={i} className="dash-chat-item">
                              <div className="d-flex justify-content-between">
                                <span style={{ fontSize: 12 }}>📄 {pdf.filename}</span>
                                <small style={{ color: '#555', fontSize: 10 }}>{new Date(pdf.createdAt).toLocaleDateString()}</small>
                              </div>
                              <small style={{ color: '#555', fontSize: 10 }}>{pdf.chunks?.length} chunks · {pdf.chatHistory?.length} Q&As</small>
                              {pdf.chatHistory?.slice(0, 2).map((h, j) => (
                                <div key={j} className="mt-1 pt-1" style={{ borderTop: `1px solid ${BORDER}` }}>
                                  <small style={{ color: '#7dd3fc', fontSize: 11 }}>Q: {h.question}</small><br />
                                  <small style={{ color: '#888', fontSize: 11 }}>A: {h.answer?.substring(0, 80)}...</small>
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
            )}
          </div>
        </div>
      </main>

      {/* Logs Modal */}
      {logsTab && (
        <div className="dash-modal-overlay">
          <div className="dash-modal">
            <div className="dash-modal-header">
              <h5>{logsTab === 'ai' ? '🤖 AI Chat Logs' : '📄 PDF Chat Logs'}</h5>
              <button className="dash-icon-btn" onClick={() => setLogsTab(null)}>✕</button>
            </div>
            <div className="dash-modal-body">
              {logsError && (
                <div className="dash-alert-danger mb-3">{logsError}</div>
              )}
              {logsLoad ? (
                <div className="text-center py-3"><div className="spinner-border spinner-border-sm" style={{ color: PURPLE }} /></div>
              ) : logsTab === 'ai' ? (
                <table className="dash-table">
                  <thead><tr><th>User</th><th>Message</th><th>Response</th><th>Model</th><th>Time</th></tr></thead>
                  <tbody>
                    {aiLogs.length === 0 ? (
                      <tr><td colSpan="5" className="text-center" style={{ color: '#555' }}>No logs yet</td></tr>
                    ) : aiLogs.map((log, i) => (
                      <tr key={i}>
                        <td><small>{log.user?.name || 'Unknown'}<br /><span style={{ color: '#888' }}>{log.user?.phone}</span></small></td>
                        <td style={{ maxWidth: 200 }}><small className="text-truncate d-block">{log.message}</small></td>
                        <td style={{ maxWidth: 200 }}><small className="text-truncate d-block">{log.response}</small></td>
                        <td><span className="dash-badge badge-purple">{log.model}</span></td>
                        <td><small style={{ color: '#888' }}>{new Date(log.createdAt || log.timestamp).toLocaleString()}</small></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="dash-table">
                  <thead><tr><th>User</th><th>File</th><th>Question</th><th>Answer</th><th>Time</th></tr></thead>
                  <tbody>
                    {pdfLogs.length === 0 ? (
                      <tr><td colSpan="5" className="text-center" style={{ color: '#555' }}>No logs yet</td></tr>
                    ) : pdfLogs.map((log, i) => (
                      <tr key={i}>
                        <td><small>{log.user?.name || 'Unknown'}<br /><span style={{ color: '#888' }}>{log.user?.phone}</span></small></td>
                        <td><small style={{ color: '#888' }}>{log.filename}</small></td>
                        <td style={{ maxWidth: 200 }}><small className="text-truncate d-block">{log.question}</small></td>
                        <td style={{ maxWidth: 200 }}><small className="text-truncate d-block">{log.answer}</small></td>
                        <td><small style={{ color: '#888' }}>{new Date(log.createdAt || log.timestamp).toLocaleString()}</small></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="dash-modal-footer">
              <small style={{ color: '#888' }}>{logsTab === 'ai' ? aiLogs.length : pdfLogs.length} logs</small>
              <button className="dash-btn gray" onClick={fetchLogs}>🔄 Refresh</button>
              <button className="dash-btn gray" onClick={() => setLogsTab(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {banModal && (
        <div className="dash-modal-overlay">
          <div className="dash-modal" style={{ maxWidth: 420 }}>
            <div className="dash-modal-header">
              <h5>🚫 Ban User — {actionUser?.phone}</h5>
              <button className="dash-icon-btn" onClick={() => setBanModal(false)}>✕</button>
            </div>
            <div className="dash-modal-body">
              <label className="dash-label">Reason for ban</label>
              <input
                className="dash-input"
                placeholder="e.g. Spam, abuse..."
                value={banReason}
                onChange={e => setBanReason(e.target.value)}
              />
            </div>
            <div className="dash-modal-footer">
              <button className="dash-btn gray" onClick={() => setBanModal(false)}>Cancel</button>
              <button className="dash-btn danger" onClick={handleBan}>Confirm Ban</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}