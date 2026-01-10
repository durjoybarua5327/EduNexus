"use client";

import { useState, useRef, useCallback } from "react";
import { User, Camera, Loader2, UploadCloud, X, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Cropper from "react-easy-crop";
import { createPortal } from "react-dom";

interface ProfileImageUploaderProps {
    currentImage?: string | null;
    userName?: string | null;
    userId: string;
    isOwnProfile: boolean;
}

export function ProfileImageUploader({ currentImage, userName, userId, isOwnProfile }: ProfileImageUploaderProps) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [optimisticImage, setOptimisticImage] = useState<string | null>(currentImage || null);

    // Cropping State
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const readFile = (file: File) => {
        return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.addEventListener("load", () => resolve(reader.result as string), false);
            reader.readAsDataURL(file);
        });
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const imageDataUrl = await readFile(file);
            setImageSrc(imageDataUrl);
            setIsCropModalOpen(true);
            // Clear input value to allow re-selection of same file if cancelled
            e.target.value = '';
        }
    };

    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener("load", () => resolve(image));
            image.addEventListener("error", (error) => reject(error));
            image.setAttribute("crossOrigin", "anonymous"); // needed to avoid cross-origin issues on CodeSandbox
            image.src = url;
        });

    const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<Blob> => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
            throw new Error("No 2d context");
        }

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error("Canvas is empty"));
                }
            }, "image/jpeg", 0.95); // High quality jpeg
        });
    };

    const handleUpload = async () => {
        if (!imageSrc || !croppedAreaPixels) return;

        try {
            setUploading(true);
            setIsCropModalOpen(false); // Close modal and show loading spinner on avatar
            const loadingToast = toast.loading("Processing and uploading...");

            const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);

            // Create a File object from the Blob
            const file = new File([croppedBlob], "profile_pic.jpg", { type: "image/jpeg" });

            // 1. Upload to CDN/Local Storage
            const formData = new FormData();
            formData.append("file", file);

            const uploadRes = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!uploadRes.ok) throw new Error("Upload failed");

            const { url } = await uploadRes.json();

            // 2. Update Profile
            const updateRes = await fetch("/api/student/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: url }),
            });

            if (!updateRes.ok) throw new Error("Failed to update profile");

            setOptimisticImage(url);
            toast.success("Profile updated!", { id: loadingToast });
            router.refresh();

        } catch (error) {
            console.error(error);
            toast.error("Upload failed");
        } finally {
            setUploading(false);
            setImageSrc(null); // Cleanup
        }
    };

    return (
        <>
            <div className="relative group/image shrink-0">
                <div className="w-40 h-40 rounded-full p-1.5 bg-gradient-to-br from-indigo-200 to-purple-200 shadow-xl">
                    <div className={`w-full h-full rounded-full overflow-hidden border-4 border-white bg-white relative ${uploading ? 'opacity-50' : ''}`}>
                        {optimisticImage ? (
                            <img src={optimisticImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                                {userName ? (
                                    <span className="text-4xl font-bold text-slate-400">{userName[0]}</span>
                                ) : (
                                    <User className="w-20 h-20" />
                                )}
                            </div>
                        )}
                        {uploading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Upload Overlay - Only for own profile */}
                {isOwnProfile && (
                    <>
                        <div
                            onClick={() => !uploading && fileInputRef.current?.click()}
                            className="absolute inset-0 m-1.5 rounded-full bg-black/40 backdrop-blur-[2px] opacity-0 group-hover/image:opacity-100 transition-all duration-300 flex flex-col items-center justify-center text-white cursor-pointer border-4 border-transparent bg-clip-border"
                        >
                            <Camera className="w-8 h-8 mb-1" />
                            <span className="text-xs font-bold font-medium tracking-wide">Change</span>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileSelect}
                            disabled={uploading}
                        />

                        {/* Small Camera Icon Badge */}
                        <div className="absolute bottom-2 right-2 p-2.5 bg-white text-slate-900 rounded-full border shadow-lg group-hover/image:scale-0 transition-transform duration-200 pointer-events-none">
                            <Camera className="w-4 h-4" />
                        </div>
                    </>
                )}
            </div>

            {/* Cropping Modal - Rendered via Portal */}
            {isCropModalOpen && imageSrc && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl overflow-hidden w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b flex justify-between items-center bg-slate-50 shrink-0">
                            <h3 className="font-bold text-slate-800">Crop Profile Picture</h3>
                            <button onClick={() => setIsCropModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-full transition">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <div className="relative h-80 bg-slate-900 w-full shrink-0">
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                showGrid={false}
                                cropShape="round"
                            />
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Zoom</label>
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    aria-labelledby="Zoom"
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setIsCropModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpload}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold hover:shadow-lg hover:shadow-violet-200 transition flex justify-center items-center gap-2"
                                >
                                    <Check className="w-4 h-4" />
                                    Save Profile Picture
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
