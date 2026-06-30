// src/components/Sidebar.jsx
import { useNavigate, useLocation } from 'react-router-dom';

export default function Sidebar({ handleLogout }) {
    const navigate  = useNavigate();
    const location  = useLocation();
    const role      = localStorage.getItem('role');
    const isAdmin   = role === 'admin';

    const adminNav = [
        { path: '/dashboard', icon: '👥', label: 'Users'     },
        { path: '/analytics', icon: '📊', label: 'Analytics' },
        { path: '/insights',  icon: '🏆', label: 'Insights'  },
    ];

    const userNav = [
        { path: '/chat',     icon: '🤖', label: 'AI Chat'  },
        { path: '/pdf-chat', icon: '📄', label: 'PDF Chat' },
        { path: '/profile',  icon: '👤', label: 'Profile'  },
    ];

    const mainNav   = isAdmin ? adminNav : userNav;
    const bottomNav = isAdmin ? userNav  : [];          // admin gets user links at bottom too

    const isActive = (path) => location.pathname === path;

    return (
        <aside className="dash-sidebar">
            <div className="dash-logo">
                <span className="dash-logo-icon">🛡️</span>
                <span className="dash-logo-text">{isAdmin ? 'AdminX' : 'AppX'}</span>
            </div>

            <nav className="dash-nav">
                {mainNav.map(item => (
                    <button
                        key={item.path}
                        className={`dash-nav-item ${isActive(item.path) ? 'active' : ''}`}
                        onClick={() => navigate(item.path)}
                    >
                        <span className="dash-nav-icon">{item.icon}</span>
                        <span className="dash-nav-label">{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="dash-sidebar-bottom">
                {bottomNav.map(item => (
                    <button
                        key={item.path}
                        className={`dash-nav-item ${isActive(item.path) ? 'active' : ''}`}
                        onClick={() => navigate(item.path)}
                    >
                        <span className="dash-nav-icon">{item.icon}</span>
                        <span className="dash-nav-label">{item.label}</span>
                    </button>
                ))}
                <button className="dash-nav-item danger" onClick={handleLogout}>
                    <span className="dash-nav-icon">⏻</span>
                    <span className="dash-nav-label">Logout</span>
                </button>
            </div>
        </aside>
    );
}