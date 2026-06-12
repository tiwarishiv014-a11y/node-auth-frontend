const API = 'http://localhost:3000/api';

export const registerUser = async (formData) => {
    const res  = await fetch(`${API}/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(formData)
    });
    return res.json();
};

export const loginUser = async (phone) => {
    const res  = await fetch(`${API}/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phone })
    });
    return res.json();
};

export const verifyOtp = async (phone, otp) => {
    const res  = await fetch(`${API}/verify-otp`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phone, otp })
    });
    return res.json();
};

export const getProfile = async (token) => {
    const res  = await fetch(`${API}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
};

export const updateProfile = async (formData, token) => {
    const res = await fetch(`${API}/update`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify(formData)
    });
    return res.json();
};

export const logoutUser = async (token) => {
    const res = await fetch(`${API}/logout`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
};


export const getDashboard = async (token) => {
    const res  = await fetch(`${API}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
};

export const updateUserStatus = async (phone, status, token) => {
    const res  = await fetch(`${API}/admin/status`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ phone, status })
    });
    return res.json();
};

export const getUserDetail = async (phone, token) => {
    const res  = await fetch(`${API}/admin/user/${phone}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
};

export const editUser = async (phone, data, token) => {
    const res  = await fetch(`${API}/admin/user/${phone}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify(data)
    });
    return res.json();
};

export const deleteUser = async (phone, token) => {
    const res  = await fetch(`${API}/admin/user/${phone}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
};
export const uploadPicture = async (file, token) => {
    const formData = new FormData();
    formData.append('profilePicture', file);
    const res = await fetch(`${API}/upload-picture`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
        body:    formData
    });
    return res.json();
};



// ── Sarvam Chat APIs ─────────────────────────────────────────
export const sendChatMessage = async (message, language, token, chatId = null) => {
    const res = await fetch(`http://localhost:3000/api/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ message, language, chatId }),
    });
    return res.json();
};

export const getChatSessions = async (token) => {
    const res = await fetch(`http://localhost:3000/api/chat/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
};

export const getChatSession = async (chatId, token) => {
    const res = await fetch(`http://localhost:3000/api/chat/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
};

export const deleteChatSession = async (chatId, token) => {
    const res = await fetch(`http://localhost:3000/api/chat/${chatId}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
};

export const clearAllChats = async (token) => {
    const res = await fetch(`http://localhost:3000/api/chat/clear/all`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
};

export const transcribeAudio = async (audioBlob, language, token) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');
    formData.append('language', language);
    const res = await fetch('http://localhost:3000/api/voice/transcribe', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
    });
    return res.json();
};
 
// Send text → get base64 audio back
export const speakText = async (text, language, token) => {
    const res = await fetch('http://localhost:3000/api/voice/speak', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ text, language }),
    });
    return res.json();
};

// Missing in your file — add these:



// export const updateUserStatus = async (phone, status, token) => {
//     const res = await fetch(`${API}/admin/status`, {
//         method:  'POST',
//         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
//         body:    JSON.stringify({ phone, status })
//     });
//     return res.json();
// };