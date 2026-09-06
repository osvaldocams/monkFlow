
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

