"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { EditProfileModal } from "./EditProfileModal";
import { useRouter } from "next/navigation";

interface ProfileEditButtonProps {
    currentName: string;
    isOwnProfile: boolean;
}

export function ProfileEditButton({ currentName, isOwnProfile }: ProfileEditButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();

    if (!isOwnProfile) return null;

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 md:mt-0 flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-full text-xs font-bold shadow-md shadow-indigo-200 hover:shadow-lg hover:scale-105 transition-all"
            >
                <Pencil className="w-3 h-3" />
                <span>Edit Profile</span>
            </button>

            <EditProfileModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                currentName={currentName}
                onSuccess={() => {
                    router.refresh();
                }}
            />
        </>
    );
}
