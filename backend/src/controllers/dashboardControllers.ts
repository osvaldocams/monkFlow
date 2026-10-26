import { Request, Response } from 'express'
import prisma from '../config/db.js'


export class DashboardControllers {
    static getDashboardSummary = async (req: Request, res: Response) => {
        try {
            const { interval = 'month' } = req.query

            //1. calcular rango de fechas segun intervalo 
            const now = new Date()
            let startDate = new Date()

            if (interval === 'week') {
                //ir al inicio de la semana
                startDate.setDate(now.getDate() - 7)
            } else {
                //por default month primer dia del mes actual
                startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            }
            //2 consultar movimientos dentro del rango usando prisma
            const movements = await prisma.movement.findMany({
                where: {
                    date: {
                        gte: startDate,
                        lte: now,
                    },
                },
                include: {
                    tags: true,
                },
            })
            //3 calcular métricas principales
            let income = 0
            let expense = 0

            movements.forEach(m => {
                if (m.type === 'INCOME') {
                    income += Number(m.amount)
                } else {
                    expense += Number(m.amount)
                }
            })

            const balance = income - expense

            //retornar respuesta limpia al cliente
            return res.json({
                interval,
                summary: {
                    income,
                    expense,
                    balance
                },
                movementsCount: movements.length
            })

        } catch (error) {
            console.error('Error fetching dashboard summary:', error);
            res.status(500).json({ error: "Error getting dashboard summary" })
        }
    }
}
