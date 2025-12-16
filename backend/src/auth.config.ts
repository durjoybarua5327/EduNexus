import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;

            // Protect dashboard routes
            // Note: More granular role checks will happen in middleware or per-page
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
                // @ts-ignore // We will extend the type definition later
                session.user.role = token.role;
            }
            return session;
        },
        jwt({ token, user }) {
            if (user) {
                // @ts-ignore
                token.role = user.role;
            }
            return token;
        }
    },
    providers: [], // Configured in auth.ts to avoid Node.js modules in middleware
} satisfies NextAuthConfig;
