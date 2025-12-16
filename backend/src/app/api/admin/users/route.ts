
import pool from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const role = searchParams.get("role");
        const departmentId = searchParams.get("departmentId");
        const universityId = searchParams.get("universityId");
        const search = searchParams.get("search");

        let query = `
      SELECT 
        u.id, u.name, u.email, u.role, u.departmentId, u.isBanned, u.banExpiresAt, u.isTopDepartmentAdmin, 
        d.name as departmentName, 
        uni.name as universityName
      FROM User u 
      LEFT JOIN Department d ON u.departmentId = d.id
      LEFT JOIN University uni ON d.universityId = uni.id
      WHERE 1=1
    `;
        const params: any[] = [];

        if (role) {
            query += " AND u.role = ?";
            params.push(role);
        }

        if (departmentId) {
            query += " AND u.departmentId = ?";
            params.push(departmentId);
        }

        if (universityId) {
            query += " AND d.universityId = ?";
            params.push(universityId);
        }

        if (search) {
            query += " AND (u.name LIKE ? OR u.email LIKE ? OR d.name LIKE ? OR uni.name LIKE ?)";
            const term = `%${search}%`;
            params.push(term, term, term, term);
        }

        query += " ORDER BY u.createdAt DESC LIMIT 100";

        const [rows] = await pool.query(query, params);
        return NextResponse.json(rows);
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}

// Create User
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, password, role, departmentId } = body;

        if (!name || !email || !password || !role) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Check if email exists
        const [existing] = await pool.query("SELECT id FROM User WHERE email = ?", [email]);
        if ((existing as any[]).length > 0) {
            return NextResponse.json({ error: "Email already in use" }, { status: 409 });
        }

        // Hash password
        // Dynamically import bcryptjs to avoid require issues if any
        const bcrypt = await import("bcryptjs");
        const hashedPassword = await bcrypt.hash(password, 10);

        const id = "usr-" + Date.now();
        const now = new Date();

        await pool.query(
            "INSERT INTO User (id, name, email, password, role, departmentId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [id, name, email, hashedPassword, role, departmentId || null, now, now]
        );

        // Audit Log
        const [adminRows] = await pool.query<any[]>("SELECT id FROM User WHERE role = 'SUPER_ADMIN' LIMIT 1");
        const actorId = adminRows[0]?.id || 'system';
        await logAudit('USER_CREATED', actorId, `Created user ${name} (${email}) as ${role}`, id);

        return NextResponse.json({ message: "User created successfully", id }, { status: 201 });
    } catch (error) {
        console.error("Error creating user:", error);
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }
}

// Update User (Ban/Role)
// Update User (Ban/Role/Info)
export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, isBanned, banDuration, role, name, email, departmentId, isTopDepartmentAdmin } = body;
        // banDuration in days. If -1, permanent.

        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        const updates: string[] = [];
        const params: any[] = [];

        if (name) {
            updates.push("name = ?");
            params.push(name);
        }

        if (email) {
            updates.push("email = ?");
            params.push(email);
        }

        // Allow explicitly setting departmentId to null if needed, or changing it
        if (departmentId !== undefined) {
            updates.push("departmentId = ?");
            params.push(departmentId || null);
        }

        if (isBanned !== undefined) {
            updates.push("isBanned = ?");
            params.push(isBanned);

            if (isBanned) {
                let expiresAt = null;
                if (banDuration && banDuration > 0) {
                    const d = new Date();
                    d.setDate(d.getDate() + banDuration);
                    expiresAt = d;
                }
                updates.push("banExpiresAt = ?");
                params.push(expiresAt);
            } else {
                updates.push("banExpiresAt = NULL");
            }
        }

        if (role) {
            updates.push("role = ?");
            params.push(role);
        }

        if (isTopDepartmentAdmin !== undefined) {
            updates.push("isTopDepartmentAdmin = ?");
            params.push(isTopDepartmentAdmin);
        }

        if (updates.length === 0) return NextResponse.json({ message: "No changes" });

        params.push(id);
        params.push(id);
        await pool.query(`UPDATE User SET ${updates.join(", ")} WHERE id = ?`, params);

        // Audit Log
        const [adminRows] = await pool.query<any[]>("SELECT id FROM User WHERE role = 'SUPER_ADMIN' LIMIT 1");
        const actorId = adminRows[0]?.id || 'system';

        if (isBanned === true) {
            await logAudit('USER_BANNED', actorId, `Banned user ${id} for ${banDuration || 'indefinite'} days`, id);
        } else if (isBanned === false) {
            await logAudit('USER_UNBANNED', actorId, `Unbanned user ${id}`, id);
        }

        if (role) {
            await logAudit('USER_UPDATED', actorId, `Updated role for user ${id} to ${role}`, id);
        }

        if (isTopDepartmentAdmin !== undefined) {
            await logAudit(isTopDepartmentAdmin ? 'TOP_ADMIN_ASSIGNED' : 'TOP_ADMIN_REVOKED', actorId, `Toggled Top Admin status for user ${id}`, id);
        }

        return NextResponse.json({ message: "User updated" });

    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }
}
