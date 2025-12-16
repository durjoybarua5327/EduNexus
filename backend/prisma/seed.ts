import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const password = await bcrypt.hash('password123', 10)

    // Create Dept Admin
    const admin = await prisma.user.upsert({
        where: { email: 'admin@edunexus.com' },
        update: {},
        create: {
            email: 'admin@edunexus.com',
            name: 'Department Admin',
            password,
            role: 'DEPT_ADMIN',
        },
    })

    // Create Student
    const student = await prisma.user.upsert({
        where: { email: 'student@edunexus.com' },
        update: {},
        create: {
            email: 'student@edunexus.com',
            name: 'John Student',
            password,
            role: 'STUDENT',
            studentProfile: {
                create: {
                    batchId: 'BATCH-001',
                    studentIdNo: '2024-001'
                }
            }
        },
    })

    // Create Batch
    await prisma.batch.upsert({
        where: { id: 'BATCH-001' },
        update: {},
        create: {
            id: 'BATCH-001',
            name: 'Batch 2024',
            department: {
                create: {
                    name: 'Computer Science',
                    university: { create: { name: 'Demo University' } }
                }
            }
        }
    })

    console.log({ admin, student })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
