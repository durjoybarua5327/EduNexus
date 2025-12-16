import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    const session = await auth();
    const role = session?.user?.role;

    // Role-based redirects
    // Note: Ensure the target routes exist or will exist shortly
    if (role === 'STUDENT' || role === 'CR') redirect('/dashboard/semester');
    if (role === 'TEACHER') redirect('/teacher/courses');
    if (role === 'DEPT_ADMIN') redirect('/admin/overview');
    if (role === 'SUPER_ADMIN') redirect('/super/universities');

    // Fallback
    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold">Welcome to EduNexus</h1>
            <p>Your role is: {role}</p>
            <p className="text-gray-500 mt-2">Please contact admin if you do not see your dashboard.</p>
        </div>
    );
}
