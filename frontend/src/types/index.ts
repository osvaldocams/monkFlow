
import { z } from 'zod'

// ==========================================
// 🔥 ESQUEMAS ACCOUNT
// ==========================================

export const accountSchema = z.object({
    id: z.string().uuid(),
    name: z.string()
})

// ==========================================
// 🔥 ESQUEMAS MOVEMENT
// ==========================================
export const movementTypeSchema = z.enum(["INCOME", "EXPENSE", "DEPOSIT", "WITHDRAWAL", "TRANSFER"], {
    message: "Selecciona un tipo de movimiento válido"
})
export type MovementType = z.infer<typeof movementTypeSchema>


// ******esquema del formulario (create)******

export const movementFormSchema = z.object({
    type: movementTypeSchema,
    date: z.string().min(1, "La fecha es obligatoria"),
    // Coerce convierte automáticamente "" o strings a número. Si falla, cae en el refino.
    amount: z.coerce.number("El monto es obligatorio").positive("El monto debe ser mayor a cero"),
    description: z.string().max(200, "La descripción no puede superar los 200 caracteres").optional(),
    incomeAccountId: z.string().optional().or(z.literal("")),
    expenseAccountId: z.string().optional().or(z.literal("")),
    tags: z.array(z.string()).default([])
})
// Lógica de negocio cruzada (Se ejecuta después de validar los tipos base)
.superRefine((data, ctx) => {
    
    // 🟩 REGLA: INCOME (Ingreso) -> Requiere cuenta destino
    if (data.type === "INCOME" && (!data.incomeAccountId || data.incomeAccountId === "")) {
        ctx.addIssue({
            path: ['incomeAccountId'],
            message: 'La cuenta de ingresos (destino) es obligatoria',
            code: z.ZodIssueCode.custom
        })
    }

    // 🟥 REGLA: EXPENSE (Gasto) -> Requiere cuenta origen
    if (data.type === "EXPENSE" && (!data.expenseAccountId || data.expenseAccountId === "")) {
        ctx.addIssue({
            path: ['expenseAccountId'],
            message: 'La cuenta de egresos (origen) es obligatoria',
            code: z.ZodIssueCode.custom
        })
    }

    // 🔄 REGLA: TRANSFER, DEPOSIT, WITHDRAWAL -> Requieren ambas cuentas
    if (["TRANSFER", "DEPOSIT", "WITHDRAWAL"].includes(data.type)) {
        if (!data.incomeAccountId || data.incomeAccountId === "") {
            ctx.addIssue({
                path: ['incomeAccountId'],
                message: 'La cuenta de destino es obligatoria para este movimiento',
                code: z.ZodIssueCode.custom,
            })
        }
        if (!data.expenseAccountId || data.expenseAccountId === "") {
            ctx.addIssue({
                path: ['expenseAccountId'],
                message: 'La cuenta de origen es obligatoria para este movimiento',
                code: z.ZodIssueCode.custom,
            })
        }
    }

    // 🚫 REGLA: TRANSFER -> No pueden ser la misma cuenta
    if (
        data.type === 'TRANSFER' && 
        data.incomeAccountId && 
        data.expenseAccountId && 
        data.incomeAccountId === data.expenseAccountId
    ) {
        ctx.addIssue({
            path: ['expenseAccountId'],
            message: 'La cuenta origen y destino no pueden ser la misma',
            code: z.ZodIssueCode.custom
        })
    }
})
// 🧼 Transformación final: Lo que sale limpio hacia Axios para el Backend
.transform((data) => ({
    ...data,
    description: data.description || undefined,
    incomeAccountId: data.incomeAccountId === '' ? undefined : data.incomeAccountId ?? undefined,
    expenseAccountId: data.expenseAccountId === '' ? undefined : data.expenseAccountId ?? undefined,
}))

// El único tipo que vas a necesitar para registrar useForm<MovementFormData>
export type MovementFormData = z.input<typeof movementFormSchema>

// 📺 Tipo de Entrada: El contrato para que la pantalla y useForm manejen strings vacíos
export type MovementFormInputs = z.input<typeof movementFormSchema>

// 🚀 Tipo de Salida: El contrato de los datos ya limpios y transformados que recibirá Axios
export type CreateMovementDto = z.output<typeof movementFormSchema>


// ******esquemas core de la api (respuestas get)******

export const movementSchema = z.object({
    id: z.string().uuid(),
    type: movementTypeSchema,
    date: z.string(), // Dejado laxo por si el backend no manda formato ISO estricto
    amount: z.coerce.number().positive("El monto debe ser mayor a cero"),
    description: z.string().max(200, "La descripción es demasiado larga").optional(),
    incomeAccount: accountSchema.optional().nullable(),
    expenseAccount: accountSchema.optional().nullable(),
    tags: z.array(z.string()).default([])
})

export const movementListSchema = z.array(movementSchema)

export type MovementList = z.infer<typeof movementListSchema>
export type Movement = z.infer<typeof movementSchema>