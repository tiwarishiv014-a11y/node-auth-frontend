import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  getDashboard, logoutUser, getAdminInsights
} from '../services/api';
import Sidebar from '../components/Sidebar';

const PURPLE = '#7c6af7';
const PINK = '#f472b6';
const GREEN = '#34d399';
const YELLOW = '#fbbf24';
const RED = '#f87171';
const DARK = '#0f0f1a';
const CARD = '#1a1a2e';
const BORDER = '#2a2a4a';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('charts');

  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    fetchInsights();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getDashboard(token);
      setData(res);
    } catch { setError('Cannot load data'); }
    finally { setLoading(false); }
  };

  const fetchInsights = async () => {
    const res = await getAdminInsights(token);
    if (res.success) setInsights(res.insights);
  };

  const handleLogout = async () => {
    await logoutUser(token);
    localStorage.clear();
    navigate('/login');
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: DARK, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="text-center text-white">
        <div className="spinner-border mb-3" style={{ color: PURPLE }} />
        <p style={{ color: '#888' }}>Loading analytics...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="container mt-5">
      <div className="alert alert-danger">{error}</div>
    </div>
  );

  const statusData = [
    { name: 'Approved', value: data.metrics.approved, color: GREEN },
    { name: 'Pending', value: data.metrics.pending, color: YELLOW },
    { name: 'Rejected', value: data.metrics.rejected, color: RED },
  ];

  const roleData = [
    { name: 'Users', value: data.users.filter(u => u.role === 'user').length, color: PURPLE },
    { name: 'Admins', value: data.users.filter(u => u.role === 'admin').length, color: PINK },
  ];

  const monthMap = {};
  data.users.forEach(u => {
    const month = new Date(u.createdAt).toLocaleString('default', { month: 'short', year: '2-digit' });
    monthMap[month] = (monthMap[month] || 0) + 1;
  });
  const registrationData = Object.entries(monthMap).map(([month, count]) => ({ month, count }));

  const topUsers = insights.slice(0, 5).map(u => ({
    name: u.name === '—' ? u.phone.slice(-4) : u.name,
    chats: u.chatCount,
    pdfs: u.pdfCount,
  }));

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
            <h1 className="dash-page-title">📊 Analytics</h1>
            <p className="dash-page-sub">Visual insights into your platform</p>
          </div>
          <div className="d-flex gap-2">
            <button className="dash-icon-btn" onClick={loadData} title="Refresh">
              <i className="bi bi-arrow-clockwise" />
            </button>
          </div>
        </header>

        <div className="dash-section">
          <div className="row g-4">
            <div className="col-md-6">
              <div className="dash-chart-card">
                <h6 className="dash-chart-title">👥 Users by Status</h6>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8 }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="col-md-6">
              <div className="dash-chart-card">
                <h6 className="dash-chart-title">🎭 Users by Role</h6>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={roleData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {roleData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8 }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="col-md-6">
              <div className="dash-chart-card">
                <h6 className="dash-chart-title">📈 Registrations Over Time</h6>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={registrationData}>
                    <XAxis dataKey="month" stroke="#555" tick={{ fill: '#888', fontSize: 11 }} />
                    <YAxis stroke="#555" tick={{ fill: '#888', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8 }} />
                    <Line type="monotone" dataKey="count" stroke={PURPLE} strokeWidth={2} dot={{ fill: PURPLE }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="col-md-6">
              <div className="dash-chart-card">
                <h6 className="dash-chart-title">🏆 Top 5 Most Active Users</h6>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={topUsers}>
                    <XAxis dataKey="name" stroke="#555" tick={{ fill: '#888', fontSize: 11 }} />
                    <YAxis stroke="#555" tick={{ fill: '#888', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8 }} />
                    <Legend />
                    <Bar dataKey="chats" fill={PURPLE} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pdfs" fill={PINK} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}