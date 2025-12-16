"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Menu, X, LogOut, Link as LinkIcon, LayoutDashboard, Building2, Network, Users, BookOpen, FileText, Calendar, Bell } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";

interface NavbarProps {
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
        role?: string;
    };
    links?: { name: string; href: string; icon?: any }[];
    onMenuClick?: () => void;
}

export function Navbar({ user, links = [], onMenuClick }: NavbarProps) {
    const pathname = usePathname();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Helper to get icon based on name
    const getIcon = (name: string) => {
        switch (name) {
            case "Dashboard": return <LayoutDashboard className="w-4 h-4" />;
            case "Universities": return <Building2 className="w-4 h-4" />;
            case "Departments": return <Network className="w-4 h-4" />;
            case "Admin Management": return <Users className="w-4 h-4" />;
            case "My Semester": return <BookOpen className="w-4 h-4" />;
            case "Routine": return <Calendar className="w-4 h-4" />;
            case "Notices": return <Bell className="w-4 h-4" />;
            case "Resources": return <FileText className="w-4 h-4" />;
            case "Courses": return <BookOpen className="w-4 h-4" />;
            case "Academics": return <Calendar className="w-4 h-4" />;
            default: return <LinkIcon className="w-4 h-4" />;
        }
    };

    return (
        <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 fixed z-30 w-full top-0 left-0 h-20 transition-all duration-300">
            <div className="px-4 h-full flex items-center justify-between max-w-7xl mx-auto">
                <div className="flex items-center justify-start gap-8">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onMenuClick}
                            type="button"
                            className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
                        >
                            <span className="sr-only">Open sidebar</span>
                            <Menu className="w-6 h-6" />
                        </button>
                        <Link href="/dashboard" className="flex items-center gap-2 group">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200 group-hover:shadow-indigo-300 transition-all">
                                E
                            </div>
                            <span className="self-center text-xl font-bold whitespace-nowrap text-gray-900 tracking-tight">
                                EduNexus
                            </span>
                        </Link>
                    </div>

                    {/* Horizontal Navigation Links - Boxy Style */}
                    <div className="hidden md:flex items-center gap-1">
                        {links.map((link) => {
                            const isRootPath = link.href === '/superadmin' || link.href === '/dashboard';
                            const isActive = pathname === link.href || (!isRootPath && pathname.startsWith(link.href));
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`
                                        flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border
                                        ${isActive
                                            ? "bg-indigo-50 text-indigo-700 border-indigo-100 shadow-sm translate-y-[-1px]"
                                            : "text-gray-500 border-transparent hover:bg-gray-50 hover:text-gray-900"
                                        }
                                    `}
                                >
                                    {getIcon(link.name)}
                                    {link.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                <div className="flex items-center">
                    <div className="flex items-center ml-3 relative" ref={profileRef}>
                        <button
                            type="button"
                            className="flex text-sm bg-gray-800 rounded-full focus:ring-4 focus:ring-gray-50 items-center justify-center w-9 h-9 transition-transform active:scale-95"
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                        >
                            <span className="sr-only">Open user menu</span>
                            {user?.image ? (
                                <img className="w-9 h-9 rounded-full" src={user.image} alt="user photo" />
                            ) : (
                                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-100 to-indigo-50 text-indigo-600 flex items-center justify-center font-bold border-2 border-white shadow-sm">
                                    {user?.name?.[0] || "U"}
                                </div>
                            )}
                        </button>

                        {isProfileOpen && (
                            <div className="z-50 absolute right-0 top-12 my-2 text-base list-none bg-white divide-y divide-gray-100 rounded-xl shadow-xl border border-gray-100 w-56 animate-in fade-in slide-in-from-top-2 duration-200 ring-1 ring-black/5">
                                <div className="px-4 py-3 bg-gray-50/50 rounded-t-xl" role="none">
                                    <p className="text-sm font-semibold text-gray-900" role="none">
                                        {user?.name || "User"}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate mt-0.5" role="none">
                                        {user?.email}
                                    </p>
                                    <span className="inline-flex mt-2 items-center px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">
                                        {user?.role?.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="p-1">
                                    {/* Profile Settings removed as per request */}
                                    <button
                                        onClick={() => signOut()}
                                        className="flex w-full items-center px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                        role="menuitem"
                                    >
                                        <LogOut className="w-4 h-4 mr-2" />
                                        Sign out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
