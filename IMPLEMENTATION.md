# School ERP - Implementation Guide

## Architecture Overview

```
student-performance-analysis/
├── client/          # React + Vite + Tailwind + Redux
└── server/          # Node.js + Express + MongoDB
```

### Backend (MVC)
- **Models**: User, Student, Teacher, Parent, Attendance, Assignment, Quiz, Result, Chat, Message, Class, Subject, Department, Report, File, ActivityLog
- **Controllers**: Business logic per resource
- **Routes**: REST API with role-based protection
- **Middleware**: JWT auth, role restriction, upload, validation, error handling
- **Services**: Cloudinary, PDF, Excel export, analytics, attendance calculation
- **Socket**: Real-time chat with typing, seen status, online users

### Frontend
- **Redux Toolkit**: Auth, theme, UI state
- **Protected routes**: Role-based dashboards
- **Feature pages**: Admin, Teacher, Student, Parent portals

---

## Step-by-Step Setup

### 1. Prerequisites
- Node.js 18+
- MongoDB running locally or Atlas URI

### 2. Backend Setup
```bash
cd server
cp .env.example .env
# Edit .env with MongoDB URI, JWT secrets, Cloudinary credentials
npm install
npm run dev
```

### 3. Frontend Setup
```bash
cd client
cp .env.example .env
npm install
npm run dev
```

### 4. Create First Admin
POST `http://localhost:5000/api/auth/register`
```json
{
  "name": "Admin User",
  "email": "admin@school.com",
  "password": "admin123",
  "role": "admin"
}
```

---

## API Endpoints

| Module | Endpoints |
|--------|-----------|
| Auth | POST /auth/register, /login, /refresh-token, /logout; GET /me; PATCH /profile, /change-password |
| Users | CRUD /users (admin), GET /users/activity-logs |
| Students | CRUD /students, GET /:id/profile, GET /search/advanced |
| Attendance | POST /mark, GET /class/:id, /student/:id, /analytics |
| Assignments | CRUD + POST /:id/submit |
| Quizzes | CRUD + GET /:id/start, POST /:id/submit, GET /leaderboard |
| Analytics | GET /dashboard, /performance, /growth |
| Parent | GET /dashboard, /child/:id |
| Chat | GET/POST chats, messages |
| Reports | POST /student/:id (PDF) |
| Files | Upload, list, delete |
| Export | GET /students, /attendance (Excel/CSV) |

---

## Phases Implemented

1. **Auth + Roles** - JWT access/refresh, remember me, profile upload, activity logs
2. **Student Management** - CRUD, search, filters, profile with academic history
3. **Attendance** - Manual marking, analytics, low attendance alerts, charts
4. **Analytics** - Recharts dashboards, AI insights, rankings
5. **Parent Portal** - Child tracking, alerts, grades
6. **Assignments** - Create, submit, late tracking
7. **Quizzes** - MCQ, timer, leaderboard, negative marking
8. **Reports** - PDF student reports (PDFKit)
9. **Files** - Multer + Cloudinary
10. **Admin Dashboard** - Stats cards, growth charts
11. **Advanced Search** - GPA, attendance filters
12. **Export** - Excel/CSV via ExcelJS
13. **Real-time Chat** - Socket.io

---

## Environment Variables

### Server (.env)
- `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `CLOUDINARY_*` for file uploads
- `CLIENT_URL` for CORS

### Client (.env)
- `VITE_API_URL`, `VITE_SOCKET_URL`

---

## Next Steps (Optional Enhancements)
- Seed script for demo data (classes, departments)
- Email notifications for parent alerts
- Quiz taking UI with countdown timer component
- Student add/edit modal forms
- Unit & integration tests
