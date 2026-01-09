import dotenv from "dotenv";
dotenv.config();
import mysql from 'mysql2/promise';

console.log("DEBUG: DATABASE_URL is", process.env.DATABASE_URL ? "SET" : "UNSET");

const pool = mysql.createPool(process.env.DATABASE_URL!);

async function checkData() {
    try {
        console.log("Checking Database Data...");

        // 1. Find a Student
        const [users] = await pool.query<any[]>("SELECT id, name, email, departmentId, role FROM User WHERE role = 'STUDENT' LIMIT 1");
        const student = users[0];

        if (!student) {
            console.log("❌ No Student found.");
            return;
        }
        console.log("✅ Student found:", student.name, `(${student.id})`, "Dept:", student.departmentId);

        // 2. Find Profile
        const [profiles] = await pool.query<any[]>("SELECT batchId FROM StudentProfile WHERE userId = ?", [student.id]);
        const profile = profiles[0];

        if (!profile) {
            console.log("❌ No StudentProfile found.");
            return;
        }
        console.log("✅ Profile found. BatchID:", profile.batchId);

        // 3. Find Batch
        if (profile.batchId) {
            const [batches] = await pool.query<any[]>("SELECT name, currentSemester FROM Batch WHERE id = ?", [profile.batchId]);
            const batch = batches[0];
            console.log("✅ Batch found:", batch?.name, "CurrentSemester:", batch?.currentSemester);

            if (batch?.currentSemester) {
                // 4. Find Semester
                const [semesters] = await pool.query<any[]>("SELECT id, name FROM Semester WHERE departmentId = ? AND name = ?", [student.departmentId, batch.currentSemester]);
                const semester = semesters[0];

                if (!semester) {
                    console.log("❌ Semester NOT found for:", batch.currentSemester, "in DataBase.");
                    // List all semesters
                    const [allSems] = await pool.query<any[]>("SELECT name FROM Semester WHERE departmentId = ?", [student.departmentId]);
                    console.log("   Available Semesters:", allSems.map(s => s.name).join(", "));
                } else {
                    console.log("✅ Semester record found:", semester.name, `(${semester.id})`);

                    // Check if Folder exists
                    const folderName = `${batch.currentSemester} Semester`;
                    const [folders] = await pool.query<any[]>("SELECT id, name, isSystem FROM Folder WHERE ownerId = ? AND name = ?", [student.id, folderName]);
                    if (folders.length > 0) {
                        console.log("✅ Folder found in DB:", folders[0].name, "System:", folders[0].isSystem);
                    } else {
                        console.log("❌ Folder NOT found in DB:", folderName);
                    }

                    // 5. Find Courses
                    const [courses] = await pool.query<any[]>("SELECT id, name FROM Course WHERE semesterId = ?", [semester.id]);
                    console.log("ℹ️  Courses count:", courses.length);
                    courses.forEach(c => console.log("   -", c.name));
                }
            } else {
                console.log("❌ Batch has no currentSemester set.");
            }
        } else {
            console.log("❌ Profile has no Batch assigned.");
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        process.exit();
    }
}

checkData();
