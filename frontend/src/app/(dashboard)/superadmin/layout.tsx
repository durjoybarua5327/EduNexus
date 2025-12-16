import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (session?.user?.role !== "SUPER_ADMIN") {
        redirect("/dashboard"); // Redirect unauthorized users back to main dashboard logic
    }

    return (
        <>
            {children}
        </>
    );
}
