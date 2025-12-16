import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const role = session.user.role;

    if (role === 'STUDENT') redirect("/dashboard/semester");
    if (role === 'TEACHER') redirect("/teacher/courses");
    if (role === 'DEPT_ADMIN') redirect("/admin/overview");
    if (role === 'SUPER_ADMIN') redirect("/super/universities");

    // Fallback
    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold">Welcome, {session.user.name}</h1>
            <p>Role: {role}</p>
        </div>
    );
}
