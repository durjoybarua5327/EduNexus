"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { UploadCloud, X } from "lucide-react";
import { uploadFile } from "@/lib/actions/files";
import { useRouter } from "next/navigation";

export function UploadFileModal({ folderId }: { folderId: string | null }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const router = useRouter();

    async function handleSubmit(formData: FormData) {
        if (!folderId) {
            alert("Please select a folder first");
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
            setSelectedFile(null); // Reset
            router.refresh();
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
                            <h3 className="text-lg font-semibold">Upload File</h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={20} />
                            </button>
                        </div>
                        <form action={handleSubmit} className="p-4 space-y-4">
                            <div className={`border-2 border-dashed rounded-lg p-8 text-center transition cursor-pointer relative ${selectedFile ? 'border-indigo-300 bg-indigo-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                                <input
                                    type="file"
                                    name="file"
                                    required
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                            setSelectedFile(e.target.files[0]);
                                        }
                                    }}
                                />
                                <UploadCloud size={32} className={`mx-auto mb-2 ${selectedFile ? 'text-indigo-500' : 'text-gray-400'}`} />
                                <p className="text-sm text-gray-500 truncate px-2">
                                    {selectedFile ? selectedFile.name : "Click or drag file to upload"}
                                </p>
                                {selectedFile && <p className="text-xs text-indigo-600 mt-1 font-medium">Click to change</p>}
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
