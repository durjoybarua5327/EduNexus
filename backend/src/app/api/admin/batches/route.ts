import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth();
    if (session?.user?.role !== 'DEPT_ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const batches = await prisma.batch.findMany({
        include: { _count: { select: { students: true } } },
        orderBy: { name: 'desc' }
    });

    return NextResponse.json(batches);
}

export async function POST(req: Request) {
    const session = await auth();
    if (session?.user?.role !== 'DEPT_ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await req.json();

    let dept = await prisma.department.findFirst();
    if (!dept) {
        dept = await prisma.department.create({
            data: {
                name: "Computer Science",
                university: { create: { name: "Demo University" } }
            }
        });
    }

    try {
        await prisma.batch.create({
            data: {
                name,
                departmentId: dept.id
            }
        });
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: "Failed to create batch" }, { status: 500 });
    }
}
