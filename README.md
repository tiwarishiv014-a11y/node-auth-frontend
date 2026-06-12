# 🖥️ Node Auth Frontend

A **React-based frontend** for the Node.js Authentication & AI Chat Platform — featuring phone OTP login, admin dashboard, AI-powered chat, and Sarvam AI voice capabilities.

> Built with React · Vite · React Router DOM · JWT · Sarvam AI

---

## 🔗 Connected Projects

| Project | Repository | Description |
|---------|-----------|-------------|
| Backend (Node.js) | [node-auth](https://github.com/tiwarishiv014-a11y/node-auth) | REST API · Auth · AI Chat · Voice |

---

## What this project does

- Phone-based OTP login — no password required
- New users wait for **admin approval** before accessing the app
- JWT tokens stored in `localStorage` for session management
- Protected routes via `PrivateRoute` component
- Role-based access — admin-only dashboard
- AI Chat powered by **Sarvam AI**
- Voice input via **Speech-to-Text (STT)**
- AI responses via **Text-to-Speech (TTS)**
- Profile management with picture upload

---

## Tech Stack

React · Vite · React Router DOM · HashRouter · JWT · Fetch API · Sarvam AI

---

## Project Structure

```text
node-auth-frontend/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/
│   │   ├── hero.png
│   │   ├── react.svg
│   │   └── vite.svg
│   ├── components/
│   │   ├── PrivateRoute.jsx       # Protects routes — redirects if not logged in
│   │   └── UserCard.jsx           # Reusable user info card component
│   ├── pages/
│   │   ├── Login.jsx              # Phone OTP login page
│   │   ├── Register.jsx           # New user registration
│   │   ├── Dashboard.jsx          # Admin dashboard (admin only)
│   │   ├── Profile.jsx            # User profile & picture upload
│   │   └── Chat.jsx               # AI chat with voice input/output
│   ├── services/
│   │   └── api.js                 # All API calls to backend
│   ├── App.jsx                    # Routes definition
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── .env                           # VITE_API_URL config
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
└── eslint.config.js
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
| Profile | `/profile` | 🔒 Auth required | View & update profile, upload picture |
| Dashboard | `/dashboard` | 🔒 Admin only | Manage users, approvals, activity logs |
| Chat | `/chat` | 🔒 Auth required | AI chat with STT & TTS voice support |

---

## Route Protection

Routes are protected using the `PrivateRoute` component:

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

- If not logged in → redirected to `/login`
- If not admin → access denied to `/dashboard`

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
   _____|______________________
  |           |                |
MongoDB    Sarvam AI        JWT Auth
(users,    (chat, STT,
 chats)     TTS)
```

All API calls are handled in `src/services/api.js` using `VITE_API_URL` from `.env`.

---

## API Services (`src/services/api.js`)

| Function | Endpoint | Description |
|----------|----------|-------------|
| `registerUser` | `POST /api/register` | Register new user |
| `loginUser` | `POST /api/login` | Login with phone |
| `verifyOtp` | `POST /api/verify-otp` | Verify OTP, receive JWT |
| `getProfile` | `GET /api/profile` | Get user profile |
| `updateProfile` | `POST /api/update` | Update profile info |
| `uploadPicture` | `POST /api/upload-picture` | Upload profile picture |
| `logoutUser` | `POST /api/logout` | Logout, clear token |
| `getDashboard` | `GET /api/admin/dashboard` | Admin metrics & users |
| `updateUserStatus` | `POST /api/admin/status` | Approve/reject user |
| `getUserDetail` | `GET /api/admin/user/:phone` | Single user detail |
| `editUser` | `PUT /api/admin/user/:phone` | Edit user |
| `deleteUser` | `DELETE /api/admin/user/:phone` | Delete user |
| `sendChatMessage` | `POST /api/chat` | Send message to AI |
| `getChatSessions` | `GET /api/chat/sessions` | Get all chat sessions |
| `getChatSession` | `GET /api/chat/:chatId` | Get single chat session |
| `deleteChatSession` | `DELETE /api/chat/:chatId` | Delete chat session |
| `clearAllChats` | `DELETE /api/chat/clear/all` | Clear all chats |
| `transcribeAudio` | `POST /api/voice/transcribe` | Speech-to-Text (STT) |
| `speakText` | `POST /api/voice/speak` | Text-to-Speech (TTS) |

---

## Authentication Flow

```text
1. User enters phone number on Login page
2. Backend sends OTP
3. User enters OTP → receives JWT token
4. Token stored in localStorage
5. PrivateRoute checks token on every protected page
6. Token sent as Bearer in every API request header
```

---

## Voice Flow

```text
STT (Speech-to-Text):
User speaks into mic
        |
        v
Audio blob sent to /api/voice/transcribe
        |
        v
Sarvam AI returns text
        |
        v
Text auto-filled in chat input

TTS (Text-to-Speech):
AI response received
        |
        v
Text sent to /api/voice/speak
        |
        v
Sarvam AI returns base64 audio
        |
        v
Audio played in browser
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