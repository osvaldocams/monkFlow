import { Request, Response } from 'express'
import prisma from '../config/db.js'

export class DevControllers {
    static resetDatabase = async (_req: Request, res: Response) => {
        try {
            const deleted = await prisma.$transaction(async (tx) => {
                const movements = await tx.movement.deleteMany()
                const accounts = await tx.account.deleteMany()
                const tags = await tx.tag.deleteMany()

                return {
                    movements: movements.count,
                    accounts: accounts.count,
                    tags: tags.count,
                }
            })

            return res.status(200).json({
                message: 'Database reset successfully',
                deleted,
            })
        } catch (error) {
            console.error('Error resetting database:', error)
            return res.status(500).json({ error: 'Error resetting database' })
        }
    }
}
