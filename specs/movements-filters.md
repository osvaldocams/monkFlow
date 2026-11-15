# 📐 Master Spec: Módulo de Filtros en Movimientos (`movements-filters`)

## 1. Visión General y Arquitectura de Datos
* **Objetivo:** Permitir filtrar el historial de movimientos de forma granular desde el servidor (PostgreSQL + Prisma) manteniendo sincronizada la paginación incremental (*Offset Pagination*).
* **Flujo de Datos (De extremo a extremo):**
  1. **URL (`React Router` `useSearchParams`):** Única fuente de verdad en el frontend.
  2. **React Query (`useInfiniteQuery`):** Observa los filtros activos en la `queryKey`. Al cambiar cualquier filtro, reinicia automáticamente a `page = 1`.
  3. **API (`GET /api/movements`):** Valida y normaliza los query params con **Zod**.
  4. **Prisma ORM:** Construye dinámicamente `Prisma.MovementWhereInput`, calcula `count({ where })` y extrae el bloque correspondiente (`skip` / `take`).

---

## 2. Contrato de API (Fuente Única de Verdad)

### Query Params Permitidos (`GET /api/movements`)
| Parámetro | Tipo Raw (URL) | Transformación Zod | Regla de Negocio |
| :--- | :--- | :--- | :--- |
| `page` | `string` | `z.coerce.number().int().min(1).default(1)` | Se reinicia a `1` al cambiar filtros. |
| `limit` | `string` | `z.coerce.number().int().min(1).max(100).default(20)` | Bloques de 20 movimientos (máximo vigente: 100). |
| `search` | `string` | `z.string().trim().min(1).optional()` | Subcadena *case-insensitive* en `description`. |
| `type` | `string` | `z.enum(['INCOME', 'EXPENSE', 'TRANSFER', 'DEPOSIT', 'WITHDRAWAL']).optional()` | Coincidencia exacta por tipo (cubre todo el enum de `MovementType`). |
| `tags` | `string` | `z.string().transform(s => s.split(',').filter(Boolean)).pipe(z.array(z.string().uuid()))` | Lógica **OR**: movimientos con *al menos uno* de los IDs. |
| `accountId` | `string` | `z.string().uuid().optional()` | Cuenta específica en `incomeAccountId` **o** `expenseAccountId`. |
| `accountKind` | `string` | `z.enum(['BANK', 'CASH']).optional()` | Naturaleza de `incomeAccount.kind` **o** `expenseAccount.kind`. |
| `startDate` | `string` | `z.string().date().optional()` | Normalizado en backend a `00:00:00.000`. |
| `endDate` | `string` | `z.string().date().optional()` | Normalizado en backend a `23:59:59.999`. |
| `minAmount` | `string` | `z.coerce.number().nonnegative().optional()` | Monto mayor o igual (`gte`). |
| `maxAmount` | `string` | `z.coerce.number().nonnegative().optional()` | Monto menor o igual (`lte`). |

**Reglas transversales:**
* Todos los filtros se combinan con **AND**; dentro de `tags` y de las relaciones de cuenta, con **OR**.
* `.refine()` en el schema: `startDate <= endDate` y `minAmount <= maxAmount`; si se viola, `400`.
* `page` siempre se elimina de la URL al cambiar cualquier filtro (reinicio a `1`).
* `meta.total`/`hasMore` se calculan sobre el subconjunto filtrado, nunca sobre la tabla completa.

---

## 3. Fase 1 — Implementación Backend (`feat/filters-backend`)

### Paso 1.1: Esquemas de Validación Zod (`src/schemas/movementSchemas.ts`)
* Crear `movementFiltersQuerySchema` aplicando las reglas de la tabla anterior.
* **Por qué:** Evita inyecciones de tipos inválidos en Prisma y centraliza la limpieza de datos (como dividir `tags` por comas) antes de tocar la base de datos.

### Paso 1.2: Constructor de Consulta Dinámica (`Prisma.MovementWhereInput`)
* En el servicio/controlador de movimientos, construir el objeto `where` utilizando evaluación condicional limpia:
  ```ts
  // Movement NO tiene `accountId` ni relación `account`: solo `incomeAccount` y `expenseAccount`.
  const accountFilter: Prisma.AccountWhereInput = {
    ...(accountId && { id: accountId }),
    ...(accountKind && { kind: accountKind }),
  };

  const where: Prisma.MovementWhereInput = {
    ...(type && { type }),
    ...(search && { description: { contains: search, mode: 'insensitive' } }),
    ...((accountId || accountKind) && {
      OR: [
        { incomeAccount: accountFilter },
        { expenseAccount: accountFilter },
      ],
    }),
    ...(tags?.length && { tags: { some: { id: { in: tags } } } }),
    ...((startDate || endDate) && {
      date: {
        ...(startDate && { gte: new Date(`${startDate}T00:00:00.000Z`) }),
        ...(endDate && { lte: new Date(`${endDate}T23:59:59.999Z`) }),
      },
    }),
    ...((minAmount !== undefined || maxAmount !== undefined) && {
      amount: {
        ...(minAmount !== undefined && { gte: minAmount }),
        ...(maxAmount !== undefined && { lte: maxAmount }),
      },
    }),
  };
   ```
* Por qué: Mantiene el código declarativo y aprovecha el tipado nativo de Prisma para relaciones (`incomeAccount`/`expenseAccount`, `tags.some`). El `OR` evita el error de compilación de usar un campo `accountId`/`account` inexistente y compone `accountId` + `accountKind` con **AND** sobre la misma cuenta.

### Paso 1.3: Ejecución Transaccional / Paralela en getAllMovements

   * Ejecutar Promise.all([prisma.movement.findMany({ where, skip, take, orderBy }), prisma.movement.count({ where })]).

   * Por qué: Garantiza que meta.total y meta.hasMore reflejen estrictamente el subconjunto filtrado y no toda la tabla.

### Paso 1.4: Auditoría Local (Kulala)

   * Probar combinaciones cruzadas (ej. GET /api/movements?type=EXPENSE&accountKind=CASH&tags=id1,id2) y verificar que meta.total coincida con los registros devueltos.

   * Casos borde obligatorios: `type=DEPOSIT` y `type=WITHDRAWAL`; `accountId` + `accountKind` juntos; `tags` con UUID inválido (`400`); `startDate > endDate` (`400`); `minAmount > maxAmount` (`400`); filtro sin coincidencias (`data: []`, `total: 0`, `hasMore: false`).

   * Nota de rendimiento: `contains` sin índice es costoso. No se modifica el schema en esta fase; si el volumen crece, evaluar índices en `date`, `type`, `incomeAccountId`, `expenseAccountId` y búsqueda de texto.

---

## 4. Fase 2 — Implementación Frontend (feat/filters-frontend + Skill zen-filter-builder)
### Bloque 0: Contrato de tipos y API

   * En `src/types/index.ts`: agregar `movementFiltersSchema` (mismo enum de tipo completo, incluyendo `DEPOSIT`/`WITHDRAWAL`) y `type MovementFilters`; no duplicar tipos locales.

   * En `src/api/MovementAPI.ts`: extender `GetMovementsParams` con los filtros opcionales y enviarlos en `params` (omitir vacíos). `getMovements` sigue validando con `movementPageSchema`.

### Bloque 1: Hook de Estado en URL (useMovementFilters.ts)

   * Usar useSearchParams de react-router-dom.

   * Exponer getters tipados para cada filtro y setters que eliminen automáticamente parámetros vacíos (searchParams.delete(key)).

   * Al escribir un filtro, eliminar `page` y usar `setSearchParams(next, { replace: true })` para no llenar el historial del navegador.

   * Calcular activeFiltersCount (excluyendo page y limit) para alimentar el indicador visual de la UI.

### Bloque 2: React Query & Debounce

   * Crear hook useDebouncedValue (400ms) para el input de búsqueda de texto (la URL solo se actualiza con el valor debounced).

   * Actualizar useInfiniteQuery incluyendo el objeto de filtros en la queryKey: `['movements', filters]`. Mantener el prefijo `['movements', ...]` para no romper las invalidaciones existentes.

### Bloque 3: Componentes Visuales Zen (src/components/filters/)

   * FilterBar.tsx: Barra primaria minimalista con input de búsqueda, selector rápido de tipo (Todos, Ingreso, Gasto) y botón toggle "Filtros" con badge contador.

   * AdvancedFiltersPanel.tsx: Panel colapsable con selector múltiple de tags, selector de cuenta / accountKind, rango de fechas y botón "Limpiar filtros".

   * Estado vacío filtrado: si hay filtros activos y `movements.length === 0`, mostrar "Sin resultados para estos filtros" con acción "Limpiar filtros".
