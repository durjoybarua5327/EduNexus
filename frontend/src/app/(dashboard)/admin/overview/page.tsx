import { fetchAPI } from "@/lib/api";
import { Users, GraduationCap, BookOpen, Layers } from "lucide-react";

export default async function AdminOverviewPage() {
    const stats = await fetchAPI("/admin/stats");

    if (!stats) return <div className="p-6">Loading stats failed...</div>;

    const cards = [
        { name: "Total Students", value: stats.students, icon: Users, color: "bg-blue-500" },
        { name: "Total Faculty", value: stats.teachers, icon: GraduationCap, color: "bg-green-500" },
        { name: "Active Batches", value: stats.batches, icon: Layers, color: "bg-purple-500" },
        { name: "Courses", value: stats.courses, icon: BookOpen, color: "bg-orange-500" },
    ];

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Department Overview</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div key={card.name} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center">
                            <div className={`p-4 rounded-lg ${card.color} text-white mr-4`}>
                                <Icon size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">{card.name}</p>
                                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
