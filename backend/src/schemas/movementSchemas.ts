import { z } from 'zod'

export const DEFAULT_MOVEMENTS_PAGE = 1
export const DEFAULT_MOVEMENTS_PAGE_LIMIT = 20
export const MAX_MOVEMENTS_PAGE_LIMIT = 100

const pageQueryField = z.coerce.number()
    .int('page must be an integer')
    .min(1, 'page must be greater than or equal to 1')
    .default(DEFAULT_MOVEMENTS_PAGE)

const limitQueryField = z.coerce.number()
    .int('limit must be an integer')
    .min(1, 'limit must be greater than or equal to 1')
    .max(
        MAX_MOVEMENTS_PAGE_LIMIT,
        `limit must be less than or equal to ${MAX_MOVEMENTS_PAGE_LIMIT}`
    )
    .default(DEFAULT_MOVEMENTS_PAGE_LIMIT)

export const getMovementsQuerySchema = z.object({
    page: pageQueryField,
    limit: limitQueryField,
})

export type GetMovementsQuery = z.infer<typeof getMovementsQuerySchema>

export const movementTypeFilterSchema = z.enum(
    ['INCOME', 'EXPENSE', 'TRANSFER', 'DEPOSIT', 'WITHDRAWAL'],
    { message: 'type must be one of: INCOME, EXPENSE, TRANSFER, DEPOSIT, WITHDRAWAL' }
)

export const accountKindFilterSchema = z.enum(
    ['BANK', 'CASH'],
    { message: 'accountKind must be one of: BANK, CASH' }
)

const tagsQueryField = z.string()
    .transform((value) => value.split(',').map((id) => id.trim()).filter(Boolean))
    .pipe(
        z.array(
            z.string().uuid('each tag ID must be a valid UUID')
        )
    )

export const movementFiltersQuerySchema = z.object({
    page: pageQueryField,
    limit: limitQueryField,
    search: z.string()
        .trim()
        .min(1, 'search must not be empty')
        .optional(),
    type: movementTypeFilterSchema.optional(),
    tags: tagsQueryField.optional(),
    accountId: z.string()
        .uuid('accountId must be a valid UUID')
        .optional(),
    accountKind: accountKindFilterSchema.optional(),
    startDate: z.iso.date('startDate must be a valid date (YYYY-MM-DD)').optional(),
    endDate: z.iso.date('endDate must be a valid date (YYYY-MM-DD)').optional(),
    minAmount: z.coerce.number()
        .nonnegative('minAmount must be non-negative')
        .optional(),
    maxAmount: z.coerce.number()
        .nonnegative('maxAmount must be non-negative')
        .optional(),
})
    .refine(
        (data) => !data.startDate || !data.endDate || data.startDate <= data.endDate,
        {
            message: 'startDate must be less than or equal to endDate',
            path: ['startDate'],
        }
    )
    .refine(
        (data) =>
            data.minAmount === undefined ||
            data.maxAmount === undefined ||
            data.minAmount <= data.maxAmount,
        {
            message: 'minAmount must be less than or equal to maxAmount',
            path: ['minAmount'],
        }
    )

export type MovementFiltersQuery = z.infer<typeof movementFiltersQuerySchema>
