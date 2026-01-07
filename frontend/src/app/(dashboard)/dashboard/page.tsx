"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        let targetPath = null;
        if (status === "unauthenticated") {
            targetPath = "/login";
        } else if (status === "authenticated" && session?.user) {
            // @ts-ignore
            const role = session.user.role;

            if (role === 'STUDENT') targetPath = "/student/home";
            else if (role === 'TEACHER') targetPath = "/teacher/courses";
            else if (role === 'DEPT_ADMIN') targetPath = "/admin/overview";
            else if (role === 'SUPER_ADMIN') targetPath = "/superadmin";
            else targetPath = "/login"; // Fallback
        }

        if (targetPath) {
            router.replace(targetPath);

            // Fallback: Force reload if stuck
            const timeout = setTimeout(() => {
                window.location.href = targetPath!;
            }, 1000);
            return () => clearTimeout(timeout);
        }
    }, [session, status, router]);

    // Simple centered spinner, no text
    return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="relative">
                <div className="h-16 w-16 rounded-full border-b-2 border-t-2 border-indigo-500 animate-spin"></div>
            </div>
        </div>
    );
}
