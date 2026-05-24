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