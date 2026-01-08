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
                className="mt-4 md:mt-0 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-full font-bold shadow-lg shadow-indigo-200 hover:shadow-xl hover:scale-105 transition-all"
            >
                <Pencil className="w-4 h-4" />
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
