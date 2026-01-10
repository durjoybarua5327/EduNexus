"use client";

import { useState } from "react";
import { Crown, ArrowRight, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useUser } from "@/context/user-context";

export default function PromoteSelfPage() {
    const { user } = useUser();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);

    const handlePromoteToCR = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/utils/promote-self-to-cr', {
                method: 'POST',
            });

            if (res.ok) {
                toast.success("Promoted to CR! Moving to next step...");
                setStep(2);
            } else {
                const error = await res.json();
                toast.error(error.error || "Failed to promote");
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleSetTopCR = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/cr/set-top-cr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });

            if (res.ok) {
                toast.success("You are now Top CR!");
                setStep(3);
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

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                        <Crown className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">Setup Top CR</h1>
                        <p className="text-slate-500">Complete setup in 2 steps</p>
                    </div>
                </div>

                {/* Current Status */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                    <p className="text-sm text-blue-800">
                        <strong>Current Role:</strong> {user?.role || 'Loading...'}
                    </p>
                    <p className="text-sm text-blue-800 mt-1">
                        <strong>Is Top CR:</strong> {user?.isTopCR ? '✅ Yes' : '❌ No'}
                    </p>
                </div>

                {/* Step 1: Promote to CR */}
                <div className={`p-6 rounded-xl border-2 mb-4 ${step >= 1 ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-slate-50'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Step 1: Become a CR</h3>
                            <p className="text-sm text-slate-600">First, you need to have CR role</p>
                        </div>
                        {step === 1 && user?.role !== 'CR' && (
                            <button
                                onClick={handlePromoteToCR}
                                disabled={loading}
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Promote to CR</>}
                            </button>
                        )}
                        {user?.role === 'CR' && (
                            <div className="text-green-600 font-bold">✅ Already CR</div>
                        )}
                    </div>
                </div>

                {/* Step 2: Set Top CR */}
                <div className={`p-6 rounded-xl border-2 mb-4 ${step >= 2 || user?.role === 'CR' ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-slate-50 opacity-50'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Step 2: Set Top CR Status</h3>
                            <p className="text-sm text-slate-600">Gain full CR management powers</p>
                        </div>
                        {(step === 2 || user?.role === 'CR') && !user?.isTopCR && (
                            <button
                                onClick={handleSetTopCR}
                                disabled={loading}
                                className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-all disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Set Top CR</>}
                            </button>
                        )}
                        {user?.isTopCR && (
                            <div className="text-green-600 font-bold">✅ Already Top CR</div>
                        )}
                    </div>
                </div>

                {/* Step 3: Done */}
                {step === 3 || user?.isTopCR && (
                    <div className="bg-green-50 border-2 border-green-500 rounded-xl p-6">
                        <h3 className="text-xl font-bold text-green-900 mb-2">🎉 Setup Complete!</h3>
                        <p className="text-green-800 mb-4">
                            You are now a Top CR! Please <strong>logout and login again</strong> to refresh your session.
                        </p>
                        <a
                            href="/api/auth/signout"
                            className="inline-block px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold"
                        >
                            Logout Now
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
