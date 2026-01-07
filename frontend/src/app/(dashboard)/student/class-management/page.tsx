
import { auth } from "@/auth";
import { getStudentProfile } from "@/lib/api";
import { redirect } from "next/navigation";
import { Megaphone, ShieldCheck } from "lucide-react";
import { PostNoticeForm } from "@/components/cr/PostNoticeForm";

export default async function ClassManagementPage() {
    const session = await auth();
    const user = session?.user;

    // Strict Role Check for CR
    if (user?.role !== "CR") {
        redirect("/student/semester");
    }

    const profile = await getStudentProfile();

    if (!profile || !profile.departmentId) {
        return <div className="p-8 text-center text-teal-600 font-bold">Department Setup Pending.</div>;
    }

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 animate-in fade-in duration-700">

            {/* Premium Header - Teal Theme */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-teal-100">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-teal-600 font-bold uppercase tracking-widest text-xs">
                        <Megaphone className="w-4 h-4" />
                        <span>Announcement Center</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                            Class Notice
                        </h1>
                        <span className="px-3 py-1 bg-teal-50 text-teal-700 text-xs font-black rounded-lg border border-teal-100 uppercase tracking-wide self-start mt-2">
                            CR Access
                        </span>
                    </div>
                </div>
                <div>
                    <p className="text-right text-slate-500 font-medium">Posting for <span className="font-bold text-slate-900">{profile.batchName}</span></p>
                </div>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {/* Post Notice Card */}
                <div className="md:col-span-2 lg:col-span-1 p-8 bg-white rounded-[2.5rem] border border-teal-100 shadow-xl shadow-teal-100/30">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-4 bg-teal-500 rounded-2xl shadow-lg shadow-teal-500/30 text-white">
                            <Megaphone className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Post a Notice</h2>
                            <p className="text-sm text-slate-500 font-medium">Visible to all students in your department</p>
                        </div>
                    </div>

                    <PostNoticeForm departmentId={profile.departmentId} actorId={user.id} />
                </div>

                {/* Info Card */}
                <div className="p-8 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-[2.5rem] text-white shadow-2xl shadow-teal-200 flex flex-col items-center text-center justify-center space-y-6 relative overflow-hidden">
                    {/* Background blob */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                    <div className="relative p-5 bg-white/10 rounded-full backdrop-blur-md border border-white/20 shadow-inner">
                        <ShieldCheck className="w-16 h-16 text-white" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black mb-2">CR Privileges</h3>
                        <p className="text-teal-50 text-base leading-relaxed max-w-xs mx-auto font-medium">
                            As a Class Representative, you have the ability to post urgent notices and updates. Use this power responsibly.
                        </p>
                    </div>
                    <div className="pt-6 w-full relative z-10">
                        <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent w-full mb-4"></div>
                        <p className="text-xs text-teal-100 uppercase tracking-widest font-bold">EduNexus Admin System</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
