import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnLoginPage = nextUrl.pathname === '/login';
            const isOnDashboard = nextUrl.pathname === '/dashboard';

            // Protected routes check
            const isProtected = nextUrl.pathname.startsWith('/dashboard') ||
                nextUrl.pathname.startsWith('/admin') ||
                nextUrl.pathname.startsWith('/superadmin') ||
                nextUrl.pathname.startsWith('/teacher') ||
                nextUrl.pathname.startsWith('/student');

            // 1. Redirect to Role Dashboard if logged in and on Login or Generic Dashboard
            if (isLoggedIn && (isOnLoginPage || isOnDashboard)) {
                // @ts-ignore
                const role = auth.user.role;
                let redirectPath = '/dashboard'; // Default

                if (role === 'SUPER_ADMIN') {
                    redirectPath = '/superadmin';
                } else if (role === 'DEPT_ADMIN') {
                    redirectPath = '/admin/overview';
                } else if (role === 'TEACHER') {
                    redirectPath = '/teacher/courses';
                } else if (role === 'STUDENT' || role === 'CR') {
                    redirectPath = '/dashboard/semester';
                }

                // AVOID LOOP: Only redirect if we are NOT already on the right path
                if (nextUrl.pathname !== redirectPath) {
                    return Response.redirect(new URL(redirectPath, nextUrl));
                }
            }

            // 2. Protect routes
            if (isProtected) {
                if (isLoggedIn) return true;
                return false; // Redirect to login
            }
            return true;
        },
    },
    providers: [], // Configured in auth.ts
} satisfies NextAuthConfig;
