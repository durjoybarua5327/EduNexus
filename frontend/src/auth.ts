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
                            // Normalize the user object here to ensure all fields are available
                            const user = data.user;
                            return {
                                ...user,
                                id: user.id || user._id, // Handle potential id mismatches
                                departmentId: user.departmentId || user.department_id, // Handle DB field casing
                                department_id: user.departmentId || user.department_id, // ensure both exist for downstream compatibility
                            };
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
});
