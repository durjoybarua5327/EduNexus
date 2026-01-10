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
            const pathname = nextUrl.pathname;

            // 1. Initial Redirects
            if (isLoggedIn && (pathname === '/dashboard' || pathname === '/' || pathname === '/login')) {
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

            // 2. Strict Role Enforcement
            if (isLoggedIn) {
                // Prevent students from accessing admin/teacher routes
                if ((role === 'STUDENT' || role === 'CR') &&
                    (pathname.startsWith('/admin') || pathname.startsWith('/teacher') || pathname.startsWith('/superadmin'))) {
                    return Response.redirect(new URL('/student/home', nextUrl));
                }

                // Prevent teachers from accessing admin/student routes (except shared ones if any)
                // Prevent teachers from accessing admin/student routes (except shared ones if any)
                if (role === 'TEACHER') {
                    if (pathname.startsWith('/admin') || pathname.startsWith('/superadmin')) {
                        return Response.redirect(new URL('/teacher/courses', nextUrl));
                    }
                    // Block student routes except profile (which is shared)
                    if (pathname.startsWith('/student') && !pathname.startsWith('/student/profile')) {
                        return Response.redirect(new URL('/teacher/courses', nextUrl));
                    }
                }

                // Prevent Dept Admins from accessing other domains
                if (role === 'DEPT_ADMIN') {
                    if (pathname.startsWith('/superadmin') || pathname.startsWith('/student') || pathname.startsWith('/teacher')) {
                        return Response.redirect(new URL('/admin/overview', nextUrl));
                    }
                }

                // Prevent Super Admins from accessing other domains (optional but good for strictness)
                if (role === 'SUPER_ADMIN') {
                    if (pathname.startsWith('/admin') || pathname.startsWith('/student') || pathname.startsWith('/teacher')) {
                        return Response.redirect(new URL('/super/universities', nextUrl));
                    }
                }
            }

            // 3. Protect routes from unauthenticated users
            const isProtected = pathname.startsWith('/dashboard') ||
                pathname.startsWith('/admin') ||
                pathname.startsWith('/teacher') ||
                pathname.startsWith('/student') ||
                pathname.startsWith('/superadmin');

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

                // Robust normalization for departmentId
                // @ts-ignore
                session.user.departmentId = token.departmentId || token.department_id;

                // @ts-ignore
                session.user.isTopDepartmentAdmin = token.isTopDepartmentAdmin;
            }
            return session;
        },
        jwt({ token, user }) {
            if (user) {
                // @ts-ignore
                token.role = user.role;

                // Robust normalization for departmentId from user object
                // @ts-ignore
                token.departmentId = user.departmentId || user.department_id;
                // @ts-ignore
                token.department_id = user.departmentId || user.department_id; // Store both to be safe

                // @ts-ignore
                token.isTopDepartmentAdmin = user.isTopDepartmentAdmin;
            }
            return token;
        }
    },
    providers: [], // Configured in auth.ts to avoid Node.js modules in middleware
} satisfies NextAuthConfig;
