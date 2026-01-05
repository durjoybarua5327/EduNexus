# EduNexus - Department Management System

EduNexus is a comprehensive web-based platform designed to streamline department management in educational institutions. It facilitates seamless interaction between Students, Faculty, Department Admins, and Super Admins.

## 📱 Demos

<div align="center">
  <img src="demos/image1.png" alt="Demo 1" width="45%" style="margin: 5px;" />
  <img src="demos/image2.png" alt="Demo 2" width="45%" style="margin: 5px;" />
  <img src="demos/image3.png" alt="Demo 3" width="45%" style="margin: 5px;" />
  <img src="demos/image4.png" alt="Demo 4" width="45%" style="margin: 5px;" />
</div>
<br/>
<div align="center">
  <img src="demos/image5.png" alt="Demo 5" width="30%" style="margin: 5px;" />
  <img src="demos/image6.png" alt="Demo 6" width="30%" style="margin: 5px;" />
  <img src="demos/image7.png" alt="Demo 7" width="30%" style="margin: 5px;" />
</div>

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
cd Backend
npm install
```

**Configuration:**
Create a `.env` file in the `Backend` directory with your database credentials:

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

Open a new terminal and navigate to the `Frontend` directory:

```bash
cd ../Frontend
npm install
```

**Configuration:**
Create a `.env.local` file in the `Frontend` directory:

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
