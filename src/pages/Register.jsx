import { useState } from "react";
import { registerUser } from "../services/api";
// import "./Register.css";

function Register() {
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        address: "",
        gender: "",
        role: "user",
    });

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError("");
        setMessage("");

        try {
            const data = await registerUser(form);

            if (data.message) {
                setMessage(data.message);
                setForm({
                    name: "",
                    email: "",
                    password: "",
                    phone: "",
                    address: "",
                    gender: "",
                    role: "user",
                });
            } else {
                setError(data.error || "Registration failed");
            }
        } catch {
            setError("Cannot reach server. Is backend running?");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page">
            <div className="register-overlay">

                <div className="register-left">
                    <div className="brand-content">
                        <h1>Node Auth System</h1>
                        <p>
                            Secure authentication platform with JWT,
                            MongoDB, React and Voice AI integration.
                        </p>
                    </div>
                </div>

                <div className="register-right">
                    <div className="register-card">

                        <h2>Create Account</h2>
                        <p className="subtitle">
                            Register to continue
                        </p>

                        {message && (
                            <div className="alert alert-success">
                                {message}
                            </div>
                        )}

                        {error && (
                            <div className="alert alert-danger">
                                {error}
                            </div>
                        )}

                        <input
                            className="form-control mb-3"
                            name="name"
                            placeholder="Full Name"
                            value={form.name}
                            onChange={handleChange}
                        />

                        <input
                            className="form-control mb-3"
                            type="email"
                            name="email"
                            placeholder="Email Address"
                            value={form.email}
                            onChange={handleChange}
                        />

                        <input
                            className="form-control mb-3"
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={form.password}
                            onChange={handleChange}
                        />

                        <input
                            className="form-control mb-3"
                            name="phone"
                            placeholder="Phone Number"
                            value={form.phone}
                            onChange={handleChange}
                        />

                        <input
                            className="form-control mb-3"
                            name="address"
                            placeholder="Address"
                            value={form.address}
                            onChange={handleChange}
                        />

                        <select
                            className="form-select mb-4"
                            name="gender"
                            value={form.gender}
                            onChange={handleChange}
                        >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>

                        <button
                            className="register-btn"
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? "Registering..." : "Create Account"}
                        </button>

                    </div>
                </div>

            </div>
        </div>
    );
}

export default Register;