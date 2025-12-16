import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function GET() {
    const session = await auth();
    if (session?.user?.role !== 'DEPT_ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const faculty = await prisma.user.findMany({
        where: { role: 'TEACHER' },
        include: { teacherProfile: true },
        orderBy: { name: 'asc' }
    });

    return NextResponse.json(faculty);
}

export async function POST(req: Request) {
    const session = await auth();
    if (session?.user?.role !== 'DEPT_ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { name, email, password, role } = data;

    if (!email || !password || !name || !role) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role as Role,
                ...(role === 'TEACHER' ? { teacherProfile: { create: {} } } : {}),
                ...(role === 'STUDENT' ? { studentProfile: { create: { batchId: "PENDING_BATCH", studentIdNo: "TBD" } } } : {}),
            }
        });
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: "User already exists or database error" }, { status: 500 });
    }
}
