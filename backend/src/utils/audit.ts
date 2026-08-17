import { prisma } from "../database/prisma";
import type { Prisma } from "../generated/prisma/client";

export interface AuditEntry {
  actorId: string;
  /** Dotted verb, e.g. "user.status.changed". */
  action: string;
  entityType: "USER" | "JOB" | "APPLICATION" | "INVITATION" | "COMPANY";
  entityId: string;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Records a sensitive action (currently the admin ones). Writing the log must never
 * fail the operation it describes, so errors are logged rather than thrown.
 */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: entry.actorId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        ...(entry.metadata === undefined ? {} : { metadata: entry.metadata }),
      },
    });
  } catch (error) {
    console.error("[audit] failed to write entry", entry.action, error);
  }
}
