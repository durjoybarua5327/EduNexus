# EduNexus Frontend Client

This directory contains the User Interface.

## Architecture

- **Auth**: Uses NextAuth Client to manage sessions. Authenticates against Backend API.
- **Data**: Fetches data from `http://localhost:3001/api`.
- **BFF (Backend for Frontend)**: Uses Server Actions (`src/lib/actions`) to proxy requests to the Backend, keeping secrets secure and handling CORS conceptually.

## Key Directories

- **`src/app/`**: Pages and Layouts.
    - `(dashboard)`: Protected routes (Student/Admin dashboards).
    - `login`: Authentication page.
- **`src/components/`**: Reusable UI components (Flat structure).
    - `Navbar`, `Sidebar`: Navigation.
    - `FolderBrowser`: Data visualization.
- **`src/lib/api.ts`**: Fetch wrapper for Backend API calls.

## Commands

- `npm run dev`: Starts the server on port 3000.

## Environment Variables (.env)
- `AUTH_SECRET`: Must match the Backend's secret to share session/cookies.
- `NEXTAUTH_URL`: http://localhost:3000
