"use client";

import { useState } from "react";
import { Crown, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useUser } from "@/context/user-context";

export default function SetTopCRPage() {
    const { user } = useUser();
    const [loading, setLoading] = useState(false);

    const handleSetTopCR = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/cr/set-top-cr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });

            if (res.ok) {
                toast.success("You are now a Top CR! Please refresh the page.");
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                const error = await res.json();
                toast.error(error.error || "Failed to set Top CR");
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    if (user?.role !== 'CR') {
        return (
            <div className="max-w-2xl mx-auto p-8">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
                    <h2 className="text-xl font-bold text-amber-900 mb-2">CR Access Only</h2>
                    <p className="text-amber-700">You must be a CR to access this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center">
                        <Crown className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900">Become Top CR</h1>
                        <p className="text-slate-500">Utility to promote yourself to Top CR</p>
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                    <p className="text-sm text-blue-800">
                        <strong>Note:</strong> This is a development utility. In production, admins would assign Top CR status.
                    </p>
                </div>

                <div className="space-y-3">
                    <p className="text-slate-700"><strong>Your ID:</strong> {user?.id}</p>
                    <p className="text-slate-700"><strong>Your Email:</strong> {user?.email}</p>
                    <p className="text-slate-700"><strong>Current Role:</strong> {user?.role}</p>
                    <p className="text-slate-700">
                        <strong>Top CR Status:</strong> {user?.isTopCR ? '✅ Yes' : '❌ No'}
                    </p>
                </div>

                <button
                    onClick={handleSetTopCR}
                    disabled={loading || user?.isTopCR}
                    className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                    {loading ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Setting Top CR...</>
                    ) : user?.isTopCR ? (
                        <><Crown className="w-5 h-5" /> Already Top CR</>
                    ) : (
                        <><Crown className="w-5 h-5" /> Set Me as Top CR</>
                    )}
                </button>

                {user?.isTopCR && (
                    <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
                        <p className="text-green-800 font-medium text-center">
                            ✅ You are already a Top CR! Check the navigation for "Manage CRs" link.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
