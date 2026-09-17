
# 📓 Phase 17: TAGS-API FRONTEND

**[2026-09-07] - tagSchema**

1. **Definición de Esquemas y Tipado Inferido:** Iniciamos la refactorización para centralizar las validaciones de tipo usando Zod. En `src/types/index.ts` creamos la sección dedicada a etiquetas:
   - **`tagSchema`**: Define la estructura base de un objeto `Tag` (`id`, `name`, `slug`, `color`).
   - **`tagsSchema`**: Arreglo de esquemas `z.array(tagSchema)` para respuestas de listas.
   - **Inferencia de Tipos**: Generamos los tipos estáticos de TypeScript (`Tag` y `Tags`) mediante `z.infer<typeof ...>`, eliminando interfaces duplicadas

2. **Integración en `movementSchema`:** Actualizamos la propiedad `tags` dentro de `movementSchema` para que utilice `tagSchema` directamente en lugar de arreglos genéricos de `z.string()`. Esto permite que el backend valide y parsee correctamente la estructura anidada de etiquetas al consultar o manipular movimientos.

---

