import type { Request, Response, NextFunction } from 'express'
import { getMovementsQuerySchema } from '../schemas/movementSchemas.js'

export const validateMovementQuery = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const result = getMovementsQuerySchema.safeParse(req.query)

    if (!result.success) {
        return res.status(400).json({
            errors: result.error.issues.map((issue) => ({
                msg: issue.message,
                path: issue.path.join('.'),
                location: 'query',
                type: 'field',
            })),
        })
    }

    res.locals.validatedQuery = result.data
    next()
}
