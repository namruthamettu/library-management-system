# Central Library Management System (MERN Stack)

A complete, enterprise-grade, full-stack **Library Management System** built with **MongoDB, Express.js, React.js (Vite), and Node.js**.

Designed specifically for university and college campuses, the application provides digital book cataloging, automated circulation workflows, role-based access control (Admin, Librarian, Member, Guest), a First-Come First-Served (FIFO) reservation queue with 48-hour pickup window timers, automated overdue fine assessments, email and in-app alerts, dynamic settings, and report export engines for PDF and CSV documents.

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                              │
│                    React.js 18 + Vite + Tailwind CSS                   │
│   • Public Portal (Catalog Browsing, Details, Search & Filters)        │
│   • Member Portal (Active Loans, 1-Click Renewals, Queues, Fines)     │
│   • Librarian Desk (Book Issue, Return Counter, Overdue Management)    │
│   • Admin Console (Staff Governance, Dynamic Policies, Audit Reports)   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Axios REST Calls (JWT Bearer Token)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        APPLICATION / API LAYER                         │
│                          Node.js + Express.js                          │
│   • JWT Authentication & Role Authorization Middleware (RBAC)          │
│   • Express-Validator Input Sanitization & Centralized Error Handler   │
│   • Multer Storage for Book Cover Image Uploads                        │
│   • Scheduled Automation Engine (node-cron):                           │
│       - Daily 08:00 AM: Due Date Reminders (48h prior)                 │
│       - Daily 00:05 AM: Overdue Detection & Fine Calculation           │
│       - Hourly (Min 0): 48-Hour Reservation Expiry & FIFO Queue Handoff │
│   • Nodemailer Email Service with HTML Campus Templates                │
│   • Report Generators (PDFKit Document Streamer & RFC 4180 CSV Engine)  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Mongoose ODM
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                             DATABASE LAYER                             │
│                      MongoDB (Atlas / Community)                       │
│   • Collections: users, books, categories, transactions,               │
│                  reservations, settings, notifications                 │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start Guide (Windows / Visual Studio Code)

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **MongoDB**: Either local MongoDB Community Server or free cloud [MongoDB Atlas](https://www.mongodb.com/atlas) cluster.
- **Git**: Installed for version control.

---

### 2. Configure Environment Variables

Open or edit `backend/.env`:
```env
PORT=5000
NODE_ENV=development

# MongoDB Connection String (Local or Atlas)
MONGO_URI=mongodb://127.0.0.1:27017/library_management
# For MongoDB Atlas:
# MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/library_management?retryWrites=true&w=majority

# JWT Token Secret
JWT_SECRET=supersecretjwtkey_library_management_system_2026_change_in_production
JWT_EXPIRES_IN=7d

# Nodemailer SMTP Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=library.system.demo@gmail.com
EMAIL_PASS=demopassword123
EMAIL_FROM="Central Library" <no-reply@library.edu>

# Frontend Client Origin
CLIENT_URL=http://localhost:5173
```

---

### 3. Install Dependencies & Seed Initial Database

From the project root (`c:\Users\Namrutha M\Desktop\library`), run in PowerShell:

```powershell
# 1. Install root, backend, and frontend packages
npm install
npm install --prefix backend
npm install --prefix frontend

# 2. Seed default users, categories, sample books, and settings
npm run seed
```

#### Pre-Configured Demo Accounts:
| Role | Email | Password | Institutional ID | Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin@library.edu` | `Admin@123` | `ADM-001` | Full system control, staff CRUD, policy settings, analytics |
| **Librarian** | `librarian@library.edu` | `Librarian@123` | `LIB-001` | Issue/Return counter, book management, overdue management, reports |
| **Member** | `student@library.edu` | `Student@123` | `MEM-10001` | Catalog borrowing, loan renewals, reservations waitlist, fines |

---

### 4. Running the Development Servers

You can launch both the Node backend and React frontend concurrently with a single command from the project root:

```powershell
npm run dev
```

Or run them in separate terminals:

**Terminal 1 (Backend API):**
```powershell
cd backend
npm run dev
# Server running at http://localhost:5000
# Health check: http://localhost:5000/api/health
```

**Terminal 2 (Frontend Client):**
```powershell
cd frontend
npm run dev
# Client running at http://localhost:5173
```

Open your browser to: **`http://localhost:5173`**

---

## 🧪 Functional Testing Verification

The project includes an automated test runner verifying all 20 required test cases specified in Section 10:

```powershell
npm test
```

### Verification Checklist:
1. `[PASS]` Case 1: Successful member registration
2. `[PASS]` Case 2: Duplicate email rejection
3. `[PASS]` Case 3: Successful login & JWT issuance
4. `[PASS]` Case 4: Invalid password rejection
5. `[PASS]` Case 5: Unauthorized route access rejection (Member blocked from Admin endpoints)
6. `[PASS]` Case 6: Successful book creation
7. `[PASS]` Case 7: Duplicate ISBN rejection
8. `[PASS]` Case 8: Book search by title, author, and ISBN
9. `[PASS]` Case 9: Successful book issue
10. `[PASS]` Case 10: Reject issuing unavailable books (0 available copies)
11. `[PASS]` Case 11: Reject issuing beyond borrowing limit
12. `[PASS]` Case 12: Successful book return
13. `[PASS]` Case 13: Correct fine calculation ($\text{Overdue Days} \times \text{Fine Per Day}$)
14. `[PASS]` Case 14: Successful fine payment settlement
15. `[PASS]` Case 15: Successful book reservation (FIFO queue position)
16. `[PASS]` Case 16: Reservation queue processing (Held for 48 hours for waiting member)
17. `[PASS]` Case 17: Reservation expiry handling after 48-hour pickup deadline
18. `[PASS]` Case 18: Book renewal (Single-renewal guard & reservation check)
19. `[PASS]` Case 19: Dashboard statistics aggregation
20. `[PASS]` Case 20: CSV and PDF report generation

---

## ☁️ Deployment Guide

### A. Database (MongoDB Atlas)
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create database user credentials under **Database Access**.
3. Under **Network Access**, whitelist `0.0.0.0/0` (Allow Access from Anywhere).
4. Copy the connection string and paste into `MONGO_URI`.

### B. Backend Deployment (Render)
1. Push repository to GitHub.
2. Sign in to [Render](https://render.com) and click **New > Web Service**.
3. Connect your repository.
4. Set:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Add Environment Variables: `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL`, etc.

### C. Frontend Deployment (Vercel / Netlify)
1. On [Vercel](https://vercel.com), click **Add New > Project** and select your GitHub repository.
2. Set:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add Environment Variable:
   - `VITE_API_BASE_URL`: `https://your-backend.onrender.com/api`
4. Deploy!

---

## 📄 License
MIT License • Engineered for Academic Institutions
