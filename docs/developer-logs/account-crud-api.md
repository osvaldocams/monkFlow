# 📓 Phase 3: ACCOUNT CRUD API

En este bloque se trabajó el CRUD Account los endpoints POST GET GET(ALL) DELETE PUT, usaremos la arquitectura model view controller y express validator para la validación de los campos

---

## 📦 Account CRUD API

### 🎯 Objective
la finalidad es tener los endpoints de la rest api listos para ser consumidos en el cliente, en este caso account es un crud de la sección settings

---

### 🛠️ Sub-parte 1: MVC conexión

<details>

*   **Status:** ✅ Completed
*   **Timestamp:** 22/05/2026

#### 📝 Crónica de la Sesión & Decisiones Técnicas
El objetivo de esta sesión es poder realizar un test de comunicación entre el controlador y el router, para ello crearemos el archivo correspondiente `src/controllers/AccountControllers.ts` hacemos un controlador de test que ejecutaremos desde `accountRoutes.ts` lo llamaremos desde rest client esperando el mensaje de éxito.

**Steps & Commands:**

1. creamos `src/controllers/AccountController.ts` y escribimos el test:
    ```typescript
    import { Request, Response } from 'express'

    export class AccountControllers {
        static testConnection = async (req: Request, res: Response) => {
            res.json({ msg: 'MVC configurado correctamente!' })
        }
    }
    ```
2. vamos a `accountRoutes.ts` y creamos una ruta get solo para ejecutar el test:
    ```typescript
    router.get("/", AccountControllers.testConnection)
    ```
3. en el archivo `requests.http` vamos a realizar la prueba:
    ```
    GET http://localhost:3000/api/accounts

    **salida "msg": 'MVC configurado correctamente!'
    ```
</details>

---

### 🛠️ Sub-parte 2: POST account

<details>

*   **Status:** ✅ Completed
*   **Timestamp:** 22/05/2026

#### 📝 Crónica de la Sesión & Decisiones Técnicas
El objetivo es crear un router valido usando express validator, validar los inputs creando un middleware `handleInputErrors` y un controller que realice la creación de la cuenta, al final haremos una prueba con rest client y nos aseguramos que funcione correctamente

**Steps & Commands:**

1. el primer paso lo haremos en el router validando los inputs de nuestro POST, lo haremos con `express validator`
    ```bash
    cd backend
    pnpm add express-validator
    ```
2. ya podemos hacer validaciones, vamos al router, para definirlas en nuestro endpoint POST
    ```typescript
    //POST ACCOUNT
    router.post("/", 
        body('name')
            .notEmpty()
            .withMessage('account name is required')
            .isString()
            .withMessage('account name must be a string'),
        body('kind')
            .notEmpty()
            .withMessage('account kind is required')
            .isIn(['CASH', 'BANK'])
            .withMessage('account kind must be one of the following values: CASH, BANK'),
        body('balance')
            .optional()
            .isNumeric()
            .withMessage('account balance must be a number')
            .custom((value) => value >= 0)
            .withMessage('account balance must be a non-negative number'),
        handleInputErrors,
        AccountControllers.createAccount
    )
    ```
3. creamos una funcion middleware para manejar los errores de input
    ```typescript
    import { Request, Response, NextFunction } from "express";
    import { validationResult } from "express-validator";

    export const handleInputErrors = (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }
        next()
    }
    ```
4. finalmente creamos el contenido del controller `createAccount` que es lo que escribe en nuestra DB
    ```typescript
    import { Request, Response } from 'express'
    import prisma from '../config/db.js'
    import { AccountKind } from '@prisma/client'; // 👈 importamos el type enum de kind

    export class AccountControllers {
        static createAccount = async (req: Request, res: Response) => {
            try { 
                const { name, kind, balance } = req.body;
                const newAccount = await prisma.account.create({
                    data: {
                        name,
                        kind: kind as AccountKind, // 👈 Le aseguramos a TS que es el Enum correcto
                        balance: balance ? Number(balance) : 0 // 👈 Nos aseguramos de que sea un número flotante puro
                    }
                })
                res.status(201).json(newAccount)
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: "Error creating account" })
            }
        }
    }
    ```
5. creamos una prueba creando un par de cuentas con rest client y revisamos en Neon/tables o prisma studio que se haya creado
    ```
    ### POST ACCOUNTS
    POST http://localhost:3000/api/accounts
    Content-Type: application/json

    {
        "name": "Test Account",
        "kind": "BANK",
        "balance": 1000
    }
    ```
</details>

---

### 🛠️ Sub-parte 3: GET & GET by Id account

<details>

*   **Status:** ✅ Completed
*   **Timestamp:** 22/05/2026

#### 📝 Crónica de la Sesión & Decisiones Técnicas
El objetivo es crear las rutas para los endpoint GET y GET by id y los controladores que nos permitan hacer las consultas.

**Steps & Commands:**

1. empezamos en el archivo router para GET all no es necesario validar pues no tenemos inputs
    ```typescript
    router.get("/", AccountControllers.getAllAccounts)
    ```
2. creamos el controller usando el metodo findMany(), y hacemos el test en rest client
    ```typescript
    static GetAllAccounts = async (req: Request, res: Response) => {
        try {
            const accounts = await prisma.account.findMany()
            res.status(200).json(accounts)
        } catch (error) {
            console.error(error)
            res.status(500).json({ error: "Error fetching accounts" })
        }
    }
    ```
    ```
    ### GET ACCOUNTS
    GET http://localhost:3000/api/accounts
    ```
3. ahora creamos el get para get by id en este caso necesitamos que el id esté contenido en la ruta, lo vamos a validar con `param` que nos da express-validator 
    ```typescript
    router.get("/:id",
    param("id")
        .isUUID().withMessage("the account ID must be a valid UUID"),
    handleInputErrors,
    AccountControllers.getAccountById
    )
    ```
4. Creamos el controller usaremos `findUnique` y una pequeña validación que comprueba que la cuenta exista, y probamos haciendo la consulta en rest client
    ```typescript
    static getAccountById = async (req: Request<{ id: string }>, res: Response) => {
        try {
            const { id } = req.params

            const account = await prisma.account.findUnique({
                where: { id }
            })

            // Si la cuenta no existe en Neon, rompemos el ciclo con un 404
            if (!account) {
                return res.status(404).json({ error: "Account not found" })
            }

            res.status(200).json(account)
        } catch (error) {
            console.error(error)
            res.status(500).json({ error: "Error fetching account" })
        }
    }
    ```
    ```
    ### GET ACCOUNT BY ID
    GET http://localhost:3000/api/accounts/5d985b1f-b580-454f-a920-097d245d6f95
    ```
</details>