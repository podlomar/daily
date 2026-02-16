import * as z from 'zod';

export const ZSchedule = z.enum(['regular', 'adhoc', 'legacy', 'void']);

export type Schedule = z.infer<typeof ZSchedule>;

export const ZLinks = z.object({
  self: z.string(),
}).catchall(z.string()).meta({ id: 'Links' });

export const ZErrorResponse = z.object({
  error: z.string(),
  details: z.array(z.string()).optional(),
}).meta({ id: 'ErrorResponse' });
