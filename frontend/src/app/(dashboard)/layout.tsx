import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    if (!session?.user) {
        redirect("/login");
    }

    // Role-based access check could happen here or in specific pages
    // For now, Shell handles the sidebar links based on role

    return (
        <DashboardShell user={session.user}>
            {children}
        </DashboardShell>
    );
}
