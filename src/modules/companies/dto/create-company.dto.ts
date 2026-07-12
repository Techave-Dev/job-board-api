import { z } from 'zod';

export const CreateCompanySchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be at most 255 characters'),
  description: z.string().optional(),
  website: z.string().url('Invalid URL format').max(255).optional(),
});

export type CreateCompanyDto = z.infer<typeof CreateCompanySchema>;
