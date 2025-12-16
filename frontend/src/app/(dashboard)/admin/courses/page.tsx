"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plus, BookOpen, Trash2, User, GraduationCap, Code } from "lucide-react";
import { Modal } from "@/components/Modal";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import toast from "react-hot-toast";

export default function CoursesPage() {
    const { data: session } = useSession();
    // @ts-ignore
    const deptId = session?.user?.departmentId;

    const [semesters, setSemesters] = useState<any[]>([]);
    const [selectedSemester, setSelectedSemester] = useState<any>(null);
    const [courses, setCourses] = useState<any[]>([]);
    const [faculty, setFaculty] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isSemesterModalOpen, setIsSemesterModalOpen] = useState(false);
    const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingCourse, setEditingCourse] = useState<any>(null);

    // Forms
    const [semesterForm, setSemesterForm] = useState({ name: "" });
    const [courseForm, setCourseForm] = useState({ name: "", code: "", teacherId: "" });
    const [lastSubmitTime, setLastSubmitTime] = useState(0);

    useEffect(() => {
        if (deptId) {
            fetchInitialData();
        }
    }, [deptId]);

    useEffect(() => {
        if (selectedSemester) {
            fetchCourses(selectedSemester.id);
        }
    }, [selectedSemester]);

    async function fetchInitialData() {
        setLoading(true);
        await Promise.all([fetchSemesters(), fetchFaculty()]);
        setLoading(false);
    }

    async function fetchSemesters() {
        try {
            const res = await fetch(`/api/dept/semesters?departmentId=${deptId}`);
            if (res.ok) {
                const data = await res.json();
                setSemesters(data);
                if (data.length > 0 && !selectedSemester) {
                    setSelectedSemester(data[0]);
                }
            }
        } catch (e) { console.error(e); }
    }

    async function fetchCourses(semesterId: string) {
        try {
            const res = await fetch(`/api/dept/courses?departmentId=${deptId}&semesterId=${semesterId}`);
            if (res.ok) setCourses(await res.json());
        } catch (e) { console.error(e); }
    }

    async function fetchFaculty() {
        try {
            const res = await fetch(`/api/dept/faculty?departmentId=${deptId}`);
            if (res.ok) setFaculty(await res.json());
        } catch (e) { console.error(e); }
    }

    async function handleSemesterSubmit(e: React.FormEvent) {
        e.preventDefault();

        const now = Date.now();
        if (now - lastSubmitTime < 5000) {
            toast.error(`Please wait ${Math.ceil((5000 - (now - lastSubmitTime)) / 1000)}s before creating another semester.`);
            return;
        }

        try {
            const res = await fetch("/api/dept/semesters", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...semesterForm, departmentId: deptId }),
            });
            if (res.ok) {
                setLastSubmitTime(Date.now());
                toast.success("Semester created");
                setIsSemesterModalOpen(false);
                setSemesterForm({ name: "" });
                fetchSemesters();
            } else toast.error("Failed to create semester");
        } catch (e) { toast.error("Error"); }
    }

    async function handleCourseSubmit(e: React.FormEvent) {
        e.preventDefault();

        const now = Date.now();
        if (now - lastSubmitTime < 5000) {
            toast.error(`Please wait ${Math.ceil((5000 - (now - lastSubmitTime)) / 1000)}s before creating another course.`);
            return;
        }

        try {
            const res = await fetch("/api/dept/courses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...courseForm,
                    semesterId: selectedSemester?.id,
                    departmentId: deptId
                }),
            });
            if (res.ok) {
                setLastSubmitTime(Date.now());
                toast.success("Course created");
                setIsCourseModalOpen(false);
                setCourseForm({ name: "", code: "", teacherId: "" });
                fetchCourses(selectedSemester.id);
            } else toast.error("Failed to create course");
        } catch (e) { toast.error("Error"); }
    }

    const [confirmAction, setConfirmAction] = useState<{
        title: string;
        message: string;
        onConfirm: () => void;
        isDanger?: boolean;
        confirmText?: string;
    } | null>(null);

    async function handleDeleteSemester(id: string) {
        setConfirmAction({
            title: "Delete Semester",
            message: "Are you sure? This will delete all courses in this semester. This action cannot be undone.",
            isDanger: true,
            confirmText: "Delete",
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/dept/semesters?id=${id}`, { method: "DELETE" });
                    if (res.ok) {
                        toast.success("Semester deleted");
                        fetchSemesters();
                        setSelectedSemester(null);
                    } else {
                        toast.error("Failed to delete semester");
                    }
                } catch (e) { toast.error("Error deleting semester"); }
            }
        });
    }

    async function handleDeleteCourse(id: string) {
        setConfirmAction({
            title: "Delete Course",
            message: "Are you sure you want to delete this course? This action cannot be undone.",
            isDanger: true,
            confirmText: "Delete",
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/dept/courses?id=${id}`, { method: "DELETE" });
                    if (res.ok) {
                        toast.success("Course deleted");
                        fetchCourses(selectedSemester.id);
                    } else {
                        toast.error("Failed to delete course");
                    }
                } catch (e) { toast.error("Error deleting course"); }
            }
        });
    }

    if (!deptId) return null;

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Course Management</h1>
                    <p className="text-gray-500">Organize courses by semester and assign instructors.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsSemesterModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors shadow-lg shadow-gray-200"
                    >
                        <Plus className="w-5 h-5" /> Add Semester
                    </button>
                    <button
                        onClick={() => setIsCourseModalOpen(true)}
                        disabled={!selectedSemester}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus className="w-5 h-5" /> Add Course
                    </button>
                </div>
            </div>

            {loading ? <div className="text-center py-10">Loading...</div> : (
                <div className="grid grid-cols-12 gap-6">
                    {/* Semester Sidebar */}
                    <div className="col-span-12 md:col-span-3 space-y-2">
                        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Semesters</h3>
                        {semesters.map(sem => (
                            <div
                                key={sem.id}
                                onClick={() => setSelectedSemester(sem)}
                                className={`p-4 rounded-xl cursor-pointer transition-all group relative ${selectedSemester?.id === sem.id
                                    ? "bg-indigo-50 border-2 border-indigo-200 shadow-sm"
                                    : "bg-white border border-gray-200 hover:border-indigo-200 hover:shadow-sm"
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <GraduationCap className={`w-5 h-5 ${selectedSemester?.id === sem.id ? 'text-indigo-600' : 'text-gray-400'}`} />
                                        <span className={`font-semibold ${selectedSemester?.id === sem.id ? 'text-indigo-700' : 'text-gray-700'}`}>
                                            {sem.name} Semester
                                        </span>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteSemester(sem.id); }}
                                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {semesters.length === 0 && (
                            <div className="text-center py-8 text-gray-400 text-sm">
                                No semesters yet. Create one to get started.
                            </div>
                        )}
                    </div>

                    {/* Courses Grid */}
                    <div className="col-span-12 md:col-span-9">
                        {selectedSemester ? (
                            <>
                                <h3 className="text-lg font-bold text-gray-800 mb-4">
                                    {selectedSemester.name} Semester Courses
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {courses.map(course => (
                                        <div key={course.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg uppercase tracking-wide flex items-center gap-1">
                                                    <Code className="w-3 h-3" />
                                                    {course.code}
                                                </span>
                                                <button onClick={() => handleDeleteCourse(course.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-4">{course.name}</h3>
                                            <div className="pt-4 border-t border-gray-50 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <div className="text-sm">
                                                    <p className="text-gray-500 text-xs">Instructor</p>
                                                    <p className="font-medium text-gray-900">{course.teacherName || "Unassigned"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {courses.length === 0 && (
                                        <div className="col-span-full py-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                                            No courses in this semester yet.
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-64 text-gray-400">
                                Select a semester to view courses
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Semester Modal */}
            <Modal isOpen={isSemesterModalOpen} onClose={() => setIsSemesterModalOpen(false)} title="Create New Semester">
                <form onSubmit={handleSemesterSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Semester Name</label>
                        <input className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            required placeholder="e.g. 1st, 2nd, Summer"
                            value={semesterForm.name} onChange={e => setSemesterForm({ ...semesterForm, name: e.target.value })} />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => setIsSemesterModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Create Semester</button>
                    </div>
                </form>
            </Modal>

            {/* Course Modal */}
            <Modal isOpen={isCourseModalOpen} onClose={() => { setIsCourseModalOpen(false); setIsEditMode(false); setEditingCourse(null); }} title={isEditMode ? "Edit Course" : "Add New Course"}>
                <form onSubmit={handleCourseSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Course Code</label>
                        <input className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            required placeholder="e.g. CSE101"
                            value={courseForm.code} onChange={e => setCourseForm({ ...courseForm, code: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
                        <input className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            required placeholder="e.g. Introduction to Programming"
                            value={courseForm.name} onChange={e => setCourseForm({ ...courseForm, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Assign Teacher</label>
                        <select className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={courseForm.teacherId} onChange={e => setCourseForm({ ...courseForm, teacherId: e.target.value })}>
                            <option value="">No Instructor</option>
                            {faculty.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => { setIsCourseModalOpen(false); setIsEditMode(false); setEditingCourse(null); }} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">{isEditMode ? "Update Course" : "Create Course"}</button>
                    </div>
                </form>
            </Modal>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                title={confirmAction?.title || "Confirm Action"}
                message={confirmAction?.message || "Are you sure?"}
                onConfirm={confirmAction?.onConfirm || (() => { })}
                isDanger={confirmAction?.isDanger}
                confirmText={confirmAction?.confirmText}
            />
        </div>
    );
}
