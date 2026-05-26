import { Request, Response } from 'express'
import prisma from '../config/db.js'
import { MovementType } from '@prisma/client'

interface CreateMovementInput {
    type: MovementType
    amount: number
    description: string
    date?: Date
    incomeAccountId?: string
    expenseAccountId?: string
}

export class MovementController {
    static createMovement = async (req: Request<{}, {}, CreateMovementInput>,res: Response) => {
        try {
            const { type, amount, incomeAccountId, expenseAccountId, description, date } = req.body

            // Recuerda: req.body.amount ya viene validado, positivo y a 2 decimales gracias a los middlewares

            // 🚀 Iniciamos la transacción interactiva de Prisma
            // 'tx' actúa como nuestro cliente de base de datos aislado para esta operación
            const movement = await prisma.$transaction(async (tx) => {
                
                // 1️⃣ Crear el registro del movimiento
                const newMovement = await tx.movement.create({
                    data: {
                        type,
                        amount, // Prisma se encarga de transformarlo al tipo Decimal de Postgres
                        description,
                        date: date ? new Date(date) : undefined,
                        incomeAccountId,
                        expenseAccountId
                    }
                })

                // 2️⃣ Actualizar los balances de las cuentas según el tipo
                switch (type) {
                    case 'INCOME':
                        await tx.account.update({
                            where: { id: incomeAccountId },
                            data: { balance: { increment: amount } } // Suma al destino
                        })
                        break

                    case 'EXPENSE':
                        await tx.account.update({
                            where: { id: expenseAccountId },
                            data: { balance: { decrement: amount } } // Resta al origen
                        })
                        break

                    case 'TRANSFER':
                    case 'DEPOSIT':
                    case 'WITHDRAWAL':
                        // Los tres movimientos de traslado comparten la misma lógica contable:
                        // Restar de la cuenta que extrae el dinero
                        await tx.account.update({
                            where: { id: expenseAccountId },
                            data: { balance: { decrement: amount } }
                        })
                        // Sumar a la cuenta que inserta el dinero
                        await tx.account.update({
                            where: { id: incomeAccountId },
                            data: { balance: { increment: amount } }
                        })
                        break
                }

                // Retornamos el movimiento creado para que salga de la transacción
                return newMovement
            })

            // 3️⃣ Si todo salió bien, Prisma hizo COMMIT automático y respondemos al cliente
            return res.status(201).json({
                message: "Movement created successfully",
                movement
            })

        } catch (error: any) {
            // Si algo falló adentro, Prisma hizo ROLLBACK automático. Solo reportamos el error.
            console.error(error)
            return res.status(500).json({
                errors: [{ msg: error.message || 'Error creating movement' }]
            })
        }
    }
    static getAllMovements = async (req: Request, res: Response) => {
        try {
            const movements = await prisma.movement.findMany({
                include:{
                    incomeAccount:{
                        select:{
                            id:true,
                            name:true,
                            kind:true
                        }
                    },
                    expenseAccount:{
                        select:{
                            id:true,
                            name:true,
                            kind:true
                        }
                    }
                },
                orderBy:{
                    date:'desc'
                }
            })
            res.status(200).json(movements)
        } catch (error) {
            console.error(error)
            res.status(500).json({
                errors: [{ msg: 'Error fetching movements' }]
            })
        }
    }
    static getMovementById = async (req: Request, res: Response) => {
        try {
            const { id } = req.params as { id: string }

            const movement = await prisma.movement.findUnique({
                where: { id },
                include:{
                    incomeAccount:{
                        select:{
                            id:true,
                            name:true,
                            kind:true
                        }
                    },
                    expenseAccount:{
                        select:{
                            id:true,
                            name:true,
                            kind:true
                        }
                    }
                },
            })
            if (!movement) {
                return res.status(404).json({ error: "Movement not found" })
            }
        
            res.status(200).json(movement)
        } 
        catch (error) {
            console.error(error)
            res.status(500).json({ errors: [{"msg": "Error fetching movement"}] })
        }
    }
}