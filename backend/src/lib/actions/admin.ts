"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

async function checkAdmin() {
    const session = await auth();
    if (session?.user?.role !== 'DEPT_ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
        throw new Error("Unauthorized");
    }
    return session.user;
}

export async function getAdminStats() {
    const user = await checkAdmin();
    // Assuming admin belongs to a department or fetch all if super admin?
    // For DEPT_ADMIN, filter by departmentId

    // For now, let's just count totals. Implement Department filtering later based on User.departmentId

    const [students, teachers, batches, courses] = await Promise.all([
        prisma.user.count({ where: { role: 'STUDENT' } }),
        prisma.user.count({ where: { role: 'TEACHER' } }),
        prisma.batch.count(),
        prisma.course.count(),
    ]);

    return {
        students,
        teachers,
        batches,
        courses
    };
}

export async function getFaculty() {
    await checkAdmin();
    return prisma.user.findMany({
        where: { role: 'TEACHER' },
        include: { teacherProfile: true },
        orderBy: { name: 'asc' }
    });
}

export async function createUser(data: FormData) {
    await checkAdmin();
    const name = data.get('name') as string;
    const email = data.get('email') as string;
    const password = data.get('password') as string;
    const role = data.get('role') as Role;

    // Simple validation
    if (!email || !password || !name || !role) return { error: "Missing fields" };

    const hashedPassword = await import('bcryptjs').then(bcrypt => bcrypt.hash(password, 10));

    try {
        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                // Create profile based on role
                ...(role === 'TEACHER' ? { teacherProfile: { create: {} } } : {}),
                ...(role === 'STUDENT' ? { studentProfile: { create: { batchId: "PENDING_BATCH", studentIdNo: "TBD" } } } : {}), // Needs proper batch assignment logic later
            }
        });
        return { success: true };
    } catch (e) {
        return { error: "User already exists or database error" };
    }
}

export async function getBatches() {
    await checkAdmin();
    const batches = await prisma.batch.findMany({
        include: { _count: { select: { students: true } } },
        orderBy: { name: 'desc' }
    });
    // TODO: Include CR info. CR is a student with role 'CR' in this batch.
    // Ideally we filter students by role CR.
    return batches;
}

export async function createBatch(formData: FormData) {
    await checkAdmin();
    const name = formData.get('name') as string;

    // Hardcoded Department for now, needs logic to get admin's department
    // We'll fetch the first department or create one if missing for demo
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
        return { success: true };
    } catch (e) {
        return { error: "Failed to create batch" };
    }
}

export async function createCourse(formData: FormData) {
    await checkAdmin();
    const name = formData.get('name') as string;
    const code = formData.get('code') as string;
    const semester = formData.get('semester') as string;

    // Hardcoded Department for now
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
        return { success: true };
    } catch (e) {
        return { error: "Failed to create course" };
    }
}


