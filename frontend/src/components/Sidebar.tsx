"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home,
    LayoutDashboard,
    Folder,
    BookOpen,
    Settings,
    User,
    Users,
    FileText,
    Calendar,
    Building,
    UploadCloud
} from "lucide-react";
import clsx from "clsx";

interface SidebarProps {
    isOpen: boolean;
    role?: string;
}

export function Sidebar({ isOpen, role }: SidebarProps) {
    const pathname = usePathname();

    const getLinks = (role?: string) => {
        switch (role) {
            case "STUDENT":
            case "CR":
                return [
                    { name: "Home", href: "/student/home", icon: Home },
                    { name: "Routine", href: "/student/routine", icon: Calendar },
                    { name: "My Batch", href: "/student/batch", icon: Users },
                    { name: "Resources", href: "/student/resources", icon: BookOpen },
                    { name: "Profile", href: "/student/profile", icon: User },
                ];
            case "TEACHER":
                return [
                    { name: "My Courses", href: "/teacher/courses", icon: BookOpen },
                    { name: "Uploads", href: "/teacher/uploads", icon: UploadCloud },
                    { name: "Notices", href: "/teacher/notices", icon: FileText },
                ];
            case "DEPT_ADMIN":
                return [
                    { name: "Overview", href: "/admin/overview", icon: LayoutDashboard },
                    { name: "Faculty", href: "/admin/faculty", icon: Users },
                    { name: "Batches", href: "/admin/batches", icon: Users },
                    { name: "Courses", href: "/admin/courses", icon: BookOpen },
                    { name: "Academics", href: "/admin/academics", icon: Calendar },
                    { name: "Notice", href: "/admin/notices", icon: FileText },
                ];
            case "SUPER_ADMIN":
                return [
                    { name: "University", href: "/super/universities", icon: Building },
                    { name: "Settings", href: "/super/settings", icon: Settings },
                ];
            default:
                return [
                    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
                ];
        }
    };

    const links = getLinks(role);

    return (
        <aside
            className={clsx(
                "fixed top-0 left-0 z-20 w-64 h-screen pt-16 transition-transform border-r border-gray-200 bg-white",
                {
                    "-translate-x-full sm:translate-x-0": !isOpen,
                    "translate-x-0": isOpen,
                }
            )}
            aria-label="Sidebar"
        >
            <div className="h-full px-3 pb-4 overflow-y-auto bg-white">
                <ul className="space-y-2 font-medium">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
                        return (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    className={clsx(
                                        "flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group",
                                        isActive && "bg-gray-100 text-indigo-600"
                                    )}
                                >
                                    <Icon className={clsx("w-5 h-5 transition duration-75 text-gray-500 group-hover:text-gray-900", isActive && "text-indigo-600")} />
                                    <span className="ml-3">{link.name}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </aside>
    );
}
