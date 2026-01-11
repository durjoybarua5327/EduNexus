# EduNexus - Department Management System

EduNexus is a comprehensive web-based platform designed to streamline department management in educational institutions. It facilitates seamless interaction between Students, Faculty, Department Admins, and Super Admins.

## 📱 Demos

### 👨‍🎓 Student & CR Panel

![Student Panel - Dashboard](Demos/image1.png)
![Student Panel - Courses](Demos/image2.png)
![Student Panel - Resources](Demos/image3.png)
![Student Panel - Notices](Demos/image4.png)
![CR Panel - Class Management](Demos/image5.png)
![CR Panel - Post Notice](Demos/image6.png)
![CR Panel - Batch View](Demos/image7.png)

### 👨‍🏫 Faculty/Teacher Panel

![Teacher Panel - Dashboard](Demos/image8.png)
![Teacher Panel - My Courses](Demos/image9.png)
![Teacher Panel - Course Materials](Demos/image10.png)
![Teacher Panel - Post Notice](Demos/image11.png)
![Teacher Panel - Class Notices](Demos/image12.png)
![Teacher Panel - File Management](Demos/image13.png)
![Teacher Panel - Course Details](Demos/image14.png)

### 🏛️ Department Admin Panel

![Dept Admin - Overview](Demos/image15.png)
![Dept Admin - Batches](Demos/image16.png)
![Dept Admin - Faculty Management](Demos/image17.png)
![Dept Admin - Academics](Demos/image18.png)
![Dept Admin - Courses](Demos/image19.png)
![Dept Admin - Notices](Demos/image20.png)
![Dept Admin - History](Demos/image21.png)

### 👨‍💻 Super Admin Panel

![Super Admin - Global Overview](Demos/image22.png)
![Super Admin - University Management](Demos/image23.png)
![Super Admin - Department Controls](Demos/image24.png)
![Super Admin - System Settings](Demos/image25.png)

## ⚡ Prerequisites

Before running the project, ensure you have the following installed:

*   **Node.js** (v18 or higher)
*   **MySQL Server** (Running locally or remotely)

## 🚀 Installation Process

Follow these steps to set up the project locally.

### 1. Clone the Repository

```bash
git clone https://github.com/your-repo/EduNexus.git
cd EduNexus
```

### 2. Setup the Backend

```bash
cd backend
npm install
```

**Configuration:**
Create a `.env` file in the `backend` directory with your database credentials:

```env
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/edunexus"
PORT=3001
```

**Run Server:**

```bash
npm run dev
```

*The backend will automatically initialize the database and tables on the first run.*

### 3. Setup the Frontend

Open a new terminal and navigate to the `frontend` directory:

```bash
cd frontend
npm install
```

**Configuration:**
Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXTAUTH_SECRET=your_secret_key_here
NEXTAUTH_URL=http://localhost:3000
```

**Run Client:**

```bash
npm run dev
```

### 4. Access the App

Open your browser and visit:
*   **Frontend:** `http://localhost:3000`
*   **Backend API:** `http://localhost:3001`

## 🔑 Default Login Credentials

After the first run, you can login with the default Super Admin account:

*   **Email:** `durjoybarua8115@gmail.com`
*   **Password:** `53278753905678`

## 🎯 Features

### For Students & CRs
- 📚 View enrolled courses and semester-wise materials
- 📢 Receive class and departmental notices
- 📁 Access course resources organized by semester
- 👥 CR-specific batch management capabilities

### For Faculty/Teachers
- 📝 Create and manage course materials
- 📢 Post course-specific notices to targeted batches
- 📂 Upload and organize teaching resources
- 👨‍🎓 View enrolled students

### For Department Admins
- 🏫 Manage batches, courses, and semesters
- 👨‍🏫 Add and manage faculty members
- 📊 View department statistics and activity
- 📢 Post departmental announcements
- 📜 Track audit logs

### For Super Admins
- 🌐 Manage multiple universities and departments
- 👥 System-wide user management
- 🔒 Moderation and access control
- 📊 Global analytics and reporting

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **NextAuth.js** - Authentication
- **TailwindCSS** - Styling
- **Lucide Icons** - Icon library

### Backend
- **Next.js API Routes** - Backend API
- **MySQL** - Database
- **bcryptjs** - Password hashing
- **mysql2** - Database driver

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Durjoy Barua**
- GitHub: [@durjoybarua5327](https://github.com/durjoybarua5327)

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## ⭐ Show your support

Give a ⭐️ if this project helped you!
