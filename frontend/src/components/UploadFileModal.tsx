"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { UploadCloud, X } from "lucide-react";
import { uploadFile } from "@/lib/actions/files";
import { useRouter } from "next/navigation";

export function UploadFileModal({ folderId, onSuccess }: { folderId: string | null, onSuccess?: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const router = useRouter();

    async function handleSubmit(formData: FormData) {
        if (!folderId) {
            alert("Please select a folder first");
            return;
        }
        if (selectedFiles.length === 0) {
            alert("Please select at least one file");
            return;
        }

        setLoading(true);
        formData.append('folderId', folderId);

        const res = await uploadFile(formData);
        setLoading(false);
        if (res?.error) {
            alert(res.error);
        } else {
            setIsOpen(false);
            setSelectedFiles([]); // Reset
            if (onSuccess) {
                onSuccess();
            } else {
                router.refresh();
            }
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                disabled={!folderId}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                title={!folderId ? "Open a folder to upload files" : "Upload File"}
            >
                <UploadCloud size={16} /> Upload File
            </button>

            {isOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div
                        className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-lg font-semibold">Upload Files</h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={20} />
                            </button>
                        </div>
                        <form action={handleSubmit} className="p-4 space-y-4">
                            <div className={`border-2 border-dashed rounded-lg p-8 text-center transition cursor-pointer relative ${selectedFiles.length > 0 ? 'border-indigo-300 bg-indigo-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                                <input
                                    type="file"
                                    name="file"
                                    required
                                    multiple
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                            setSelectedFiles(Array.from(e.target.files));
                                        }
                                    }}
                                />
                                <UploadCloud size={32} className={`mx-auto mb-2 ${selectedFiles.length > 0 ? 'text-indigo-500' : 'text-gray-400'}`} />
                                <p className="text-sm text-gray-500 truncate px-2">
                                    {selectedFiles.length > 0
                                        ? `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} selected`
                                        : "Click or drag files to upload"}
                                </p>
                                {selectedFiles.length > 0 && (
                                    <div className="mt-2 text-xs text-slate-500 max-h-20 overflow-y-auto">
                                        {selectedFiles.map((f, i) => (
                                            <div key={i} className="truncate">{f.name}</div>
                                        ))}
                                    </div>
                                )}
                                {selectedFiles.length > 0 && <p className="text-xs text-indigo-600 mt-2 font-medium">Click to select different files</p>}
                            </div>

                            <div className="pt-2">
                                <button disabled={loading} type="submit" className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                                    {loading ? 'Uploading...' : 'Upload'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
