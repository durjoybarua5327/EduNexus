
import pool from './db';

type AuditAction =
    | 'USER_CREATED'
    | 'USER_UPDATED'
    | 'USER_BANNED'
    | 'USER_UNBANNED'
    | 'TOP_ADMIN_ASSIGNED'
    | 'TOP_ADMIN_REVOKED'
    | 'DEPARTMENT_CREATED'
    | 'DEPARTMENT_DELETED'
    | 'DEPARTMENT_RENAMED'
    | 'UNIVERSITY_CREATED';

export async function logAudit(action: AuditAction, actorId: string, details: string, targetId?: string) {
    try {
        const id = 'audit-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
        await pool.query(
            "INSERT INTO AuditLog (id, action, actorId, targetId, details) VALUES (?, ?, ?, ?, ?)",
            [id, action, actorId, targetId || null, details]
        );
    } catch (error) {
        console.error("Failed to log audit:", error);
    }
}
