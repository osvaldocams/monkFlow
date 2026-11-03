import { Request, Response } from 'express'
import prisma from '../config/db.js'


export class DashboardControllers {
    static getDashboardSummary = async (req: Request, res: Response) => {
        try {
            const interval: 'week' | 'month' = req.query.interval === 'week' ? 'week' : 'month'

            //1. calcular rango de fechas segun intervalo 
            const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

            const now = new Date()
            const today = startOfDay(now)

            let startDate: Date
            if (interval === 'week') {
                startDate = new Date(today)
                startDate.setDate(today.getDate() - 6)
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
                select: {
                    type: true,
                    amount: true,
                    date: true,
                }
            })

            //Buckets 
            type Bucket = {
                label: string
                income: number
                expense: number
                net: number
            }
            let buckets: Bucket[]
            if (interval === 'week') {
                buckets = Array.from({ length: 7 }, (_, i) => {
                    const d = new Date(startDate)
                    d.setDate(startDate.getDate() + i)
                    return {
                        label: d.toLocaleDateString('es', { weekday: 'short' }),
                        income: 0,
                        expense: 0,
                        net: 0,
                    }
                })
            } else {
                const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
                const weeks = Math.ceil(daysInMonth / 7)
                buckets = Array.from({ length: weeks }, (_, i) => ({
                    label: `Sem ${i + 1}`,
                    income: 0,
                    expense: 0,
                    net: 0,
                }))
            }
            //bucket index
            const dayIndex = (d: Date) => {
                const a = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
                const b = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
                return Math.round((a - b) / 86_400_000)
            }
            //repartir movimientos
            for (const m of movements) {
                const index = interval === 'week'
                    ? dayIndex(m.date)
                    : Math.floor((m.date.getDate() - 1) / 7)

                if (index < 0 || index >= buckets.length) continue

                const amount = Number(m.amount)

                if (m.type === 'INCOME') buckets[index].income += amount
                else if (m.type === 'EXPENSE') buckets[index].expense += amount
                // TRANSFER / DEPOSIT / WITHDRAWAL: no tocan income ni expense
            }

            //derivar summary del trend
            const round2 = (n: number) => Math.round(n * 100) / 100

            buckets.forEach(b => {
                b.income = round2(b.income)
                b.expense = round2(b.expense)
                b.net = round2(b.income - b.expense)
            })

            const income = round2(buckets.reduce((sum, b) => sum + b.income, 0))
            const expense = round2(buckets.reduce((sum, b) => sum + b.expense, 0))

            //retornar respuesta limpia al cliente
            return res.json({
                interval,
                summary: { income, expense, balance: round2(income - expense) },
                movementsCount: movements.length,
                trend: buckets,
            })
        } catch (error) {
            console.error('Error fetching dashboard summary:', error);
            res.status(500).json({ error: "Error getting dashboard summary" })
        }
    }
}
