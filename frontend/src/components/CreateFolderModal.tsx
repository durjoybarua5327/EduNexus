"use client";

import { useState } from "react";
import { Plus, X, FolderPlus } from "lucide-react";
import { createFolder } from "@/lib/actions/files";
import { useRouter } from "next/navigation";

export function CreateFolderModal({ parentId, showPrivacy = false }: { parentId: string | null, showPrivacy?: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        if (parentId) formData.append('parentId', parentId);
        else formData.append('parentId', 'root');

        const res = await createFolder(formData);
        setLoading(false);
        if (res?.error) {
            alert("Failed to create folder");
        } else {
            setIsOpen(false);
            router.refresh(); // Refresh page data
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition"
            >
                <FolderPlus size={16} /> New Folder
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-lg font-semibold">New Folder</h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={20} />
                            </button>
                        </div>
                        <form action={handleSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Folder Name</label>
                                <input name="name" required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Mathematics" autoFocus />
                            </div>
                            {showPrivacy && (
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" name="isPublic" id="isPublic" className="rounded text-indigo-600 focus:ring-indigo-500" />
                                    <label htmlFor="isPublic" className="text-sm text-gray-700">Make Public (Visible to Batch)</label>
                                </div>
                            )}
                            <div className="pt-2">
                                <button disabled={loading} type="submit" className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                                    {loading ? 'Creating...' : 'Create Folder'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
