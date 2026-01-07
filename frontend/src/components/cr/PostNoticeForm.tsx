"use client";

import { useState } from "react";
import { fetchAPI } from "@/lib/api";
import { Megaphone, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function PostNoticeForm({ departmentId, actorId }: { departmentId: string, actorId: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setStatus('idle');

        const formData = new FormData(e.currentTarget);
        const data = {
            departmentId,
            title: formData.get("title") as string,
            description: formData.get("description") as string,
            isPinned: formData.get("isPinned") === "on",
            priority: "MEDIUM", // Default for CR
            actorId
        };

        try {
            const res = await fetchAPI("/dept/notices", {
                method: "POST",
                body: JSON.stringify(data)
            });

            if (res && !res.error) {
                setStatus('success');
                (e.target as HTMLFormElement).reset();
                router.refresh();
                // Optionally redirect to notices page
            } else {
                setStatus('error');
            }
        } catch (error) {
            setStatus('error');
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                    name="title"
                    required
                    type="text"
                    placeholder="e.g. Class Cancelled tomorrow"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
                <textarea
                    name="description"
                    required
                    rows={4}
                    placeholder="Enter the full details here..."
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
                />
            </div>

            <div className="flex items-center gap-2">
                <input type="checkbox" name="isPinned" id="isPinned" className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" />
                <label htmlFor="isPinned" className="text-sm text-gray-700">Pin this notice</label>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Megaphone className="w-5 h-5" />}
                {loading ? "Posting..." : "Post Notice"}
            </button>

            {status === 'success' && (
                <div className="p-3 bg-green-50 text-green-700 rounded-xl flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                    <CheckCircle className="w-4 h-4" />
                    Notice posted successfully!
                </div>
            )}

            {status === 'error' && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                    <XCircle className="w-4 h-4" />
                    Failed to post notice. Please try again.
                </div>
            )}
        </form>
    );
}
