"use client";

import { useUser } from "@/context/user-context";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export default function DebugCRPage() {
    const { user } = useUser();

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
                <h1 className="text-2xl font-black text-slate-900 mb-6">CR Debug Information</h1>

                <div className="space-y-4">
                    <DebugRow
                        label="User Loaded"
                        value={!!user}
                        details={user ? "✅" : "❌ User context not loaded"}
                    />

                    <DebugRow
                        label="User ID"
                        value={!!user?.id}
                        details={user?.id || "Not available"}
                    />

                    <DebugRow
                        label="Email"
                        value={!!user?.email}
                        details={user?.email || "Not available"}
                    />

                    <DebugRow
                        label="Role is CR"
                        value={user?.role === 'CR'}
                        details={user?.role || "Not available"}
                    />

                    <DebugRow
                        label="Is Top CR"
                        value={user?.isTopCR === true}
                        details={user?.isTopCR ? "✅ TRUE" : "❌ FALSE"}
                    />
                </div>

                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <h3 className="font-bold text-blue-900 mb-2">Next Steps:</h3>
                    {!user ? (
                        <p className="text-blue-800">User not loaded. Try refreshing the page.</p>
                    ) : user.role !== 'CR' ? (
                        <p className="text-blue-800">You need to be a CR to use CR management features.</p>
                    ) : !user.isTopCR ? (
                        <div className="text-blue-800">
                            <p className="mb-2">You are not a Top CR yet.</p>
                            <a
                                href="/student/set-top-cr"
                                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
                            >
                                Go to Set Top CR Page
                            </a>
                        </div>
                    ) : (
                        <div className="text-blue-800">
                            <p className="mb-2">✅ You are a Top CR! You should see the "Manage CRs" link in navigation.</p>
                            <a
                                href="/student/manage-crs"
                                className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
                            >
                                Go to Manage CRs Page
                            </a>
                        </div>
                    )}
                </div>

                <div className="mt-6">
                    <h3 className="font-bold text-slate-900 mb-3">Full User Object:</h3>
                    <pre className="bg-slate-900 text-green-400 p-4 rounded-xl overflow-auto text-xs">
                        {JSON.stringify(user, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    );
}

function DebugRow({ label, value, details }: { label: string; value: boolean; details: string }) {
    return (
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <span className="font-medium text-slate-700">{label}:</span>
            <div className="flex items-center gap-3">
                <span className="text-slate-600">{details}</span>
                {value ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                )}
            </div>
        </div>
    );
}
