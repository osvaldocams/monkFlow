
# 📓 Phase 17: TAGS-API FRONTEND

**[2026-09-07] - tagSchema**

1. **Definición de Esquemas y Tipado Inferido:** Iniciamos la refactorización para centralizar las validaciones de tipo usando Zod. En `src/types/index.ts` creamos la sección dedicada a etiquetas:
   - **`tagSchema`**: Define la estructura base de un objeto `Tag` (`id`, `name`, `slug`, `color`).
   - **`tagsSchema`**: Arreglo de esquemas `z.array(tagSchema)` para respuestas de listas.
   - **Inferencia de Tipos**: Generamos los tipos estáticos de TypeScript (`Tag` y `Tags`) mediante `z.infer<typeof ...>`, eliminando interfaces duplicadas

2. **Integración en `movementSchema`:** Actualizamos la propiedad `tags` dentro de `movementSchema` para que utilice `tagSchema` directamente en lugar de arreglos genéricos de `z.string()`. Esto permite que el backend valide y parsee correctamente la estructura anidada de etiquetas al consultar o manipular movimientos.

---

**[2026-09-17] - tag API**

1. **Construcción del Servicio API (`TagAPI.ts`):** Creamos el objeto `TagAPI` asegurando consistencia con los patrones establecidos en los módulos de `AccountAPI` y `MovementAPI`:
   - Implementamos el método asíncrono `getTags` encargado de realizar la petición HTTP `GET /tags` mediante la instancia configurada de Axios (`api`).
   - Integración de **validación en tiempo de ejecución con Zod**: Parseamos la respuesta (`response.data`) utilizando `tagListSchema.safeparse()` para garantizar que el tipo de dato recibido coincida estrictamente con el contrato esperado en el frontend antes de entregarse a la capa de UI.
   - Centralizamos la captura y propagación de excepciones delegando los fallos al helper `handleApiError(error, "Error fetching tags")`.

---

**[2026-09-17] - hook useTags**

1. 1. **Abstracción de Estado con React Query (`useTags.ts`):** Creamos el hook personalizado `useTags` adhiriéndonos a la arquitectura de consumo de datos establecida en los módulos de cuentas y movimientos:
   - Implementamos la consulta de lectura utilizando `useQuery` con la clave de caché dedicada (`queryKey: ['tags']`).
   - Sincronizamos la función de consulta (`queryFn`) con el método `TagAPI.getTags`, beneficiándonos del re-use del caché, manejo de estados de carga (`isLoading`, `isError`) y sincronización automática en segundo plano.
   - Retornamos los estados y la información parseada de las etiquetas para su consumo limpio desde los componentes de la interfaz de usuario (como el selector de tags en el formulario de movimientos).
