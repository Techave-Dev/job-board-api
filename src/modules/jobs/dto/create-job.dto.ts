import { z } from 'zod';

export const CreateJobSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().min(1, 'Description is required'),
  location: z.string().max(255).optional(),
  salaryMin: z.number().int().positive().optional(),
  salaryMax: z.number().int().positive().optional(),
});

export type CreateJobDto = z.infer<typeof CreateJobSchema>;
