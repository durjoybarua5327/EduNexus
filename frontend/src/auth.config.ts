import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnLoginPage = nextUrl.pathname === '/login';
            const isProtected = nextUrl.pathname.startsWith('/dashboard') ||
                nextUrl.pathname.startsWith('/admin') ||
                nextUrl.pathname.startsWith('/superadmin') ||
                nextUrl.pathname.startsWith('/teacher') ||
                nextUrl.pathname.startsWith('/student');

            // If user is logged in and tries to access login page, redirect to their dashboard
            if (isOnLoginPage && isLoggedIn) {
                // @ts-ignore
                const role = auth.user.role;
                let redirectPath = '/dashboard';

                if (role === 'SUPER_ADMIN') {
                    redirectPath = '/superadmin/overview';
                } else if (role === 'DEPT_ADMIN') {
                    redirectPath = '/admin/overview';
                } else if (role === 'TEACHER') {
                    redirectPath = '/teacher/dashboard';
                } else if (role === 'STUDENT' || role === 'CR') {
                    redirectPath = '/student/dashboard';
                }

                return Response.redirect(new URL(redirectPath, nextUrl));
            }

            if (isProtected) {
                if (isLoggedIn) return true;
                return false;
            }
            return true;
        },
    },
    providers: [], // Configured in auth.ts
} satisfies NextAuthConfig;
