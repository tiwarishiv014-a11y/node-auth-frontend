// const API = 'http://localhost:3000/api';
const API = `${import.meta.env.VITE_API_URL}/api`;

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
export const sendChatMessage = async (message, language, token, chatId = null, aiModel ='sarvam') => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chat`, {
    // const res = await fetch(`${API}/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ message, language, chatId, aiModel }),
    });
    return res.json();
};

export const getChatSessions = async (token) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/sessions`, {
    // const res = await fetch(`${API}/chat/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
};

export const getChatSession = async (chatId, token) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/${chatId}`, {
    // const res = await fetch(`${API}/chat/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
};

export const deleteChatSession = async (chatId, token) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/${chatId}`, {
    // const res = await fetch(`${API}/chat/${chatId}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
};

export const clearAllChats = async (token) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/clear/all`, {
    // const res = await fetch(`${API}/chat/clear/all`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
};

export const transcribeAudio = async (audioBlob, language, token) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');
    formData.append('language', language);
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/voice/transcribe`, {
    // const res = await fetch(`${API}/voice/transcribe`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
    });
    return res.json();
};
 
// Send text → get base64 audio back
export const speakText = async (text, language, token) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/voice/speak`, {
    // const res = await fetch(`${API}/voice/speak`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ text, language }),
    });
    return res.json();
};

// ── PDF Chat API ─────────────────────────────────────────────

export const uploadPdf = async (file) => {
    console.log('uploadPdf called', file);  
    const formData = new FormData();
    formData.append('pdf', file);

          

    const token = localStorage.getItem('token');
    // console.log('Token:', token);  // 👈 check token exists
    // console.log('Fetching:', `${API}/pdf/upload`);  
const res = await fetch(`${import.meta.env.VITE_API_URL}/api/pdf/upload`, {
    // const res = await fetch(`${API}/pdf/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
    });
    return res.json();
};

export const chatWithPdf = async (question, docId) => {
    const token = localStorage.getItem('token');
    // console.log('Token:', token);  // 👈 check token exists
   const res = await fetch(`${import.meta.env.VITE_API_URL}/api/pdf/chat`, {
    // const res = await fetch(`${API}/pdf/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question, docId }),
    });
    return res.json();
};

export const listPdfs = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/pdf/list`, {
    // const res = await fetch(`${API}/pdf/list`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
};

export const deletePdf = async (id) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/pdf/${id}`, {
    // const res = await fetch(`${API}/pdf/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
};