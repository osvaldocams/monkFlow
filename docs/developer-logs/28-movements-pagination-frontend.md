# Phase 28: Movement pagination frontend

Este archivo registra la implementación del frontend de paginación de movimientos en MonkFlow. La fase se construyó sobre la rama del backend para mantener el contrato paginado de punta a punta y se dejó como una rama apilada hasta que el backend esté fusionado.

---

## Frontend: carga incremental de movimientos

### Objective

Consumir el envelope paginado de `GET /api/movements`, mantener la lista en caché con `useInfiniteQuery` y permitir que el usuario cargue bloques de 20 movimientos sin recargar la página.

---

### Sub-parte 1: Rama, schemas y constantes

<details>

* **Status:** Completed
* **Timestamp:** 2026-11-13
* **Rama:** `feat/movements-pagination-frontend`
* **Archivos:**
  - `frontend/src/types/index.ts`
  - `frontend/src/constants/movementPagination.ts`

#### Crónica

La rama se creó desde `feat/movements-pagination-backend` para poder probar el nuevo contrato antes de fusionar el backend.

Se agregaron los schemas y tipos del envelope paginado:

```ts
export const paginationMetaSchema = z.object({
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    totalPages: z.number().int().nonnegative(),
    hasMore: z.boolean(),
})

export const movementPageSchema = z.object({
    data: z.array(movementSchema),
    meta: paginationMetaSchema,
})

export type PaginationMeta = z.infer<typeof paginationMetaSchema>
export type MovementPage = z.infer<typeof movementPageSchema>
```

También se agregaron las constantes compartidas de paginación:

```ts
export const MOVEMENTS_INITIAL_PAGE = 1
export const MOVEMENTS_PAGE_SIZE = 20
```

Después de migrar la API se eliminaron `movementListSchema` y `MovementList`, que ya no tenían usos.

</details>

---

### Sub-parte 2: Servicio API y `useInfiniteQuery`

<details>

* **Status:** Completed
* **Timestamp:** 2026-11-13
* **Archivos:**
  - `frontend/src/api/MovementAPI.ts`
  - `frontend/src/hooks/useMovements.ts`

#### Crónica

`MovementAPI.getMovements` ahora recibe `page` y `limit`, los envía como query params y valida la respuesta con `movementPageSchema`.

```ts
export interface GetMovementsParams {
    page: number
    limit: number
}

getMovements: async ({ page, limit }: GetMovementsParams): Promise<MovementPage> => {
    const { data } = await api.get("/movements", {
        params: { page, limit },
    })

    const response = movementPageSchema.safeParse(data)
    if (!response.success) {
        throw new Error("data received from the server does not match the expected format")
    }

    return response.data
}
```

El hook de lista se migró de `useQuery` a `useInfiniteQuery`:

```ts
const query = useInfiniteQuery({
    queryKey: ['movements', 'list'],
    queryFn: ({ pageParam }) =>
        MovementAPI.getMovements({
            page: pageParam,
            limit: MOVEMENTS_PAGE_SIZE,
        }),
    initialPageParam: MOVEMENTS_INITIAL_PAGE,
    getNextPageParam: (lastPage) =>
        lastPage.meta.hasMore
            ? lastPage.meta.page + 1
            : undefined,
})
```

La query key se mantuvo exactamente como `['movements', 'list']` para conservar las invalidaciones existentes. `useMovementById` y las mutaciones no se modificaron.

</details>

---

### Sub-parte 3: Vista, lista y control "Cargar más"

<details>

* **Status:** Completed
* **Timestamp:** 2026-11-13
* **Archivos:**
  - `frontend/src/views/movements/MovementView.tsx`
  - `frontend/src/components/movements/MovementsList.tsx`

#### Crónica

`MovementView` aplana las páginas cargadas y obtiene el total desde la primera página:

```tsx
const movements = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data]
)

const total = data?.pages[0]?.meta.total ?? 0
```

El error inicial solo reemplaza la vista cuando no hay datos:

```tsx
if (isError && !data) {
    return <div>Error: {errorMessage}</div>
}
```

La lista recibe el contrato de paginación:

```ts
interface MovementsListProps {
    movements: Movement[]
    total: number
    hasNextPage: boolean
    isFetchingNextPage: boolean
    isFetchNextPageError: boolean
    onLoadMore: () => void
}
```

El footer decorativo anterior se reemplazó por un único footer compartido para móvil y desktop. El botón:

- Muestra “Cargar más” cuando hay siguiente página.
- Se deshabilita y muestra “Cargando...” con `Loader2` mientras `isFetchingNextPage` es `true`.
- Cambia a “Reintentar” si falla la carga del siguiente bloque.
- Desaparece en la última página y muestra “Has llegado al final del historial”.

También se muestra el conteo discreto:

```text
Mostrando X de Y
```

No se derivó `hasNextPage` desde `movements.length < total`; la fuente de verdad sigue siendo `meta.hasMore` a través de TanStack Query.

</details>

---

### Sub-parte 4: Verificación E2E e invalidación de caché

<details>

* **Status:** Completed
* **Timestamp:** 2026-11-13

#### Crónica

Se ejecutó la matriz de verificación de la Master Spec con una base de 47 movimientos.

**API**

- Defaults: `page=1`, `limit=20`, `total=47`, `totalPages=3`, `hasMore=true`.
- Páginas 1, 2 y 3: 20, 20 y 7 movimientos.
- Página 4 y `page=9999`: `200` con `data=[]` y `hasMore=false`.
- `limit=100`: 47 movimientos.
- Valores inválidos de `page` y `limit`: `400` conservando `errors[0].msg`.
- Orden `date desc` y `createdAt desc` verificado.
- 47 IDs únicos, sin duplicados entre páginas.
- `GET /api/movements/:id` conserva el objeto plano.

**Navegador**

- Carga inicial: 20 de 47 y botón “Cargar más”.
- Segundo bloque: 40 de 47.
- Último bloque: 47 de 47, mensaje de fin y botón oculto.
- Estado vacío verificado interceptando la respuesta de la API.
- Error inicial verificado con respuesta `500`.
- Error de siguiente bloque: la lista de 20 permanece visible, aparece “Reintentar” y el reintento carga el siguiente bloque.
- Crear movimiento: el total pasa a 48, el movimiento nuevo aparece primero y la lista se refetchea.
- Borrar movimiento: el total vuelve a 47 y la lista se refetchea.
- Agregar y quitar tag: se ejecutan `POST` y `DELETE`, y la lista se invalida al volver.
- Los datos de prueba se eliminaron y la base quedó restaurada en 47 movimientos.

**Comandos**

```bash
pnpm -C backend exec tsc --noEmit
pnpm -C backend build
pnpm -C frontend lint
pnpm -C frontend exec tsc --noEmit -p tsconfig.app.json
pnpm -C frontend build
```

Backend pasa typecheck y build. El frontend mantiene únicamente los fallos preexistentes documentados en `AGENTS.md`: variables sin usar en `MovementForm.tsx`, whitespace irregular en `useAccounts.ts` y `useMovements.ts`, y el warning de `TagForm.tsx`. La feature no agregó errores nuevos.

</details>

---

### Sub-parte 5: Cierre y alcance

<details>

* **Status:** Completed
* **Timestamp:** 2026-11-13

#### Crónica

El diff contra `feat/movements-pagination-backend` quedó limitado a los archivos previstos del frontend:

```text
frontend/src/api/MovementAPI.ts
frontend/src/components/movements/MovementsList.tsx
frontend/src/constants/movementPagination.ts
frontend/src/hooks/useMovements.ts
frontend/src/types/index.ts
frontend/src/views/movements/MovementView.tsx
```

Confirmaciones de alcance:

- No se modificó el backend en esta fase.
- No se modificó `backend/prisma/schema.prisma`.
- No se agregaron endpoints.
- No se agregaron dependencias al frontend.
- No se cambió la query key de la lista.
- No se cambió el mecanismo de invalidación existente.

Commits de la fase:

```text
e1e0de6 feat(types): add paginated movements schema and page size constants
5ba8f29 feat(api): paginate movements service and infinite query hook
947e3fb feat(movements): add load more pagination controls
```

La spec sugería `feat(movements): add incremental pagination UI`; el cambio se materializó en los tres commits anteriores. El cierre documental usa `docs(logs): add phase 28 movements pagination frontend log`.

La rama se mantiene apilada sobre `feat/movements-pagination-backend`. El PR del frontend debe abrirse con base en esa rama y retargetearse a `main` después de fusionar el backend.

</details>

---

## Próximo paso

Abrir el PR del frontend con base en `feat/movements-pagination-backend`, mantenerlo sin fusionar hasta que el backend esté listo y retargetearlo a `main` después del merge del backend.
