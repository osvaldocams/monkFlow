# 📓 Phase 4: MOVEMENT MODEL & API

Este archivo registra el proceso de construcción tanto del model como de los endpoints de los movimientos, empezamos con el prisma schema donde crearemos el modelo asi como su conexión con nuestro modelo anterior account, y haremos un push a la db, posteriormente usaremos el patrón MVC para el CRUD de movements.

---

## 📦 Movements model, Movements API 

### 🎯 Objective
crear el model desde el archivo `schema.prisma`, CRUD movements con el patrón MVC

---

### 🛠️ Sub-parte 1: Movement model (schema.prisma)

<details>

*   **Status:** ✅ Completed
*   **Timestamp:** 24/05/2026

#### 📝 Crónica de la Sesión & Decisiones Técnicas
El objetivo de esta sesión es tomar decisiones de estructura para el model `Movemets` y construir el modelo junto con sus enums, asi como su relecion con `Account`

**Steps & Commands:**

1. Preparamos el archivo haciendo una pequeña separacion de los bloques (en este caso Account/Movement) usando codigo comentado, tomando en cuenta los tipos de movimiento que requerimos creamos un enum
    ```markdown    
    // ========================================== 👈​ separacion del modulo
    // MOVEMENT MODULE
    // ==========================================
    enum MovementType { 👈​nuestro enum
    INCOME
    EXPENSE
    TRANSFER
    DEPOSIT
    WITHDRAWAL
    }
    ```
2. creamos el modelo `Movement` es importante hacer un analisis previo para tomar en cuenta todos los elementos que necesitará nuestro modelo, en este caso lo más relevante son las cuentas `incomeAccount` y `expenseAccount` estas dictarán la actualización en el balance por lo que están estrechamente ligadas al modelo `Account`
    ```markdown
    model Movement {
        id               String       @id @default(uuid())
        type             MovementType
        amount           Decimal      @db.Decimal(12, 2)
        description      String
        date             DateTime     @default(now())
        createdAt        DateTime     @default(now())
        updatedAt        DateTime     @updatedAt

        // Cuenta que RECIBE el dinero (+ balance)
        // Requerido en: INCOME, TRANSFER, DEPOSIT
        incomeAccountId  String?
        incomeAccount    Account?     @relation("MoneyInsertion", fields: [incomeAccountId], references: [id], onDelete: Restrict)

        // Cuenta de donde SALE el dinero (- balance)
        // Requerido en: EXPENSE, TRANSFER, WITHDRAWAL
        expenseAccountId String?
        expenseAccount   Account?     @relation("MoneyExtraction", fields: [expenseAccountId], references: [id], onDelete: Restrict)

        @@map("movements") // 👈 mapeo en minúsculas
    }
    ```
3. Ahora necesitamos regresar a nuestro modelo `Account` para crear la relación opuesta
    ```markdown
    // 👈 LAS REFERENCIAS OPUESTAS OBLIGATORIAS:
    incomeMovements  Movement[]   @relation("MoneyInsertion")
    expenseMovements Movement[]   @relation("MoneyExtraction")
    ```
4. finalmente hacemos el push a la db
    ```bash
    cd backend
    pnpm prisma db push
    ```
</details>

---

### 🛠️ Sub-parte 2: Movement API POST

<details>

*   **Status:** ✅ Completed
*   **Timestamp:** 25/05/2026

#### 📝 Crónica de la Sesión & Decisiones Técnicas
El objetivo de esta sesión es la creación del endpoint POST para `Movements` usando el patrón MVC, es el endpoint más laborioso de este CRUD ya que aparte de la validación de inputs que nos da express-validator construiremos un middleware que valide las reglas de negocios, posteriormente el controlador usaremos prisma transaction para una ejecución limpia y a prueba de errores.

**Steps & Commands:**

1. vamos al archivo `server.ts` donde vamos a declarar un nuevo router para Movements
    ```typescript
    //server.ts
    server.use("/api/movements", router)
    ```
2. creamos el archivo especial para movements en la carpeta routes `src/routes/movementRoutes.ts` creamos una instancia de Router (express) y dejamos el camino listo para la creacion de los endpoints, el primero de ellos POST
    ```typescript
    //movementRoutes.ts
    import { Router } from "express"

    const router = Router()

    //POST MOVEMENT

    ```
3. creamos el endpoint y validamos los inputs con express validator, para saber qué y qué podemos validar volteamos a ver nuestro model, importante antes del controlador agregamos los middleware, `handleInputErrors` que ya tenemos y `validateMovementLogic` `normalizeAmount` que construiremos a continuación.
    ```typescript
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
        handleInputErrors,
        normalizeAmount,
        validateMovementLogic,
        MovementController.createMovement
    )
    ```
4. vamos a los middleware, ya tenemos nuestro archivo `src/middleware/index.ts` despues de handleInputErrors escribimos nuestro segundo middleware `normalizeAmount`
    ```typescript
    import { Request, Response, NextFunction } from 'express'
    import { MovementType } from '@prisma/client' // 👈 Importamos el Enum nativo autogenerado por Prisma

    // Definimos la interfaz del Body reutilizando los tipos reales de la base de datos
    interface CreateMovementInput {
        type: MovementType      // 👈 En lugar de un array de strings, usa el tipo real de Prisma
        amount: number
        description: string
        date?: Date
        incomeAccountId?: string
        expenseAccountId?: string
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
    ```
5. Hacemos lo propio construyendo el middleware `validateMovementLogic`. Este bloque actúa como el guardián de las reglas de negocio financieras de MonkFlow, asegurando la coherencia contable a través de **4 bloques de control estrictos**:
    * **Validación Estructural por Tipo:** Filtra que las peticiones tengan sentido contable (ej. `INCOME` requiere `incomeAccountId` y prohíbe `expenseAccountId`, mientras que `TRANSFER`, `WITHDRAWAL` y `DEPOSIT` exigen ambas cuentas y bloquea que sean iguales).
    * **Consulta Simultánea Concurrente:** Implementa el patrón `Promise.all` para buscar la existencia de ambas cuentas en Neon en paralelo (`prisma.account.findUnique`), optimizando el rendimiento del servidor.
    * **Verificación de Existencia (Fail-Fast):** Aplica un cortocircuito si alguna de las cuentas provistas no existe legalmente en la base de datos.
    * **Reglas de Negocio Semánticas (Validación de Canales):** Valida los tipos de cuenta (`CASH`, `BANK`) según el flujo del dinero (ej. `TRANSFER` solo entre bancos, `DEPOSIT` estrictamente de efectivo a banco, y `WITHDRAWAL` de banco a efectivo).

    ```typescript
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
    ```
6. siguiendo el fllujo de nuestro patrón MVC toca construir el controller, empezamos creando el archivo `src/controllers/MovementControllers.ts` y creamos con la sintaxis class el controlador para enseguida definir sus metodos.
    ```typescript
    import { Request, Response } from "express"

    export class MovementController {

    }
    ```
7. Implementamos el método createMovement utilizando las Transacciones Interactivas ($transaction) de Prisma. Este es el corazón financiero de la aplicación, ya que garantiza la atomicidad (ACID) de la operación: o se ejecutan todos los pasos con éxito o se revierte todo, impidiendo que la base de datos quede en un estado inconsistente (ej. que se cree el movimiento pero no se altere el balance).

    Análisis Técnico del Flujo:

    - Transacción Aislada (tx): Pasamos una función anímica al método $transaction que nos provee de un cliente temporal y aislado llamado tx. Todas las mutaciones internas deben llamarse desde tx (no desde prisma) para asegurar que vivan dentro del mismo bloque transaccional.

    - Creación Completa: Se registra el movimiento mapeando directamente los IDs relacionales de las cuentas de origen y destino.

    - Estrategia Contable (Switch Centralizado): Evaluamos el type de movimiento sanitizado para alterar los balances mediante los comandos nativos increment y decrement de Prisma:

    - INCOME / EXPENSE: Afectan de forma unilateral sumando al destino o restando al origen respectivamente.

    - TRANSFER / DEPOSIT / WITHDRAWAL: Al compartir la misma naturaleza semántica de traslado de fondos, se agrupan en un bloque común que ejecuta un decremento en la cuenta emisora y un incremento en la receptora de forma simultánea.

    - Gestión de Ciclo de Vida Automático: Eliminamos el uso manual de sesiones de Mongoose. Si el bloque asíncrono se completa, Prisma ejecuta el COMMIT en Postgres de manera automática. Si ocurre cualquier excepción en el proceso, se dispara un ROLLBACK inmediato que cancela cualquier cambio previo en esa petición.
    ```typescript
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
    }
    ```
- 🚨​💥​ **ERROR** al ejecutar pruebas en rest client surge error en las declaraciones del router, vamos al archivo `server.ts` ya que necesitamos modificar asignando el router indicado tanto para Account como para Movement
    ```typescript
    import express from "express"
    import accountRouter from "./routes/accountRoutes.js" /*// 👈 asignamos un nombre particular a las importaciones */
    import movementRouter from "./routes/movementRoutes.js"

    const server = express()

    server.use(express.json())

    //routing
    server.use("/api/accounts", accountRouter) /*👈 en las rutas asignamos el adecuado */
    server.use("/api/movements", movementRouter)

    export default server
    ```
8. ya podemos crear movimientos, recordar que para que se puedan crear necesitamos un id valido de un account, ya todo es cuestion de realizar pruebas y verificar que nuestras reglas se apliquen
    ```
    //----------------------
    ### MOVEMENTS
    //----------------------
    ### POST MOVEMENT
    POST http://localhost:3000/api/movements
    Content-Type: application/json

    {
        "type": "INCOME",
        "description": "Test Movement",
        "amount": 100,
        "incomeAccountId": "6f91e748-0c5a-42d3-a011-1139ef16854e"
    }
    ```
</details>

---

### 🛠️ Sub-parte 3: API GET & GET by id

<details>

*   **Status:** ✅ Completed
*   **Timestamp:** 24/05/2026

#### 📝 Crónica de la Sesión & Decisiones Técnicas
El objetivo de esta sesión es definir los endpoint GET y GET by id de Movement usando el patron MVC

**Steps & Commands:**

1. En el archivo `movementRoutes.ts` definimos la ruta para GET, al no contener inputs no será necesario realizar validaciones
    ```typescript
    // GET ALL MOVEMENTS
    router.get('/', MovementController.getAllMovements)
    ```
2. vamos al archivo de los controllers `movementControllers.ts` definimos un nuevo metodo `getAllMovements`
    ```typescript
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
    ```
3. relizamos una peticion en rest client para verificar
    ```
    ### GET MOVEMENTS
    GET http://localhost:3000/api/movements
    ```
    > 💡 **Nota de Consistencia de Datos:** En la respuesta del JSON, las propiedades `incomeAccount` y `expenseAccount` devolverán `null` de forma selectiva según el `type` de movimiento (ej. un `INCOME` tendrá `expenseAccount: null`). Esto es el comportamiento esperado derivado de la flexibilidad del esquema relacional y asegura un contrato predecible para el consumo en el Frontend.
4. Vamos a `movementRoutes.ts` ahora trabajaremos con el GET by id en este caso al ser especifico usaremos la propiedad param de express validator para capturar el id y enseguida las validaciones.
    ```typescript
    // GET MOVEMENT BY ID
    router.get("/:id",
        param("id")
            .isUUID().withMessage("the movement ID must be a valid UUID"),
        handleInputErrors,
        MovementController.getMovementById
    )
    ```
5. creamos el metodo `getMovementByID`
    ```typescript
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
    ```
6. podemos hacer una prueba en rest client
    ```
    ### GET MOVEMENT BY ID
    GET http://localhost:3000/api/movements/3cf73f1e-0e0a-4c90-b87d-17801b1e6dfa
    ```
</details>