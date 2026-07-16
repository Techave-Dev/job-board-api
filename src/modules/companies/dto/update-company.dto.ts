import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UpdateCompanySchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be at most 255 characters')
    .optional(),
  description: z.string().optional(),
  website: z.string().url('Invalid URL format').max(255).optional(),
});

export class UpdateCompanyDto extends createZodDto(UpdateCompanySchema) {}
