import { Navigate } from 'react-router-dom';

function PrivateRoute({ children, role }) {
    const token    = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');

    console.log('Token:', token ? 'exists' : 'missing');
    console.log('UserRole:', userRole);
    console.log('Required role:', role);

    if (!token) return <Navigate to="/login" />;

    // Only check role if role prop is passed
    if (role && userRole !== role) return <Navigate to="/login" />;

    return children;
}

export default PrivateRoute;