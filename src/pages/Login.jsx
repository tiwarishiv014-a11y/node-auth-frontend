// src/pages/Login.jsx
import { useState } from 'react';
import { loginUser, verifyOtp } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
// import './Login.css';
// import '../App.css'

function Login() {
    const [phone,   setPhone]   = useState('');
    const [otp,     setOtp]     = useState('');
    const [step,    setStep]    = useState('phone');
    const [devOtp,  setDevOtp]  = useState('');
    const [error,   setError]   = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // ── STEP 1 — Send Phone ───────────────────────────────
    const sendOtp = async () => {
        if (!phone || phone.length < 10) {
            setError('Enter a valid 10 digit phone number');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const data = await loginUser(phone);
            console.log('Login response:', data); // ✅ Add back
            if (data.status === 'otp_sent') {
                setDevOtp(data.otp || '');
                setStep('otp');
            } else if (data.status === 'pending') {
                setError('Your account is awaiting admin approval.');
            } else if (data.status === 'rejected') {
                setError('Your account has been rejected. Contact support.');
            } else {
                setError(data.message || 'Something went wrong');
            }
        } catch {
            setError('Cannot reach server. Is backend running?');
        } finally {
            setLoading(false);
        }
    };

    // ── STEP 2 — Verify OTP ───────────────────────────────
    const verifyOtpHandler = async () => {
        if (!otp || otp.length !== 6) {
            setError('Enter a valid 6 digit OTP');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const data = await verifyOtp(phone, otp);
            // ✅ Add these back
        console.log('1. Full data:', data);
        console.log('2. accessToken:', data.accessToken);
        console.log('3. user:', data.user);
            if (data.accessToken) {
                localStorage.setItem('token', data.accessToken);
                localStorage.setItem('role',  data.user.role);
                localStorage.setItem('phone', data.user.phone);
                console.log('Saved role:', localStorage.getItem('role')); // ✅ Add back
                if (data.user.role === 'admin') navigate('/dashboard');
                else navigate('/profile');
            } else {
                setError(data.error || 'Invalid OTP');
            }
        } catch {
            setError('Cannot reach server.');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e, action) => { if (e.key === 'Enter') action(); };

    return (
        <div className="login-page">
            <div className="login-card card">
                <div className="card-body">

                    {/* ── Logo ── */}
                    <div className="text-center mb-4">
                        <div className="login-logo">🔐</div>
                        <h2 className="login-title">Welcome Back</h2>
                        <p className="login-subtitle">Login with your phone number</p>
                    </div>

                    {/* ── Error ── */}
                    {error && (
                        <div className="login-alert alert-danger mb-3">
                            <i className="bi bi-exclamation-circle me-2" />{error}
                        </div>
                    )}

                    {/* ── Dev OTP (uncomment to show) ── */}
                    {/* {devOtp && (
                        <div className="login-alert alert-info mb-3">
                            <i className="bi bi-info-circle me-2" />
                            Dev OTP: <strong>{devOtp}</strong>
                        </div>
                    )} */}

                    {/* ── STEP 1 — Phone ── */}
                    {step === 'phone' && (
                        <div>
                            <div className="mb-4">
                                <label className="login-label">
                                    <i className="bi bi-phone me-1" />Phone Number
                                </label>
                                <input
                                    className="login-input"
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, sendOtp)}
                                    placeholder="Enter 10 digit phone"
                                    maxLength={10}
                                    autoFocus
                                />
                            </div>

                            <button className="login-btn btn mb-3" onClick={sendOtp} disabled={loading}>
                                {loading ? (
                                    <><span className="spinner-border spinner-border-sm me-2" />Sending OTP...</>
                                ) : (
                                    <><i className="bi bi-send me-2" />Send OTP</>
                                )}
                            </button>

                            <div className="login-divider">or</div>

                            <p className="register-link">
                                Don't have an account?{' '}
                                <Link to="/register">Register here</Link>
                            </p>
                        </div>
                    )}

                    {/* ── STEP 2 — OTP ── */}
                    {step === 'otp' && (
                        <div>
                            <div className="otp-sent-info">
                                <i className="bi bi-check-circle me-2" />
                                OTP sent to <strong>{phone}</strong>
                            </div>

                            <div className="mb-4">
                                <label className="login-label">
                                    <i className="bi bi-shield-lock me-1" />Enter OTP
                                </label>
                                <input
                                    className="login-input otp-input"
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, verifyOtpHandler)}
                                    placeholder="000000"
                                    maxLength={6}
                                    autoFocus
                                />
                                <p className="input-hint">
                                    <i className="bi bi-clock me-1" />OTP expires in 10 minutes
                                </p>
                            </div>

                            <button className="verify-btn btn" onClick={verifyOtpHandler} disabled={loading}>
                                {loading ? (
                                    <><span className="spinner-border spinner-border-sm me-2" />Verifying...</>
                                ) : (
                                    <><i className="bi bi-shield-check me-2" />Verify OTP</>
                                )}
                            </button>

                            <button className="back-btn btn" onClick={() => { setStep('phone'); setOtp(''); setError(''); setDevOtp(''); }}>
                                <i className="bi bi-arrow-left me-2" />Change Phone Number
                            </button>
                        </div>
                    )}

                    {/* ── STEP 3 — Success ── */}
                    {step === 'done' && (
                        <div className="text-center py-3">
                            <div className="success-icon">✅</div>
                            <h4 className="success-title">Login Successful!</h4>
                            <p className="success-sub">
                                Welcome back <strong>{localStorage.getItem('phone')}</strong>
                            </p>
                            <span className={`badge bg-${localStorage.getItem('role') === 'admin' ? 'danger' : 'primary'} mb-3`}>
                                {localStorage.getItem('role')}
                            </span>
                            <p className="text-muted" style={{ fontSize:13 }}>
                                {localStorage.getItem('role') === 'admin'
                                    ? '→ Redirecting to Dashboard...'
                                    : '→ Redirecting to Profile...'}
                            </p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

export default Login;