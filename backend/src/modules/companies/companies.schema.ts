import { z } from "zod";
import { paginationSchema } from "../../utils/pagination";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value.length === 0 ? null : value))
    .nullable()
    .optional();

const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .transform((value) => (value.length === 0 ? null : value))
  .nullable()
  .optional()
  .refine(
    (value) => value == null || /^https?:\/\/\S+$/i.test(value),
    "Enter a full URL starting with http:// or https://",
  );

export const createCompanySchema = z.object({
  name: z.string().trim().min(2, "Company name must be at least 2 characters").max(120),
  description: optionalText(4000),
  website: optionalUrl,
  logoUrl: optionalUrl,
  location: optionalText(120),
  country: optionalText(60),
});

/** Every field is optional on update, but the name cannot be blanked out. */
export const updateCompanySchema = createCompanySchema.partial();

export const listCompaniesSchema = paginationSchema.extend({
  q: z.string().trim().max(120).optional(),
  country: z.string().trim().max(60).optional(),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type ListCompaniesInput = z.infer<typeof listCompaniesSchema>;
