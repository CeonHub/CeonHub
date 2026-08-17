import { z } from "zod";
import { paginationSchema } from "../../utils/pagination";

export const invitationStatusValues = ["PENDING", "ACCEPTED", "DECLINED", "EXPIRED"] as const;

export const createInvitationSchema = z.object({
  jobId: z.string().trim().min(1, "Choose a job"),
  candidateId: z.string().trim().min(1, "Choose a candidate"),
  message: z
    .string()
    .trim()
    .max(2000)
    .transform((value) => (value.length === 0 ? null : value))
    .nullable()
    .optional(),
});

/** Candidates answer an invitation; nobody else changes its status. */
export const updateInvitationSchema = z.object({
  status: z.enum(["ACCEPTED", "DECLINED"]),
});

export const listInvitationsSchema = paginationSchema.extend({
  status: z.enum(invitationStatusValues).optional(),
  jobId: z.string().trim().max(40).optional(),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type UpdateInvitationInput = z.infer<typeof updateInvitationSchema>;
export type ListInvitationsInput = z.infer<typeof listInvitationsSchema>;
