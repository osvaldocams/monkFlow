
# 📓 Phase 16: MOVEMENT-TAGS BACKEND RELATION

**[2026-09-06] - decisiones técnicas**

1. Al gestionar Prisma la relación muchos a muchos ($M:N$) de forma implícita mediante `_MovementToTag`, determinamos que las acciones de vinculación y desvinculación deben integrarse directamente en `MovementControllers.ts` y `MovementRoutes.ts`, manteniendo el módulo de etiquetas enfocado exclusivamente en su propio CRUD.

---
**[2026-09-06] - addTagToMovement**

1. en el archivo `MovementControllers.ts`
    -Agregamos al final de la clase MovementController: addTagToMovement
    ```ts
    static addTagToMovement = async (req: Request<{ id: string }, {}, { tagId: string }>, res: Response) => {
        try {
            //extraemos aquello que necesitamos de la request
            const { id } = req.params
            const { tagId } = req.body

            //encontramos el movimiento por su id y validamos su existencia
            const movement = await prisma.movement.findUnique({ where: { id } })
            if (!movement) {
                return res.status(404).json({ error: 'Movement not found' })
            }

            //encontramos el tag por su id y validamos su existencia
            const tag = await prisma.tag.findUnique({ where: { id: tagId } })
            if (!tag) {
                return res.status(404).json({ error: 'Tag not found' })
            }

            //creamos esta validacion de registro ya asociado findFirst con some, una consulta a la tabla pivote para verificar si ya existe la asocioación 
            const alreadyAssociated = await prisma.movement.findFirst({
                where: { id, tags: { some: { id: tagId } } }
            })

            if (alreadyAssociated) {
                return res.status(409).json({ error: 'Tag is already associated to this movement' })
            }

            //realizamos la actualización al movement usamos connect que inserta una fila en _MovementToTag
            await prisma.movement.update({
                where: { id },
                data: { tags: { connect: { id: tagId } } }
            })

            res.status(200).json({ message: `Tag "${tag.name}" added to movement` })
        } catch (error) {
            console.error(error)
            //manejo de errores
            res.status(500).json({ error: 'Error adding tag to movement' })
        }
    }
    ```

2. creamos una nueva rita en nuestro archivo `MovementRoutes.ts` las unicas validaciones necesarias, que no esté vacio y que sea un uuid válido.
    ```ts
    // ADD TAG TO MOVEMENT
    router.post("/:id/tags",
        param("id").isUUID().withMessage("The movement ID must be a valid UUID"),
        body("tagId")
            .notEmpty().withMessage("tagId is required")
            .isUUID().withMessage("tagId must be a valid UUID"),
        handleInputErrors,
        MovementController.addTagToMovement
    )
    ```

---

**[2026-09-06] - removeTagFromMovement**

1. en el archivo `MovementControllers.ts`
```ts
static removeTagFromMovement = async (req: Request<{ id: string; tagId: string }>, res: Response) => {
    try {
        //extraemos id y tagId en este caso ambos los obtenemos de params 
        const { id, tagId } = req.params

        //encontramos el movement y validamos su existencia
        const movement = await prisma.movement.findUnique({ where: { id } })
        if (!movement) {
            return res.status(404).json({ error: 'Movement not found' })
        }

        //encontramos el tag y validamos su existencia
        const tag = await prisma.tag.findUnique({ where: { id: tagId } })
        if (!tag) {
            return res.status(404).json({ error: 'Tag not found' })
        }

        //validamos la asociación entre movement y tag 
        const isAssociated = await prisma.movement.findFirst({
            where: { id, tags: { some: { id: tagId } } }
        })

        if (!isAssociated) {
            return res.status(404).json({ error: 'Tag is not associated to this movement' })
        }

        //realizamos la actualización en este caso usamos disconnect
        await prisma.movement.update({
            where: { id },
            data: { tags: { disconnect: { id: tagId } } }
        })

        //mandamos la respuesta
        res.status(200).json({ message: `Tag "${tag.name}" removed from movement` })

    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Error removing tag from movement' })
    }
}
```
2. creamos la ruta en el `movementRoutes.ts` a diferencia de addTagToMovement acá necesitaremos el tagId logicamente para saber a cual tag nos estamos refiriendo
```ts
// REMOVE TAG FROM MOVEMENT
router.delete("/:id/tags/:tagId",
    param("id").isUUID().withMessage("The movement ID must be a valid UUID"),
    param("tagId").isUUID().withMessage("The tag ID must be a valid UUID"),
    handleInputErrors,
    MovementController.removeTagFromMovement
)
```

----


**[2026-09-06] - tags en Movements queries**

1. al ejecutar nuestros endpoint getAllMovements y getMovementById no se muestran los tags en las consultas por lo que tenemos que hacer una pequeña adicion en los controladores, agregamos un bloque despues de los badges de los account 
```ts
//getAllMovements - getMovementById
include: {
    incomeAccount: {
        select: { id: true, name: true, kind: true }
    },
    expenseAccount: {
        select: { id: true, name: true, kind: true }
    },
    tags: {                              // ← agregar
        select: {                        //    este bloque
            id: true,
            name: true,
            slug: true,
            color: true
        }
    }
},
```

---


**[2026-09-06] - http-test**

1. realizamos un par de pruebas exitosas en el archivo de peticiones http
Añadimos un bloque dedicado (`### MOVEMENTS/TAGS`) en el archivo de peticiones HTTP para documentar y probar los endpoints de la relación entre movimientos y etiquetas:
   - **`POST /api/movements/:id/tags`**: Envío de payload JSON `{ "tagId": "<uuid>" }` para validar la asociación atómica y la respuesta con mensaje de confirmación.
   - **`DELETE /api/movements/:id/tags/:tagId`**: Envío de petición DELETE parametrizada por URL para verificar la desvinculación en la tabla intermedia `_MovementToTag`.

2. **Ejecución y Verificación E2E:**
Se ejecutaron las pruebas utilizando el cliente `Kulala.nvim` en Neovim. Se validaron los flujos de éxito (`200 OK`), la persistencia de relaciones en las respuestas de consulta `GET`, y la activación correcta de los códigos de estado `404 Not Found` (recursos inexistentes) y `409 Conflict` (asociaciones duplicadas).
```
//----------------------
### MOVEMENTS/TAGS
//----------------------

### POST add tag to movement 
POST http://localhost:3000/api/movements/677294c1-8f16-4638-a862-22dedd44fa36/tags
Content-Type: application/json

{
    "tagId": "54c863b9-15f1-46af-8d3b-fcfb08526cde"
}

### DELETE remove tag from movement
DELETE http://localhost:3000/api/movements/677294c1-8f16-4638-a862-22dedd44fa36/tags/54c863b9-15f1-46af-8d3b-fcfb08526cde
```
