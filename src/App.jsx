import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Register     from './pages/Register';
import Login        from './pages/Login';
import Dashboard    from './pages/Dashboard';
import Analytics    from './pages/Analytics';      // ← ADD
import Insights     from './pages/Insights';       // ← ADD
import Profile      from './pages/Profile';
import Chat         from './pages/Chat';
import PdfChat      from './pages/PdfChat';
import PrivateRoute from './components/PrivateRoute';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/"          element={<Login />} />
                <Route path="/login"     element={<Login />} />
                <Route path="/register"  element={<Register />} />

                <Route path="/profile" element={
                    <PrivateRoute>
                        <Profile />
                    </PrivateRoute>
                } />

                <Route path="/dashboard" element={
                    <PrivateRoute role="admin">
                        <Dashboard />
                    </PrivateRoute>
                } />

                {/* ← NEW ROUTE */}
                <Route path="/analytics" element={
                    <PrivateRoute role="admin">
                        <Analytics />
                    </PrivateRoute>
                } />

                {/* ← NEW ROUTE */}
                <Route path="/insights" element={
                    <PrivateRoute role="admin">
                        <Insights />
                    </PrivateRoute>
                } />

                <Route path="/chat" element={
                    <PrivateRoute>
                        <Chat />
                    </PrivateRoute>
                } />

                <Route path="/pdf-chat" element={
                    <PrivateRoute>
                        <PdfChat />
                    </PrivateRoute>
                } />
            </Routes>
        </Router>
    );
}

export default App;