# EduNexus Academic Portal

Welcome to **EduNexus**, a comprehensive Department Hub and Academic Portal designed for universities. This system facilitates interaction between Students, Teachers, and Administrators through a unified platform.

## 📂 Project Structure

The project is organized as a monorepo with two main applications:

- **`frontend/`**: The User Interface service built with Next.js (App Router) and Tailwind CSS.
- **`backend/`**: The API, Authentication, and Database service built with Next.js (API Routes), Prisma, and MySQL.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MySQL Database

### 1. Setup Backend
The backend handles the data connection.

```bash
cd backend
npm install
# Configure .env:
# DATABASE_URL="mysql://..."
# AUTH_SECRET="supersecret" (Must match Frontend)
# Initialize Database
npx prisma db push
# Seed Initial Data (Admin/Student)
npx tsx prisma/seed.ts
# Start Server (Port 3001)
npm run dev
```

### 2. Setup Frontend
The frontend consumes the Backend API.

```bash
cd frontend
npm install
# Start Server (Port 3000)
npm run dev
```



## 🛠 Tech Stack
- **Framework**: Next.js 15
- **Language**: TypeScript
- **Database**: MySQL + Prisma ORM
- **Auth**: NextAuth.js
- **Styling**: Tailwind CSS
