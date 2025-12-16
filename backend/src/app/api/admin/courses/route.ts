import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await auth();
    if (session?.user?.role !== 'DEPT_ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, code, semester } = await req.json();

    let dept = await prisma.department.findFirst();

    try {
        await prisma.course.create({
            data: {
                name,
                code,
                semester,
                departmentId: dept!.id
            }
        });
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
    }
}
