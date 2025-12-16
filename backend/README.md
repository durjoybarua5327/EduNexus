# EduNexus Backend Service

This directory contains the API and Database logic.

## Key Directories

- **`src/app/api/`**: REST API endpoints.
    - `auth/`: Authentication routes.
    - `admin/`: Admin specific features (Stats, Faculty, Batches).
    - `files/`: File system logic.
- **`src/lib/db.ts`**: Prisma Client instance.
- **`prisma/schema.prisma`**: Database Schema definition.

## Commands

- `npm run dev`: Starts the server on port 3001 and pushes DB schema changes.
- `npx prisma studio`: UI to view/edit database records.
