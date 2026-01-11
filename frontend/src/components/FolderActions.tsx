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

export function FolderActions({ folder, onSuccess }: FolderActionsProps & { onSuccess?: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [showErrorModal, setShowErrorModal] = useState(false);
    const router = useRouter();

    const refreshData = () => {
        if (onSuccess) onSuccess();
        else router.refresh();
    };

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
            refreshData();
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
            refreshData();
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
            refreshData();
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
                className="p-2 hover:bg-slate-100 rounded-full transition-colors bg-white shadow-sm border border-slate-200"
            >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> : <MoreVertical className="w-4 h-4 text-slate-600" />}
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
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 z-20 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-1 ring-slate-900/5">


                        {/* Rename - Hidden for system folders */}
                        {!folder.isSystem && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsOpen(false);
                                    setShowRenameModal(true);
                                }}
                                className="w-full text-left px-4 py-3 text-sm flex items-center gap-3 text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                            >
                                <Edit2 className="w-4 h-4 text-slate-400" />
                                Rename
                            </button>
                        )}

                        {/* Privacy - Hidden for system folders as they are always public or managed by system */}
                        {!folder.isSystem && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleTogglePrivacy();
                                }}
                                className="w-full text-left px-4 py-3 text-sm flex items-center gap-3 text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                            >
                                {folder.isPublic ? <Lock className="w-4 h-4 text-amber-500" /> : <Unlock className="w-4 h-4 text-emerald-500" />}
                                Make {folder.isPublic ? "Private" : "Public"}
                            </button>
                        )}

                        {folder.isSystem === true && (
                            <div className="px-4 py-2 text-xs text-amber-600 italic text-center border-b border-slate-100 mb-1 bg-amber-50 font-medium">
                                System Folder
                            </div>
                        )}

                        {/* Delete - Hidden for system folders */}
                        {!folder.isSystem && (
                            <>
                                <div className="h-px bg-slate-100 my-1 mx-4" />
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setIsOpen(false);
                                        setShowDeleteModal(true);
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm flex items-center gap-3 text-rose-600 hover:bg-rose-50 transition-colors font-medium"
                                >
                                    <Trash2 className="w-4 h-4" />
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
