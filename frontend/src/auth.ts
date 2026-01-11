import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { authConfig } from './auth.config';

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    trustHost: true,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;

                    try {
                        const res = await fetch('http://127.0.0.1:3001/api/login', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email, password })
                        });

                        const data = await res.json();

                        if (res.ok && data.user) {
                            const user = data.user;
                            return {
                                ...user,
                                id: user.id || user._id,
                                departmentId: user.departmentId || user.department_id,
                                department_id: user.departmentId || user.department_id,
                            };
                        }
                    } catch (e) {
                        console.error("Auth Failed (Fetch Error)", e);
                    }
                }
                return null;
            }
        })
    ],
});
