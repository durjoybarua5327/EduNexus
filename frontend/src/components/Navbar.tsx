"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Menu, X, LogOut, Settings, UserCircle } from "lucide-react";
import { useState } from "react";
import { signOut } from "next-auth/react";

interface NavbarProps {
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
        role?: string;
    };
    onMenuClick: () => void;
}

export function Navbar({ user, onMenuClick }: NavbarProps) {
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    return (
        <nav className="bg-white border-b border-gray-200 fixed z-30 w-full top-0 left-0 h-16">
            <div className="px-3 py-3 lg:px-5 lg:pl-3 h-full flex items-center justify-between">
                <div className="flex items-center justify-start">
                    <button
                        onClick={onMenuClick}
                        type="button"
                        className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
                    >
                        <span className="sr-only">Open sidebar</span>
                        <Menu className="w-6 h-6" />
                    </button>
                    <Link href="/dashboard" className="flex ml-2 md:mr-24 items-center gap-2">
                        <span className="self-center text-xl font-bold sm:text-2xl whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                            EduNexus
                        </span>
                    </Link>
                </div>

                <div className="flex items-center">
                    <div className="flex items-center ml-3 relative">
                        <button
                            type="button"
                            className="flex text-sm bg-gray-800 rounded-full focus:ring-4 focus:ring-gray-300 items-center justify-center w-8 h-8"
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                        >
                            <span className="sr-only">Open user menu</span>
                            {user?.image ? (
                                <img className="w-8 h-8 rounded-full" src={user.image} alt="user photo" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                                    {user?.name?.[0] || "U"}
                                </div>
                            )}
                        </button>

                        {isProfileOpen && (
                            <div className="z-50 absolute right-0 top-10 my-4 text-base list-none bg-white divide-y divide-gray-100 rounded shadow border border-gray-100 w-48 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="px-4 py-3" role="none">
                                    <p className="text-sm text-gray-900" role="none">
                                        {user?.name || "User"}
                                    </p>
                                    <p className="text-sm font-medium text-gray-900 truncate" role="none">
                                        {user?.email}
                                    </p>
                                    <p className="text-xs text-indigo-600 mt-1 uppercase font-semibold">
                                        {user?.role}
                                    </p>
                                </div>
                                <ul className="py-1" role="none">
                                    <li>
                                        <Link
                                            href="/dashboard/profile"
                                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            role="menuitem"
                                            onClick={() => setIsProfileOpen(false)}
                                        >
                                            <UserCircle className="w-4 h-4 mr-2" />
                                            Profile
                                        </Link>
                                    </li>
                                    <li>
                                        <button
                                            onClick={() => signOut()}
                                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600"
                                            role="menuitem"
                                        >
                                            <LogOut className="w-4 h-4 mr-2" />
                                            Sign out
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
