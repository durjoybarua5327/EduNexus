import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';

export const { auth, signIn, signOut, handlers } = NextAuth({
    trustHost: true,
    pages: {
        signIn: '/login',
    },
    providers: [
        Credentials({
            async authorize(credentials) {
                console.log('Credentials received:', credentials);
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    console.log('Parsed credentials valid. Fetching backend...');

                    try {
                        const res = await fetch('http://127.0.0.1:3001/api/login', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email, password })
                        });

                        console.log('Backend response status:', res.status);
                        const data = await res.json();
                        console.log('Backend data:', data);

                        if (res.ok && data.user) {
                            console.log('Login successful, returning user.');
                            return data.user;
                        } else {
                            console.error('Login failed or no user data:', data);
                        }
                    } catch (e) {
                        console.error("Auth Failed (Fetch Error)", e);
                    }
                } else {
                    console.error('Invalid credentials format');
                }
                return null;
            }
        })
    ],
    callbacks: {
        async signIn({ user }) {
            // Allow sign in
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
    }
});
