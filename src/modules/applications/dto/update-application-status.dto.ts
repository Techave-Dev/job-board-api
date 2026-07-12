import { z } from 'zod';

export const updateApplicationStatusSchema = z.object({
  status: z.enum(['reviewed', 'accepted', 'rejected']),
});

export type UpdateApplicationStatusDto = z.infer<
  typeof updateApplicationStatusSchema
>;
