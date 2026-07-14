import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const QueryChatMessagesSchema = z.object({
  page: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? 1 : val),
    z.coerce.number().int().positive().default(1),
  ),
  limit: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? 50 : val),
    z.coerce.number().int().positive().max(100).default(50),
  ),
});

export class QueryChatMessagesDto extends createZodDto(
  QueryChatMessagesSchema,
) {}
