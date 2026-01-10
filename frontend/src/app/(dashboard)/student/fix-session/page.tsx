"use client";

import { useEffect, useState } from "react";
import { RefreshCw, LogOut } from "lucide-react";

export default function FixSessionPage() {
    const [status, setStatus] = useState<'checking' | 'needs_fix' | 'fixing' | 'done'>('checking');
    const [dbValue, setDbValue] = useState<any>(null);
    const [sessionValue, setSessionValue] = useState<any>(null);

    useEffect(() => {
        checkSession();
    }, []);

    const checkSession = async () => {
        try {
            const res = await fetch('/api/debug/check-topcr');
            const data = await res.json();

            setDbValue(data.database);
            setSessionValue(data.session);

            // Check if there's a mismatch
            const dbHasTopCR = data.database?.isTopCR === 1;
            const sessionHasTopCR = data.session?.isTopCR === true;

            if (dbHasTopCR && !sessionHasTopCR) {
                setStatus('needs_fix');
            } else if (sessionHasTopCR) {
                setStatus('done');
            } else {
                setStatus('needs_fix');
            }
        } catch (error) {
            console.error('Error checking session:', error);
        }
    };

    const fixSession = async () => {
        setStatus('fixing');

        // Wait 1 second to show the status
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Redirect to logout which will clear the session
        window.location.href = '/api/auth/signout?callbackUrl=/login?message=Session refreshed. Please login again.';
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
            <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <RefreshCw className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 mb-2">Session Fix Tool</h1>
                    <p className="text-slate-600">Automatically refresh your session to enable Top CR features</p>
                </div>

                {/* Status Display */}
                <div className="space-y-4 mb-8">
                    <div className="bg-slate-50 rounded-xl p-6">
                        <h3 className="font-bold text-slate-900 mb-3">Current Status:</h3>

                        {status === 'checking' && (
                            <div className="flex items-center gap-3 text-blue-600">
                                <RefreshCw className="w-5 h-5 animate-spin" />
                                <span>Checking your session...</span>
                            </div>
                        )}

                        {status === 'needs_fix' && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-amber-600">
                                    <div className="w-2 h-2 bg-amber-600 rounded-full animate-pulse"></div>
                                    <span className="font-bold">Session needs to be refreshed</span>
                                </div>
                                <div className="text-sm text-slate-600 bg-white rounded-lg p-4">
                                    <p className="mb-2"><strong>Database:</strong> isTopCR = {dbValue?.isTopCR || 'null'}</p>
                                    <p><strong>Session:</strong> isTopCR = {sessionValue?.isTopCR ? 'true' : 'undefined'}</p>
                                </div>
                            </div>
                        )}

                        {status === 'fixing' && (
                            <div className="flex items-center gap-3 text-indigo-600">
                                <RefreshCw className="w-5 h-5 animate-spin" />
                                <span>Refreshing your session...</span>
                            </div>
                        )}

                        {status === 'done' && (
                            <div className="flex items-center gap-3 text-green-600">
                                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                                <span className="font-bold">✅ Session is up to date!</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Button */}
                {status === 'needs_fix' && (
                    <div className="space-y-4">
                        <button
                            onClick={fixSession}
                            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
                        >
                            <LogOut className="w-5 h-5" />
                            Fix Session Now (Auto Logout & Redirect)
                        </button>
                        <p className="text-sm text-slate-500 text-center">
                            This will log you out and redirect to login. After logging in again, your Top CR features will work!
                        </p>
                    </div>
                )}

                {status === 'done' && (
                    <div className="space-y-4">
                        <a
                            href="/student/batch"
                            className="block w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all text-center"
                        >
                            Go to Batch Page →
                        </a>
                        <p className="text-sm text-green-600 text-center font-medium">
                            ✅ Your session is ready! All buttons should now be visible.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
