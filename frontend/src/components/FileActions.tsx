"use client";

import { useState } from "react";
import { MoreVertical, Trash2, Edit2, Loader2, Download, Lock, Unlock } from "lucide-react";
import { deleteItem, updateFolder } from "@/lib/actions/files"; // We can reuse updateFolder for renaming if backend supports it (it does now)
import { useRouter } from "next/navigation";
import { ConfirmModal } from "./ConfirmModal";
import { RenameModal } from "./RenameModal";

interface FileActionsProps {
    file: {
        id: string;
        name: string;
        url: string;
        isPublic?: boolean;
    };
}

export function FileActions({ file }: FileActionsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [showErrorModal, setShowErrorModal] = useState(false);
    const router = useRouter();





    const handleDownload = () => {
        // Use our proxy to enforce filename and avoid CORS
        const downloadUrl = `/api/download?url=${encodeURIComponent(file.url)}&name=${encodeURIComponent(file.name)}`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDelete = async () => {
        setIsLoading(true);
        const res = await deleteItem(file.id);

        if (res.error) {
            setIsLoading(false);
            setErrorMessage(res.error);
            setShowErrorModal(true);
            setShowDeleteModal(false);
        } else {
            setShowDeleteModal(false);
            setIsOpen(false);
            router.refresh();
            setIsLoading(false);
        }
    };

    const handleTogglePrivacy = async () => {
        setIsLoading(true);
        const res = await updateFolder(file.id, { isPublic: !file.isPublic });

        if (res.error) {
            setIsLoading(false);
            setErrorMessage(res.error);
            setShowErrorModal(true);
        } else {
            setIsOpen(false);
            router.refresh();
            setIsLoading(false);
        }
    };

    const handleRename = async (newName: string) => {
        setIsLoading(true);
        // We reuse updateFolder because our API is generic on PATCH /files
        const res = await updateFolder(file.id, { name: newName });

        if (res.error) {
            setIsLoading(false);
            setErrorMessage(res.error);
            setShowErrorModal(true);
            setShowRenameModal(false);
        } else {
            setShowRenameModal(false);
            setIsOpen(false);
            router.refresh();
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
                className="p-1 hover:bg-gray-100 rounded-full transition-colors bg-white/50 backdrop-blur-sm"
            >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : <MoreVertical className="w-4 h-4 text-gray-600" />}
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

                        {/* Download */}
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsOpen(false);
                                handleDownload();
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 text-gray-700 hover:bg-gray-50"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Download
                        </button>

                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleTogglePrivacy();
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 text-gray-700 hover:bg-gray-50"
                        >
                            {file.isPublic ? <Lock className="w-3.5 h-3.5 text-amber-500" /> : <Unlock className="w-3.5 h-3.5 text-green-500" />}
                            Make {file.isPublic ? "Private" : "Public"}
                        </button>

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
                    </div>
                </>
            )}

            {/* Modals */}
            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete File"
                message={`Are you sure you want to delete "${file.name}"? This action cannot be undone.`}
                confirmText="Delete"
                confirmColor="bg-rose-600 hover:bg-rose-700"
                isLoading={isLoading}
            />

            <RenameModal
                isOpen={showRenameModal}
                onClose={() => setShowRenameModal(false)}
                onConfirm={handleRename}
                currentName={file.name}
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
