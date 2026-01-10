
import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-in fade-in duration-500">
            {/* Premium Loader */}
            <div className="relative">
                <div className="absolute inset-0 bg-indigo-100 rounded-full blur-xl opacity-50 animate-pulse"></div>
                <div className="relative p-4 bg-white rounded-2xl shadow-xl shadow-indigo-100/50 border border-slate-100">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
            </div>
            <p className="text-slate-500 font-medium animate-pulse">Loading resources...</p>
        </div>
    );
}
