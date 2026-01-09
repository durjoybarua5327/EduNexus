import dotenv from 'dotenv';
dotenv.config();
import pool from './lib/db';
import fs from 'fs';



async function main() {
    try {
        console.log("Simulating Route Logic...");

        // 1. Get User ID
        const [users] = await pool.query<any[]>("SELECT * FROM User WHERE email = 'durjoybarua5327@gmail.com'");
        if (!users.length) { console.log("User not found"); return; }
        const user = users[0];

        const query = `
            SELECT 
                c.id,
                c.name as courseName,
                c.code as courseCode,
                c.credits,
                s.id as semesterId,
                s.name as semesterName
            FROM Course c
            LEFT JOIN Semester s ON c.semesterId = s.id
            WHERE c.teacherId = ?
            ORDER BY s.name, c.name
        `;

        const [courses] = await pool.query<any[]>(query, [user.id]);

        const teacherCourses = courses.map(course => ({
            id: course.id,
            courseName: course.courseName,
            courseCode: course.courseCode,
            credits: course.credits,
            semester: course.semesterId ? {
                id: course.semesterId,
                name: course.semesterName
            } : null
        }));

        console.log("Mapped Courses:", teacherCourses);
        fs.writeFileSync('debug_final_check.json', JSON.stringify(teacherCourses, null, 2));

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await pool.end();
    }
}



main();
