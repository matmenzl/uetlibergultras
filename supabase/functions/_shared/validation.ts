import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

export const StravaOAuthCallbackSchema = z.object({
  code: z.string().min(1).max(1000),
  userId: z.string().uuid()
});

export const StravaAuthExchangeSchema = z.object({
  code: z.string().min(1).max(1000)
});

export const ActivityLeaderboardSchema = z.object({
  type: z.enum([
    'most-efforts-overall',
    'most-efforts-monthly',
    'most-efforts-segment',
    'most-unique-segments'
  ]).default('most-efforts-overall'),
  segment_id: z.number().int().positive().optional()
});

export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    // Return generic error message, don't expose validation details
    return {
      success: false,
      error: 'Invalid input parameters'
    };
  }
  
  return {
    success: true,
    data: result.data
  };
}
