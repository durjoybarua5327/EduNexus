"use client";

import { useState } from "react";
import { MoreVertical, Trash2, Edit2, Lock, Unlock, Loader2 } from "lucide-react";
import { deleteItem, updateFolder } from "@/lib/actions/files";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "./ConfirmModal";
import { RenameModal } from "./RenameModal";

interface FolderActionsProps {
    folder: {
        id: string;
        name: string;
        isSystem: boolean;
        isPublic: boolean;
    };
}

export function FolderActions({ folder }: FolderActionsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [showErrorModal, setShowErrorModal] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        setIsLoading(true);
        const res = await deleteItem(folder.id);

        if (res.error) {
            setIsLoading(false);
            setErrorMessage(res.error);
            setShowErrorModal(true);
            setShowDeleteModal(false);
        } else {
            setShowDeleteModal(false);
            setIsOpen(false);
            // Force fresh data fetch by replacing current URL
            router.replace(window.location.pathname + window.location.search);
            setIsLoading(false);
        }
    };

    const handleTogglePrivacy = async () => {
        setIsLoading(true);
        const res = await updateFolder(folder.id, { isPublic: !folder.isPublic });

        if (res.error) {
            setIsLoading(false);
            setErrorMessage(res.error);
            setShowErrorModal(true);
        } else {
            setIsOpen(false);
            router.replace(window.location.pathname + window.location.search);
            setIsLoading(false);
        }
    };

    const handleRename = async (newName: string) => {
        setIsLoading(true);
        const res = await updateFolder(folder.id, { name: newName });

        if (res.error) {
            setIsLoading(false);
            setErrorMessage(res.error);
            setShowErrorModal(true);
            setShowRenameModal(false);
        } else {
            setShowRenameModal(false);
            setIsOpen(false);
            router.replace(window.location.pathname + window.location.search);
            setIsLoading(false);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : <MoreVertical className="w-4 h-4 text-gray-400" />}
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsOpen(false);
                        }}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-200">


                        {/* Rename - Hidden for system folders */}
                        {!folder.isSystem && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsOpen(false);
                                    setShowRenameModal(true);
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 text-gray-700 hover:bg-gray-50"
                            >
                                <Edit2 className="w-3.5 h-3.5" />
                                Rename
                            </button>
                        )}

                        {/* Privacy - Always available */}
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleTogglePrivacy();
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 text-gray-700 hover:bg-gray-50"
                        >
                            {folder.isPublic ? <Lock className="w-3.5 h-3.5 text-amber-500" /> : <Unlock className="w-3.5 h-3.5 text-green-500" />}
                            Make {folder.isPublic ? "Private" : "Public"}
                        </button>

                        {folder.isSystem === true && (
                            <div className="px-4 py-2 text-xs text-amber-600 italic text-center border-b border-gray-100 mb-1 bg-amber-50">
                                🔒 System Folder (Cannot rename or delete)
                            </div>
                        )}

                        {/* Delete - Hidden for system folders */}
                        {!folder.isSystem && (
                            <>
                                <div className="h-px bg-gray-100 my-1" />
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setIsOpen(false);
                                        setShowDeleteModal(true);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 text-rose-600 hover:bg-rose-50"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete
                                </button>
                            </>
                        )}
                    </div>
                </>
            )}

            {/* Modals */}
            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete Folder"
                message={`Are you sure you want to delete "${folder.name}"? All contents will be permanently lost.`}
                confirmText="Delete"
                confirmColor="bg-rose-600 hover:bg-rose-700"
                isLoading={isLoading}
            />

            <RenameModal
                isOpen={showRenameModal}
                onClose={() => setShowRenameModal(false)}
                onConfirm={handleRename}
                currentName={folder.name}
                isLoading={isLoading}
            />

            <ConfirmModal
                isOpen={showErrorModal}
                onClose={() => setShowErrorModal(false)}
                onConfirm={() => setShowErrorModal(false)}
                title="Error"
                message={errorMessage}
                confirmText="OK"
                confirmColor="bg-indigo-600 hover:bg-indigo-700"
            />
        </div>
    );
}
