import { z } from 'zod'

/*Account*/
// Esquema temporal de soporte para Account
export const accountSchema = z.object({
    id: z.string().uuid(),
    name: z.string()
})

/*Movements*/
// 1. Esquema del Tipo de Movimiento alineado al Backend (Prisma Enums)
export const movementTypeSchema = z.enum(["INCOME", "EXPENSE", "DEPOSIT", "WITHDRAWAL", "TRANSFER"], {
    message: "Selecciona un tipo de movimiento válido"
})
// Extraemos el tipo puro directamente de Zod: "INCOME" | "EXPENSE" | etc.
export type MovementType = z.infer<typeof movementTypeSchema>

// 2. Esquema Core de un Movimiento (Estructura de la API)
export const movementSchema = z.object({
    id: z.string().uuid(),
    type: movementTypeSchema,
    date: z.string().datetime(),//ISO string
    amount: z.coerce.number().positive("El monto debe ser mayor a cero"),
    description: z.string().max(200, "La descripción es demasiado larga").optional(),
    incomeAccount: accountSchema.optional(),
    expenseAccount: accountSchema.optional(),
    tags: z.array(z.string()).default([])
})

// 3. Esquema para colecciones de datos (GET response)
export const movementListSchema = z.array(movementSchema)

// 4. Inferencia de Tipos de TypeScript purificados
export type MovementList = z.infer<typeof movementListSchema>
export type Movement = z.infer<typeof movementSchema>