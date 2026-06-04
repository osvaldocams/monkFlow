# 📓 Phase 8: ZOD SCHEMA & API SERVICE

Este archivo registra el proceso de creación del archivo types que contiene el zod schema que usaremos para obtener todos los movimientos

---


### 🎯 Objective
Configurar la capa de servicios api, en este avance puntualmente solo vamos a avancer con el servicio GET para obtener todos los movimientos

---

### 🛠️ Sub-parte 1: MovemetType constant, TYPES & ZOD SCHEMA

<details>

*   **Status:** ✅ Completed
*   **Timestamp:** 03/06/2026

#### 📝 Crónica de la Sesión & Decisiones Técnicas
El objetivo de esta subparte es crear un archivo centralizado para los types y zod schemas y crear una base que nos permita poder consumir con react-query 

**Steps & Commands:**

1. creamos 2 archivos `src/constants/movementTypes.ts` y `src/types/index.ts`

2. vamos primero con `constants/movementTypes.ts` porque vamos a necesitar limitar nuestras opciones al momento de escoger que tipo de movimiento lo usaremos mas adelante en la construcción del formulario
    ```typescript
    //movementType.ts
    import type { MovementType } from "@/types"

    export const MOVEMENT_TYPES: Record<MovementType, { label: string }> = {
        INCOME: {
            label: 'Ingreso',
        },
        EXPENSE: {
            label: 'Gasto',
        },
        DEPOSIT: {
            label: 'Depósito',
        },
        WITHDRAWAL: {
            label: 'Retiro',
        },
        TRANSFER: {
            label: 'Transferencia',
        },
    } as const
    ``` 
3. realizamos la instalación de zod
    ```bash
    cd frontend
    pnpm add zod
    ```
4. ahora si vamos a `src/types/index.ts` para los types y zod schemas
    ```typescript
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
    ```