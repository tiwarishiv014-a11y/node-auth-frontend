import { useState } from 'react';
import { loginUser, verifyOtp } from '../services/api';
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

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
            console.log('Login response:', data);

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
       console.log('1. Full data:', data);                    // ← ADD
        console.log('2. accessToken:', data.accessToken);      // ← ADD
        console.log('3. user:', data.user);                    // ← ADD


        if (data.accessToken) {
            localStorage.setItem('token', data.accessToken);
            localStorage.setItem('role',  data.user.role);
            localStorage.setItem('phone', data.user.phone);

            console.log('Saved role:', localStorage.getItem('role')); // ← verify


            // redirect based on role
            if (data.user.role === 'admin') {
                navigate('/dashboard');   // ← lowercase d
            } else {
                navigate('/profile');
            }
        } else {
            setError(data.error || 'Invalid OTP');
        }

    } catch {
        setError('Cannot reach server.');
    } finally {
        setLoading(false);
    }
};

    // ── STEP 3 — Handle Enter key ─────────────────────────
    const handleKeyDown = (e, action) => {
        if (e.key === 'Enter') action();
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-5">
                    <div className="card shadow">
                        <div className="card-body p-4">

                            <h2 className="text-center mb-1">Welcome Back</h2>
                            <p className="text-center text-muted mb-4">Login with your phone number</p>

                            {/* Error */}
                            {error && (
                                <div className="alert alert-danger py-2">{error}</div>
                            )}

                            {/* Dev OTP
                            {devOtp && (
                                <div className="alert alert-info py-2">
                                    Dev mode OTP: <strong>{devOtp}</strong>
                                </div>
                            )} */}

                            {/* ── STEP 1 — Phone ── */}
                            {step === 'phone' && (
                                <div>
                                    <div className="mb-3">
                                        <label className="form-label">Phone Number</label>
                                        <input
                                            className="form-control form-control-lg"
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, sendOtp)}
                                            placeholder="Enter 10 digit phone"
                                            maxLength={10}
                                            autoFocus
                                        />
                                    </div>
                                    <button
                                        className="btn btn-primary w-100 py-2"
                                        onClick={sendOtp}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Sending OTP...
                                            </>
                                        ) : 'Send OTP'}
                                    </button>

                                    <hr />
                                    <p className="text-center mb-0" style={{ fontSize: '14px' }}>
  Don't have an account?{" "}
  <Link to="/register" className="text-decoration-none">
    Register here
  </Link>
</p>
                                </div>
                            )}

                            {/* ── STEP 2 — OTP ── */}
                            {step === 'otp' && (
                                <div>
                                    <p className="text-center text-muted mb-3">
                                        OTP sent to <strong>{phone}</strong>
                                    </p>

                                    <div className="mb-3">
                                        <label className="form-label">Enter OTP</label>
                                        <input
                                            className="form-control form-control-lg text-center"
                                            style={{ letterSpacing: '0.6rem', fontSize: '1.5rem' }}
                                            type="text"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, verifyOtpHandler)}
                                            placeholder="000000"
                                            maxLength={6}
                                            autoFocus
                                        />
                                        <div className="form-text text-center">
                                            OTP expires in 10 minutes
                                        </div>
                                    </div>

                                    <button
                                        className="btn btn-success w-100 py-2 mb-2"
                                        onClick={verifyOtpHandler}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Verifying...
                                            </>
                                        ) : 'Verify OTP'}
                                    </button>

                                    <button
                                        className="btn btn-outline-secondary w-100"
                                        onClick={() => {
                                            setStep('phone');
                                            setOtp('');
                                            setError('');
                                            setDevOtp('');
                                        }}
                                    >
                                        ← Change Phone Number
                                    </button>
                                </div>
                            )}

                            {/* ── STEP 3 — Success ── */}
                            {step === 'done' && (
                                <div className="text-center py-3">
                                    <div style={{ fontSize: '3rem' }}>✅</div>
                                    <h4 className="mt-2">Login Successful!</h4>
                                    <p className="text-muted">
                                        Welcome back <strong>{localStorage.getItem('phone')}</strong>
                                    </p>
                                    <p>
                                        Role:{' '}
                                        <span className={`badge bg-${localStorage.getItem('role') === 'admin' ? 'danger' : 'primary'}`}>
                                            {localStorage.getItem('role')}
                                        </span>
                                    </p>
                                    <hr />
                                    {localStorage.getItem('role') === 'admin' ? (
                                        <p className="text-muted">→ Go to Dashboard</p>
                                    ) : (
                                        <p className="text-muted">→ Go to Profile</p>
                                    )}
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;