import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { MovementType } from '@prisma/client' // 👈 Importamos el Enum nativo autogenerado por Prisma
import prisma from "../config/db.js";

// Definimos la interfaz del Body movement reutilizando los tipos reales de la base de datos
interface CreateMovementInput {
    type: MovementType      // 👈 En lugar de un array de strings, usa el tipo real de Prisma
    amount: number
    description: string
    date?: Date
    incomeAccountId?: string
    expenseAccountId?: string
}

export const handleInputErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
}

export const normalizeAmount = (
    req: Request<{}, {}, CreateMovementInput>, 
    res: Response, 
    next: NextFunction
) => {
    let { amount } = req.body

    // 1. Forzar que el monto sea estrictamente positivo (Garantía de negocio)
    amount = Math.abs(amount)

    // 2. Normalizar a dos decimales de forma segura para evitar problemas de flotantes
    // Usamos Number.parseFloat con toFixed(2) para asegurar el estándar de centavos (moneda)
    req.body.amount = Number.parseFloat(amount.toFixed(2))

    next()
}

export const validateMovementLogic = async (
    req: Request<{}, {}, CreateMovementInput>,
    res: Response,
    next: NextFunction
) => {
    const { type, incomeAccountId, expenseAccountId } = req.body

    const error = (message: string) => res.status(400).json({ errors: [{ msg: message }] })

    // ========== 1. VALIDACIÓN DE REGLAS DE ESTRUCTURA POR TIPO ==========
    if (type === 'INCOME') {
        if (!incomeAccountId) return error("incomeAccountId is required for INCOME type")
        if (expenseAccountId) return error("expenseAccountId is not allowed for INCOME type")
    }
    
    if (type === 'EXPENSE') {
        if (!expenseAccountId) return error("expenseAccountId is required for EXPENSE type")
        if (incomeAccountId) return error("incomeAccountId is not allowed for EXPENSE type")
    }
    
    if (['TRANSFER', 'WITHDRAWAL', 'DEPOSIT'].includes(type)) {
        if (!incomeAccountId || !expenseAccountId) {
            return error("Both incomeAccountId and expenseAccountId are required for this movement type")
        }
        if (incomeAccountId === expenseAccountId) {
            return error("incomeAccountId and expenseAccountId cannot be the same")
        }
    }

    // ========== 2. CONSULTA SIMULTÁNEA EN NEON CON PRISMA (Promise.all) ==========
    const [incomeAccount, expenseAccount] = await Promise.all([
        incomeAccountId ? prisma.account.findUnique({ where: { id: incomeAccountId } }) : null,
        expenseAccountId ? prisma.account.findUnique({ where: { id: expenseAccountId } }) : null
    ])

    // ========== 3. VERIFICACIÓN DE EXISTENCIA EN BASE DE DATOS ==========
    if (incomeAccountId && !incomeAccount) {
        return error("incomeAccountId does not correspond to a valid account")
    }
    if (expenseAccountId && !expenseAccount) {
        return error("expenseAccountId does not correspond to a valid account")
    }

    // ========== 4. REGLAS DE NEGOCIO ESPECÍFICAS PARA CADA TIPO ==========
    if (type === 'DEPOSIT') {
        // CASH ➡️ BANK
        // Accedemos a la propiedad .kind que definimos en el Enum AccountKind de Prisma (CASH / BANK)
        if (expenseAccount!.kind !== 'CASH') {
            return error("For DEPOSIT type, expenseAccount must be of kind 'CASH'")
        }
        if (incomeAccount!.kind === 'CASH') {
            return error("For DEPOSIT type, incomeAccount cannot be of kind 'CASH'")
        }
    }

    if (type === 'WITHDRAWAL') {
        // BANK ➡️ CASH
        if (expenseAccount!.kind !== 'BANK') {
            return error("For WITHDRAWAL type, expenseAccount must be of kind 'BANK'")
        }
        if (incomeAccount!.kind === 'BANK') {
            return error("For WITHDRAWAL type, incomeAccount cannot be of kind 'BANK'")
        }
    }

    if (type === 'TRANSFER') {
        // BANK ➡️ BANK
        if (incomeAccount!.kind === 'CASH' || expenseAccount!.kind === 'CASH') {
            return error("TRANSFERS are only allowed between BANK accounts")
        }
    }

    next()
}