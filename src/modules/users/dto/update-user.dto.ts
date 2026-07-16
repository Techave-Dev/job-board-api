import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UpdateUserSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be at most 255 characters')
    .optional(),
  email: z.string().email('Invalid email format').optional(),
});

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
