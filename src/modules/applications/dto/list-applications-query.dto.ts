import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const listApplicationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['pending', 'reviewed', 'accepted', 'rejected']).optional(),
});

export class ListApplicationsQueryDto extends createZodDto(
  listApplicationsQuerySchema,
) {}
