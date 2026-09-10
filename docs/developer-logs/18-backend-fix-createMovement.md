
# 📓 Phase 18: FIX CREATE MOVEMENT BACKEND

---
**[2026-09-10] - decisiones técnicas**

1. para una integración más limpia de la creación de los movimientos y que estos se realicen en una sola transacción átomica, la decisión es incluir tagId en la data de la creacion de movimientos.

---

**[2026-09-10] - integración en el controller**

1. trabajamos sobre el método createMovement

```ts
//antes del class controller
interface CreateMovementInput {
    type: MovementType
    amount: number
    description: string
    date?: Date
    incomeAccountId?: string
    expenseAccountId?: string
    tagIds?: string[]                    // ← nuevo añadimos tagId al input interface **queda pendiente un refactor para hacer con zod
}

    static createMovement = async (req: Request<{}, {}, CreateMovementInput>, res: Response) => {
        try {
            const { type, amount, incomeAccountId, expenseAccountId, description, date, tagIds} = req.body //**extraemos tagIds**

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
                    },
                    include: { //**para que la respuesta de la transacción incluya los tags los incluimos.**
                        tags:true
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
                //**despues de los balances añadimos la conexión de tags en una sola transacción connect con un array conecta multiples tags en una sola consulta**
                if(tagIds && tagIds.length > 0){
                    await tx.movement.update({
                        where: {id: newMovement.id},
                        data: {
                            tags: {
                                connect: tagIds.map((id) => ({id}))
                            }
                        }
                    })
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
```
---

**[2026-09-10] - validaciones en routes**
1. agregamos validación de express validator para tagIds, es opcional se valida que es un array y se valida cada elemento como uuid 
```ts 

//POST MOVEMENT
router.post("/",
    body('type')
        .notEmpty()
        .bail()
        .isIn(['INCOME', 'EXPENSE', 'TRANSFER', 'DEPOSIT', 'WITHDRAWAL'])
        .withMessage(`Type must be one of: ${['INCOME', 'EXPENSE', 'TRANSFER', 'DEPOSIT', 'WITHDRAWAL'].join(', ')}`),
    body('amount')
        .notEmpty()
        .bail()
        .isNumeric()
        .withMessage('Amount must be a number')
        .toFloat(),
    body('description')
        .notEmpty()
        .bail()
        .isString()
        .trim(),
    body('date')
        .optional()
        .isISO8601()
        .withMessage('Invalid date format')
        .toDate(),
    body('incomeAccountId')
        .optional()
        .isUUID()
        .withMessage("The account ID must be a valid UUID"),
    body('expenseAccountId')
        .optional()
        .isUUID()
        .withMessage("The account ID must be a valid UUID"),

    //**validación de tags**
    body('tagIds')
        .optional()
        .isArray()
        .withMessage('tagIds must be an array'),
    body('tagIds.*')
        .isUUID()
        .withMessage('Each tag ID must be a valid UUID'),
    handleInputErrors,
    validateMovementLogic,
    normalizeAmount,
    MovementController.createMovement
)

```
--- 

**[2026-09-10] - modificamos el interface del middleware**

1. puesto que de momento tenemos duplicado el interface CreateMovementInput igual tenemos que moddificarlo en el middleware, la solución de este problema de duplicidad es una tarea pendiente que se resolverá con un zod schema mas adelante 
```ts 
interface CreateMovementInput {
    type: MovementType
    amount: number
    description: string
    date?: Date
    incomeAccountId?: string
    expenseAccountId?: string
    tagIds?: string[]                    // ← agregar
}
```
