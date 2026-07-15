import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const QueryNotificationSchema = z.object({
  page: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? 1 : val),
    z.coerce.number().int().positive().default(1),
  ),
  limit: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? 20 : val),
    z.coerce.number().int().positive().default(20),
  ),
  unread: z
    .string()
    .optional()
    .transform((val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    }),
});

export class QueryNotificationDto extends createZodDto(
  QueryNotificationSchema,
) {}
