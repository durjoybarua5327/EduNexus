import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isProtected = nextUrl.pathname.startsWith('/dashboard') ||
                nextUrl.pathname.startsWith('/admin') ||
                nextUrl.pathname.startsWith('/teacher') ||
                nextUrl.pathname.startsWith('/student');

            if (isProtected) {
                if (isLoggedIn) return true;
                return false;
            }
            return true;
        },
        // We duplicate session logic here or just rely on auth.ts
    },
    providers: [], // Configured in auth.ts
} satisfies NextAuthConfig;
