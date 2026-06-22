# 🖥️ Node Auth Frontend

A **React-based frontend** for the Node.js Authentication & AI Chat Platform — featuring phone OTP login, modern admin dashboard, AI-powered chat, PDF RAG chat, and Sarvam AI voice capabilities.

> Built with React · Vite · React Router DOM · Bootstrap 5 · Recharts · JWT

---

## 🔗 Connected Projects

| Project | Repository | Live URL |
|---------|-----------|----------|
| Backend (Node.js) | [node-auth](https://github.com/tiwarishiv014-a11y/node-auth) | https://node-auth-u2f2.onrender.com |
| Frontend (React)  | [node-auth-frontend](https://github.com/tiwarishiv014-a11y/node-auth-frontend) | https://node-auth-frontend-zeta.vercel.app |

---

## What this project does

- Phone-based OTP login — no password required
- New users wait for **admin approval** before accessing the app
- JWT tokens stored in `localStorage` for session management
- Protected routes via `PrivateRoute` component
- Role-based access — admin-only dashboard
- **Modern Admin Dashboard** with sidebar navigation, charts, and leaderboard
- **AI Chat** powered by Sarvam AI and Groq AI (toggle between models)
- **PDF RAG Chat** — upload a PDF and ask questions about it
- Voice input via **Speech-to-Text (STT)**
- AI responses via **Text-to-Speech (TTS)**
- Profile management with picture upload
- Admin can ban/unban users, reset OTPs, view chat and PDF history

---

## Tech Stack

React · Vite · React Router DOM · HashRouter · Bootstrap 5 · Recharts · JWT · Fetch API

---

## Project Structure

```text
node-auth-frontend/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── PrivateRoute.jsx       # Protects routes — redirects if not logged in
│   │   └── Sidebar.jsx            # Shared sidebar for admin pages
│   ├── pages/
│   │   ├── Login.jsx              # Phone OTP login page
│   │   ├── Register.jsx           # New user registration
│   │   ├── Dashboard.jsx          # Admin user management page
│   │   ├── Analytics.jsx          # Admin analytics with charts
│   │   ├── Insights.jsx           # Admin leaderboard & insights
│   │   ├── Profile.jsx            # User profile & picture upload
│   │   ├── Chat.jsx               # AI chat with voice input/output
│   │   └── PdfChat.jsx            # PDF RAG chat page
│   ├── services/
│   │   └── api.js                 # All API calls to backend
│   ├── App.jsx                    # Routes definition
│   ├── App.css                    # Global styles (light professional theme)
│   └── main.jsx
├── .env
├── package.json
└── vite.config.js
```

---

## Getting Started

```bash
git clone https://github.com/tiwarishiv014-a11y/node-auth-frontend.git
cd node-auth-frontend
npm install
```

Create `.env` in the root:

```env
VITE_API_URL=http://localhost:3000
```

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

> ⚠️ Make sure the backend (`node-auth`) is running on port 3000 before starting the frontend.

---

## Pages & Routes

| Page | Route | Access | Description |
|------|-------|--------|-------------|
| Login | `/` | Public | Phone number OTP login |
| Login | `/login` | Public | Same as `/` |
| Register | `/register` | Public | New user registration |
| Profile | `/profile` | 🔒 Auth | View & update profile, upload picture |
| Dashboard | `/dashboard` | 🔒 Admin | User management, logs, ban/unban |
| Analytics | `/analytics` | 🔒 Admin | Charts — status, roles, registrations, top users |
| Insights | `/insights` | 🔒 Admin | Leaderboard, top 3 medals, activity stats |
| Chat | `/chat` | 🔒 Auth | AI chat with STT & TTS, Sarvam/Groq toggle |
| PDF Chat | `/pdf-chat` | 🔒 Auth | Upload PDF, ask questions via RAG |

---

## Admin Dashboard Features

| Feature | Description |
|---------|-------------|
| 👥 User Management | View, search, filter, paginate all users |
| ✅ Approve / Reject | Change user status from pending |
| 🚫 Ban / Unban | Ban users with reason, unban anytime |
| 🔄 Reset OTP | Force-clear a user's OTP and attempts |
| 👁️ View Detail | 4-tab panel: Info, Activity, Chats, PDFs |
| 💬 Chat History | View user's AI chat sessions (paginated + expandable) |
| 📄 PDF History | View user's uploaded PDFs and Q&A history |
| 📋 Activity Log | Login, OTP request, OTP failed logs per user |
| 🤖 AI Logs | All AI chat messages across all users |
| 📄 PDF Logs | All PDF chat Q&As across all users |
| 📊 Analytics | Pie charts, donut chart, line chart, bar chart |
| 🏆 Insights | Leaderboard ranked by most active users |
| 📥 Export CSV | Download all users as CSV |

---

## Route Protection

```jsx
// Auth required
<PrivateRoute>
    <Profile />
</PrivateRoute>

// Admin role required
<PrivateRoute role="admin">
    <Dashboard />
</PrivateRoute>
```

- Not logged in → redirected to `/login`
- Not admin → access denied to `/dashboard`, `/analytics`, `/insights`

---

## How it connects to Backend

```text
React Frontend (port 5173)
        |
        v
src/services/api.js
        |
        v
Node.js Backend (port 3000)
        |
   _____|_________________________________
  |           |           |              |
MongoDB    Sarvam AI   Groq AI        JWT Auth
(users,    (chat, STT, (llama-3.1    (access +
 chats,     TTS)        -8b-instant)  refresh
 pdfs)                               tokens)
```

---

## API Services (`src/services/api.js`)

### Auth
| Function | Endpoint | Description |
|----------|----------|-------------|
| `registerUser` | `POST /api/register` | Register new user |
| `loginUser` | `POST /api/login` | Login with phone |
| `verifyOtp` | `POST /api/verify-otp` | Verify OTP, receive JWT |
| `logoutUser` | `POST /api/logout` | Logout, clear token |

### User
| Function | Endpoint | Description |
|----------|----------|-------------|
| `getProfile` | `GET /api/profile` | Get user profile |
| `updateProfile` | `POST /api/update` | Update profile info |
| `uploadPicture` | `POST /api/upload-picture` | Upload profile picture |

### Admin — Users
| Function | Endpoint | Description |
|----------|----------|-------------|
| `getDashboard` | `GET /api/admin/dashboard` | Metrics & all users |
| `updateUserStatus` | `POST /api/admin/status` | Approve/reject user |
| `getUserDetail` | `GET /api/admin/user/:phone` | Single user detail |
| `deleteUser` | `DELETE /api/admin/user/:phone` | Delete user |
| `banUser` | `POST /api/admin/ban` | Ban user with reason |
| `unbanUser` | `POST /api/admin/unban` | Unban user |
| `resetUserOtp` | `POST /api/admin/reset-otp` | Reset user OTP |

### Admin — Logs & Insights
| Function | Endpoint | Description |
|----------|----------|-------------|
| `getAiChatLogs` | `GET /api/admin/logs/ai` | All AI chat logs |
| `getPdfChatLogs` | `GET /api/admin/logs/pdf` | All PDF chat logs |
| `getAdminInsights` | `GET /api/admin/insights` | User activity leaderboard |
| `getUserChats` | `GET /api/admin/user-chats/:userId` | User's chat history |
| `getUserPdfs` | `GET /api/admin/user-pdfs/:userId` | User's PDF history |

### AI Chat
| Function | Endpoint | Description |
|----------|----------|-------------|
| `sendChatMessage` | `POST /api/chat` | Send message (Sarvam or Groq) |
| `getChatSessions` | `GET /api/chat/sessions` | All chat sessions |
| `getChatSession` | `GET /api/chat/:chatId` | Single session |
| `deleteChatSession` | `DELETE /api/chat/:chatId` | Delete session |
| `clearAllChats` | `DELETE /api/chat/clear/all` | Clear all chats |

### PDF Chat
| Function | Endpoint | Description |
|----------|----------|-------------|
| `uploadPdf` | `POST /api/pdf/upload` | Upload & chunk PDF |
| `chatWithPdf` | `POST /api/pdf/chat` | Ask question about PDF |
| `listPdfs` | `GET /api/pdf/list` | List uploaded PDFs |
| `deletePdf` | `DELETE /api/pdf/:id` | Delete a PDF |

### Voice
| Function | Endpoint | Description |
|----------|----------|-------------|
| `transcribeAudio` | `POST /api/voice/transcribe` | Speech-to-Text |
| `speakText` | `POST /api/voice/speak` | Text-to-Speech |

---

## Authentication Flow

```text
1. User enters phone number on Login page
2. Backend sends OTP
3. User enters OTP → receives JWT access + refresh token
4. Tokens stored in localStorage
5. PrivateRoute checks token on every protected page
6. Token sent as Bearer in every API request header
7. On expiry → refresh token used to get new access token
```

---

## PDF RAG Flow

```text
1. User uploads PDF on /pdf-chat page
2. Backend extracts text via pdf-parse
3. Text split into ~1000 char chunks
4. Chunks saved to MongoDB (PdfDocument model)
5. User asks a question
6. Keyword matching finds relevant chunks
7. Chunks sent as context to Groq AI
8. AI answers based ONLY on PDF content
9. Q&A saved to chatHistory in MongoDB
```

---

## Voice Flow

```text
STT: User speaks → audio blob → /api/voice/transcribe → Sarvam AI → text in input
TTS: AI response → /api/voice/speak → Sarvam AI → base64 audio → plays in browser
```

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend base URL | `http://localhost:3000` |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## Author

Shivansh Tiwari

- GitHub: [tiwarishiv014-a11y](https://github.com/tiwarishiv014-a11y)
- Backend Repo: [node-auth](https://github.com/tiwarishiv014-a11y/node-auth)
- LinkedIn: [shivansh-tiwari-72ab57315](https://linkedin.com/in/shivansh-tiwari-72ab57315)