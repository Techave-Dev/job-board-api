import { z } from 'zod';

export const UpdateJobSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  location: z.string().max(255).optional(),
  salaryMin: z.number().int().positive().optional(),
  salaryMax: z.number().int().positive().optional(),
});

export type UpdateJobDto = z.infer<typeof UpdateJobSchema>;
