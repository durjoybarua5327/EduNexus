# EduNexus - Department Management System

EduNexus is a comprehensive web-based platform designed to streamline department management in educational institutions. It facilitates seamless interaction between Students, Faculty, Department Admins, and Super Admins.

## 🚀 Features

### 🔐 Authentication & Security
- **Role-Based Access Control (RBAC)**: Distinct panels for Student, Teacher, Dept Admin, Super Admin.
- **Secure Login**: JWT-based authentication with `bcryptjs` password hashing.
- **Frontend Protection**: Protected routes using `next-auth`.

### 🎓 Student & Academic Management
- **Batches & Sections**: Organize students into batches (Year, Semester, Section).
- **Class Representatives (CR)**: Assign/Revoke CR roles (Max 4 per batch).
- **Routine Management**: View class schedules and exam routines.
- **Notices**: Pin important announcements with priority levels (Low, Medium, High).

### 👩‍🏫 Faculty Management
- **Teacher Profiles**: Manage faculty details, designations, and contact info.
- **Course Assignment**: Assign specific courses and semesters to teachers.

### 🛠️ Admin Dashboard
- **User Management**: Create/Edit/Ban users (Students, Teachers, Admins).
- **Dept Admin Controls**: Manage batches, courses, and department-specific settings.
- **Super Admin**: Oversee multiple departments and top-level configurations.
- **Rate Limiting**: 5-second cooldown on critical creation actions (Notices, Batches, Admins) to prevent spam.

### 🎨 Modern UI/UX
- **Responsive Design**: Built with Tailwind CSS for mobile-first responsiveness.
- **Interactive Components**: 
    - `react-hot-toast` for real-time notifications.
    - Custom `ConfirmationModal` for critical actions (Deletions, Bans).
    - Glassmorphism effects and smooth transitions.

## 🛠️ Technology Stack

### Frontend
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State/Notifications**: React Hooks, React Hot Toast
- **Auth**: NextAuth.js

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js (Custom Server Entry)
- **Database**: MySQL (using `mysql2` driver with Raw SQL)
- **Password Has**: bcryptjs
- **Validation**: Zod (Frontend & Backend)

## 📂 Project Structure

```
EduNexus/
├── Frontend/           # Next.js Application
│   ├── src/app/        # App Router Pages
│   └── src/components/ # Reusable UI Components
├── Backend/            # Express.js Server
│   ├── src/app/api/    # API Routes
│   ├── src/lib/        # DB Connection & Init
│   └── server.ts       # Entry Point
└── README.md           # Project Documentation
```

## ⚡ Getting Started

### Prerequisites
- Node.js (v18+)
- MySQL Server

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-repo/EduNexus.git
    cd EduNexus
    ```

2.  **Setup the Backend**
    ```bash
    cd Backend
    npm install
    # Configure .env file with DB_USER, DB_PASSWORD, DB_NAME
    npm run dev
    ```
    *The backend will automatically initialize the database and tables on first run.*

3.  **Setup the Frontend**
    ```bash
    cd ../Frontend
    npm install
    # Configure .env.local with NEXTAUTH_SECRET and Backend URL
    npm run dev
    ```

4.  **Access the App**
    - Frontend: `http://localhost:3000`
    - Backend API: `http://localhost:4000` (or configured port)

## 🛡️ Admin Credentials (Default Seeding)
*Check `backend/src/lib/seed.ts` (if available) or logs for initial admin credentials.*

## 🤝 Contributing
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
