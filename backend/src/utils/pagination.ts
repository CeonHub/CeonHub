import { z } from "zod";

export const MAX_PAGE_SIZE = 50;

/** Shared page/pageSize query parameters. Every list endpoint is paginated. */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

export function toSkipTake({ page, pageSize }: PaginationInput): { skip: number; take: number } {
  return { skip: (page - 1) * pageSize, take: pageSize };
}
