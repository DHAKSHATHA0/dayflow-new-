# Dayflow – Human Resource Management System (HRMS)

> *“Every workday, perfectly aligned.”*

Dayflow is a full-stack, enterprise-grade Human Resource Management System built to digitize and streamline employee onboarding, verified attendance tracking, leave approval workflows, payroll structures, notification alerts, and executive HR analytics.

---

## 🌟 Key Features

### 👤 Role 1: Admin / HR Officer
- **Executive HR Dashboard**: Real-time workforce metrics, attendance pulse charts, pending leave review queues, and employee quick switchers.
- **Employee Directory**: Full CRUD management (onboarding new hires, editing job titles, locations, compensation packages, and deactivating profiles).
- **Attendance Center**: Live overview of in-office, remote, late starts, and absent employees with daily/weekly logs and CSV export.
- **Leave Management**: Review inbox with one-click approval, structured rejection dialogs with required comments, and automatic employee alerts.
- **Compensation & Payroll**: Audit salary structures (Basic + Allowances - Deductions = Net Pay) with immutable `SalaryHistory` tracking and CSV exports.
- **Reports & Analytics**: Visual charts powered by Recharts (Department distribution, attendance trends, leave type quotas, and payroll spend).
- **System Settings**: Configurable organization details, standard shift timings, and annual leave quotas.

### 👥 Role 2: Employee
- **Personal Dashboard**: Greeting with live date, attendance status indicator, remaining paid/sick leave balances, and salary summary.
- **Live Clock & Attendance**: One-tap Check-In and Check-Out with duplicate check-in prevention, auto working hours calculation, and weekly logs.
- **Time Away (Leave)**: Apply for Paid, Sick, or Unpaid leave with date-range picker, automatic day calculator, overlap checks, and admin feedback timeline.
- **Payroll & Pay Slip**: Read-only breakdown of earnings, statutory taxes/deductions, and net salary advice with a printable **Dayflow Salary Slip**.
- **Verified Profile**: Edit personal contact information (phone, address, date of birth, avatar) while viewing official job and document details.
- **In-App Notifications**: Real-time bell dropdown with unread indicators for leave decisions, attendance events, and compensation updates.

---

## 🛠 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS, Lucide React, Recharts, Sonner Toasts, Wouter, Axios |
| **Backend** | Node.js, Express.js, TypeScript, REST Architecture, Zod Validation |
| **Database & ORM** | PostgreSQL, Prisma ORM, Bcrypt.js, JSON Web Tokens (JWT) |
| **Design Aesthetics** | Warm cream (`#f2eee5`), deep forest green (`#173d38`), clay terracotta (`#d47f68`), DM Sans, Playfair Display Serif, DM Mono |

---

## 🗄 Database Schema (Prisma)

- **`User`**: Authentication credentials, role (`employee` | `admin`), email verification, reset tokens.
- **`EmployeeProfile`**: Detailed employment info, contact data, manager, department, designation, colors, and initials.
- **`Attendance`**: Verified check-in, check-out, working hours, and status (`present`, `late`, `remote`, `half_day`, `absent`).
- **`LeaveRequest`**: Leave applications, dates, calculated days, status (`pending`, `approved`, `rejected`), and admin notes.
- **`Salary`**: Active compensation structure (Basic, Allowances, Deductions, Net Salary).
- **`SalaryHistory`**: Immutable historical audit log of every compensation revision.
- **`Notification`**: In-app alerts linked to user actions.
- **`Document`**: Employment agreements, contracts, and ID proofs.
- **`Setting`**: Organization configurations and work shift rules.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18+ (v20+ recommended)
- **PostgreSQL**: Running locally on port 5432 (or remote connection string)

### 2. Environment Configuration
Copy the `.env.example` file to `backend/.env`:
```bash
# backend/.env
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dayflow_db?schema=public"
JWT_SECRET="dayflow_super_secret_jwt_key_2025_hrms_flow"
JWT_EXPIRES_IN="7d"
CLIENT_URL="http://localhost:5173"
```

### 3. Database Migration & Seeding
From the `backend` folder:
```bash
cd backend
npm install
npx prisma db push
npm run prisma:seed
```

### 4. Running the Backend Server
```bash
cd backend
npm run dev
# Server will start on http://localhost:5000
```

### 5. Running the Frontend App
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
# App will start on http://localhost:5173
```

---

## 🔑 Default Development Credentials

| Role | Email / ID | Password | Notes |
|---|---|---|---|
| **Admin / HR Officer** | `admin@dayflow.com` | `Admin@123` | Full access to all HR operations & approvals |
| **Sample Employee 1** | `maya.chen@dayflow.co` (or `DF-1042`) | `Employee@123` | Product Designer |
| **Sample Employee 2** | `jon.bell@dayflow.co` (or `DF-1088`) | `Employee@123` | Frontend Engineer |
| **Sample Employee 3** | `priya.nair@dayflow.co` (or `DF-1091`) | `Employee@123` | Data Analyst |

---

## 🧪 Automated Testing

To run the backend integration test suite:
```bash
cd backend
npm test
```
The test suite validates:
1. Admin & Employee login with JWT generation
2. Unauthorized access rejection (401)
3. Role-based access control (403 on admin-only routes)
4. Real attendance check-in & duplicate check-in prevention
5. Leave application, duration calculation, and admin approval
6. Dynamic salary calculation & history log generation
7. Analytics and report generation

---

## 📂 Project Architecture

```
DAFH/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema definition
│   │   └── seed.ts             # Seed script with realistic employee data
│   ├── src/
│   │   ├── config/             # Prisma client instance
│   │   ├── controllers/        # Auth, Employee, Profile, Attendance, Leave, Payroll, Reports, Settings
│   │   ├── middleware/         # JWT Auth, Role Guard, Error Handler
│   │   ├── routes/             # REST API routers
│   │   ├── services/           # Notification & alert engine
│   │   ├── tests/              # Automated API tests
│   │   ├── validators/         # Zod input validation schemas
│   │   └── index.ts            # Express server entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── api/                # Central Axios client & API services
│   │   ├── components/         # UI components, cards, tables, badges
│   │   ├── context/            # Auth & App state management
│   │   ├── types/              # TypeScript interfaces matching backend models
│   │   ├── App.tsx             # Complete application routing & pages
│   │   └── index.css           # Preserved theme tokens and typography
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── .env.example
├── package.json
└── README.md
```