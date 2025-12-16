
import pool from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const [uniCounts] = await pool.query<any[]>("SELECT COUNT(*) as count FROM University");
        const [deptCounts] = await pool.query<any[]>("SELECT COUNT(*) as count FROM Department");
        const [userCounts] = await pool.query<any[]>("SELECT COUNT(*) as count FROM User");
        const [adminCounts] = await pool.query<any[]>("SELECT COUNT(*) as count FROM User WHERE role IN ('SUPER_ADMIN', 'DEPT_ADMIN')");
        const [deptAdminCounts] = await pool.query<any[]>("SELECT COUNT(*) as count FROM User WHERE role = 'DEPT_ADMIN'");

        // Active Bans count
        const [bannedUni] = await pool.query<any[]>("SELECT COUNT(*) as count FROM University WHERE isBanned = TRUE");
        const [bannedDept] = await pool.query<any[]>("SELECT COUNT(*) as count FROM Department WHERE isBanned = TRUE");
        const [bannedUsers] = await pool.query<any[]>("SELECT COUNT(*) as count FROM User WHERE isBanned = TRUE");

        const totalBans = (bannedUni[0].count || 0) + (bannedDept[0].count || 0) + (bannedUsers[0].count || 0);

        // Recent Activity Logs (Mock or Real if implemented)
        // For now, if AuditLog is empty, return empty array.
        const [logs] = await pool.query("SELECT * FROM AuditLog ORDER BY createdAt DESC LIMIT 10");

        return NextResponse.json({
            universities: uniCounts[0].count,
            departments: deptCounts[0].count,
            users: userCounts[0].count,
            admins: adminCounts[0].count,
            totalDeptAdmins: deptAdminCounts[0].count,
            activeBans: totalBans,
            recentActivity: logs
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
