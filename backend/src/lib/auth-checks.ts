import { auth } from '@/auth';
import { Role } from '@prisma/client';
import { redirect } from 'next/navigation';

export async function checkRole(allowedRoles: Role[]) {
    const session = await auth();
    if (!session?.user?.role || !allowedRoles.includes(session.user.role)) {
        redirect('/login');
    }
    return session;
}

export async function getCurrentUser() {
    const session = await auth();
    return session?.user;
}
