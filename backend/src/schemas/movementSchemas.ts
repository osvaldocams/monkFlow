import { z } from 'zod'

export const DEFAULT_MOVEMENTS_PAGE = 1
export const DEFAULT_MOVEMENTS_PAGE_LIMIT = 20
export const MAX_MOVEMENTS_PAGE_LIMIT = 100

export const getMovementsQuerySchema = z.object({
    page: z.coerce.number()
        .int('page must be an integer')
        .min(1, 'page must be greater than or equal to 1')
        .default(DEFAULT_MOVEMENTS_PAGE),
    limit: z.coerce.number()
        .int('limit must be an integer')
        .min(1, 'limit must be greater than or equal to 1')
        .max(
            MAX_MOVEMENTS_PAGE_LIMIT,
            `limit must be less than or equal to ${MAX_MOVEMENTS_PAGE_LIMIT}`
        )
        .default(DEFAULT_MOVEMENTS_PAGE_LIMIT),
})

export type GetMovementsQuery = z.infer<typeof getMovementsQuerySchema>
