'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { authenticate } from '@/lib/actions';
import { AlertCircle } from 'lucide-react';

export default function LoginForm() {
    const [errorMessage, dispatch] = useActionState(authenticate, undefined);

    return (
        <form action={dispatch} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                    name="email"
                    type="email"
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                    placeholder="user@example.com"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                    name="password"
                    type="password"
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                />
            </div>

            {errorMessage && (
                <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded-md">
                    <AlertCircle size={16} />
                    <p>{errorMessage}</p>
                </div>
            )}

            <LoginButton />
        </form>
    );
}

function LoginButton() {
    const { pending } = useFormStatus();

    return (
        <button
            key={pending ? 'pending' : 'submit'}
            aria-disabled={pending}
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
        >
            {pending ? 'Signing in...' : 'Sign in'}
        </button>
    );
}
