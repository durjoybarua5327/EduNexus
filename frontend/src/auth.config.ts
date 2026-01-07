import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            // @ts-ignore
            const role = auth?.user?.role;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');

            // 1. Redirect authenticated users from generic /dashboard to role-specific pages
            if (isLoggedIn && (nextUrl.pathname === '/dashboard' || nextUrl.pathname === '/' || nextUrl.pathname === '/login')) {
                if (role === 'STUDENT' || role === 'CR') {
                    return Response.redirect(new URL('/student/home', nextUrl));
                } else if (role === 'TEACHER') {
                    return Response.redirect(new URL('/teacher/courses', nextUrl));
                } else if (role === 'DEPT_ADMIN') {
                    return Response.redirect(new URL('/admin/overview', nextUrl));
                } else if (role === 'SUPER_ADMIN') {
                    return Response.redirect(new URL('/superadmin', nextUrl));
                }
            }

            // 2. Protect routes
            const isProtected = nextUrl.pathname.startsWith('/dashboard') ||
                nextUrl.pathname.startsWith('/admin') ||
                nextUrl.pathname.startsWith('/teacher') ||
                nextUrl.pathname.startsWith('/student');

            if (isProtected) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            }
            return true;
        },
        session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
                // @ts-ignore
                session.user.role = token.role;
                // @ts-ignore
                session.user.departmentId = token.departmentId;
                // @ts-ignore
                session.user.isTopDepartmentAdmin = token.isTopDepartmentAdmin;
            }
            return session;
        },
        jwt({ token, user }) {
            if (user) {
                // @ts-ignore
                token.role = user.role;
                // @ts-ignore
                token.departmentId = user.departmentId;
                // @ts-ignore
                token.isTopDepartmentAdmin = user.isTopDepartmentAdmin;
            }
            return token;
        }
    },
    providers: [], // Configured in auth.ts to avoid Node.js modules in middleware
} satisfies NextAuthConfig;
