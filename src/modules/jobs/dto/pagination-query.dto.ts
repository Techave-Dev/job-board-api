import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const optionalNumber = z.preprocess(
  (val) => (val === '' || val === undefined || val === null ? undefined : val),
  z.coerce.number().int().positive().optional(),
);

export const PaginationQuerySchema = z.object({
  page: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? 1 : val),
    z.coerce.number().int().positive().default(1),
  ),
  limit: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? 20 : val),
    z.coerce.number().int().positive().max(100).default(20),
  ),
  search: z.string().optional(),
  location: z.string().optional(),
  salaryMin: optionalNumber,
  salaryMax: optionalNumber,
});

export class PaginationQueryDto extends createZodDto(PaginationQuerySchema) {}
