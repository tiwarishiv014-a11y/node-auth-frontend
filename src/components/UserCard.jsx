import { useState } from 'react';

const API = 'http://localhost:3000/api';
const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZWFmOGFiYjQwMDliMzMxOWU4N2U4MyIsImVtYWlsIjoic2hpdmFuc2hAZ21haWwuY29tIiwicGhvbmUiOiI5OTk5OTk5OTk5Iiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzc3NDMwNTc0LCJleHAiOjE3Nzc0MzE0NzR9.EIJ3-1IkUhdWKHrYWOrOfansIfqdSxMgyPoVoUDVsy0'; // from Postman

function UserCard({ name, phone, status }) {
    const [currentStatus, setCurrentStatus] = useState(status);
    const [loading,       setLoading]       = useState(false);
    const [error,         setError]         = useState('');

    const updateStatus = async (newStatus) => {
        setLoading(true);
        setError('');

        try {
            const res  = await fetch(`${API}/admin/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                body: JSON.stringify({ phone, status: newStatus })
            });

            const data = await res.json();

            if (res.ok) {
                setCurrentStatus(newStatus); // ← update UI only after API success
            } else {
                setError(data.error || 'Something went wrong');
            }

        } catch (err) {
            setError('Cannot reach server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2>{name || 'No name'}</h2>
            <p>{phone}</p>
            <p>Status: {currentStatus}</p>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            {currentStatus === 'pending' && (
                <div>
                    <button
                        onClick={() => updateStatus('approved')}
                        disabled={loading}
                    >
                        {loading ? 'Approving...' : 'Approve'}
                    </button>
                    <button
                        onClick={() => updateStatus('rejected')}
                        disabled={loading}
                    >
                        {loading ? 'Rejecting...' : 'Reject'}
                    </button>
                </div>
            )}

            {currentStatus === 'approved' && <p>✅ Approved</p>}
            {currentStatus === 'rejected' && <p>❌ Rejected</p>}
        </div>
    );
}

export default UserCard;