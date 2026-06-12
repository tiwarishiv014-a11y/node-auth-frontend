import { useState } from 'react';
import { registerUser } from '../services/api';  // ← import from service

function Register() {
    const [form, setForm] = useState({
        name:     '',
        email:    '',
        password: '',
        phone:    '',
        address:  '',
        gender:   '',
        role:     'user'
    });

    const [message, setMessage] = useState('');
    const [error,   setError]   = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const data = await registerUser(form);  // ← one clean line
            console.log('Response:', data);

            if (data.message) {
                setMessage(data.message);
                setForm({ name:'', email:'', password:'', phone:'', address:'', gender:'', role:'user' });
            } else {
                setError(data.error || 'Registration failed');
            }

        } catch (err) {
            console.log('Error:', err.message);
            setError('Cannot reach server. Is backend running?');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6">

                    <div className="card shadow">
                        <div className="card-body p-4">

                            <h2 className="card-title text-center mb-4">Register</h2>

                            {message && (
                                <div className="alert alert-success">{message}</div>
                            )}
                            {error && (
                                <div className="alert alert-danger">{error}</div>
                            )}

                            <div className="mb-3">
                                <label className="form-label">Full Name</label>
                                <input
                                    className="form-control"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="Enter full name"
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Email</label>
                                <input
                                    className="form-control"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="Enter email"
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Password</label>
                                <input
                                    className="form-control"
                                    type="password"
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="Enter password"
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Phone</label>
                                <input
                                    className="form-control"
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleChange}
                                    placeholder="Enter phone"
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Address</label>
                                <input
                                    className="form-control"
                                    name="address"
                                    value={form.address}
                                    onChange={handleChange}
                                    placeholder="Enter address"
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Gender</label>
                                <select
                                    className="form-select"
                                    name="gender"
                                    value={form.gender}
                                    onChange={handleChange}
                                >
                                    <option value="">Select gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Role</label>
                                <select
                                    className="form-select"
                                    name="role"
                                    value={form.role}
                                    onChange={handleChange}
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <button
                                className="btn btn-primary w-100"
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Registering...
                                    </>
                                ) : 'Register'}
                            </button>

                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default Register;