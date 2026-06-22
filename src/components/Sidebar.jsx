import { useNavigate } from 'react-router-dom';

export default function Sidebar({ activeSection, setActiveSection, handleLogout }) {
  const navigate = useNavigate();

  // Map section to route path
  const sectionToPath = {
    users: '/dashboard',
    charts: '/analytics',
    insights: '/insights',
  };

  const handleNavClick = (id) => {
    setActiveSection(id);
    navigate(sectionToPath[id]);
  };

  return (
    <aside className="dash-sidebar">
      <div className="dash-logo">
        <span className="dash-logo-icon">🛡️</span>
        <span className="dash-logo-text">AdminX</span>
      </div>

      <nav className="dash-nav">
        {[
          { id: 'users', icon: '👥', label: 'Users' },
          { id: 'charts', icon: '📊', label: 'Analytics' },
          { id: 'insights', icon: '🏆', label: 'Insights' },
        ].map(item => (
          <button
            key={item.id}
            className={`dash-nav-item ${activeSection === item.id ? 'active' : ''}`}
            onClick={() => handleNavClick(item.id)}
          >
            <span className="dash-nav-icon">{item.icon}</span>
            <span className="dash-nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="dash-sidebar-bottom">
        <button className="dash-nav-item" onClick={() => navigate('/chat')}>
          <span className="dash-nav-icon">🤖</span>
          <span className="dash-nav-label">AI Chat</span>
        </button>
        <button className="dash-nav-item" onClick={() => navigate('/pdf-chat')}>
          <span className="dash-nav-icon">📄</span>
          <span className="dash-nav-label">PDF Chat</span>
        </button>
        <button className="dash-nav-item" onClick={() => navigate('/profile')}>
          <span className="dash-nav-icon">👤</span>
          <span className="dash-nav-label">Profile</span>
        </button>
        <button className="dash-nav-item danger" onClick={handleLogout}>
          <span className="dash-nav-icon">⏻</span>
          <span className="dash-nav-label">Logout</span>
        </button>
      </div>
    </aside>
  );
}