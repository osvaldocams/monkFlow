# Phase 27: Movement pagination backend

Este archivo registra la implementación del backend de paginación de movimientos en MonkFlow. La feature se documentó primero en `specs/movements-pagination.md` y se implementó en la rama `feat/movements-pagination-backend`, con el frontend pendiente en una rama apilada.

---

## Backend: paginación por offset de movimientos

### Objective

Permitir que `GET /api/movements` devuelva bloques paginados de movimientos, con validación de `page` y `limit`, orden determinista y metadatos suficientes para que el frontend implemente una carga incremental de 20 en 20.

---

### Sub-parte 1: Master Spec y contrato de API

<details>

* **Status:** Completed
* **Timestamp:** 2026-11-13
* **Archivo:** `specs/movements-pagination.md`

#### Crónica

Se definió la estrategia de Offset Pagination con `page` y `limit` mapeados a `skip` y `take` en Prisma. La ruta existente se conserva y el contrato de respuesta evoluciona de un arreglo plano a un envelope con metadatos.

El orden se definió como determinista:

```ts
orderBy: [
    { date: 'desc' },
    { createdAt: 'desc' },
]
```

El contrato de respuesta quedó así:

```json
{
  "data": [],
  "meta": {
    "total": 47,
    "page": 1,
    "limit": 20,
    "totalPages": 3,
    "hasMore": true
  }
}
```

Reglas principales:

- `page` es un entero mayor o igual a `1`; default `1`.
- `limit` es un entero entre `1` y `100`; default `20`.
- `totalPages` es `0` cuando no hay movimientos.
- `hasMore` es `page < totalPages`.
- Una página posterior a la última responde `200` con `data: []`, no `404`.

La estrategia de ramas quedó definida como apilada:

```text
main
└── feat/movements-pagination-backend
    └── feat/movements-pagination-frontend
```

El PR del backend no se fusiona hasta que el frontend esté listo, porque el cambio de contrato rompe temporalmente al cliente actual si se despliega solo.

</details>

---

### Sub-parte 2: Validación de query con Zod

<details>

* **Status:** Completed
* **Timestamp:** 2026-11-13
* **Archivos:**
  - `backend/src/schemas/movementSchemas.ts`
  - `backend/src/middleware/validateMovementQuery.ts`
  - `backend/src/routes/movementRoutes.ts`
  - `backend/package.json`
  - `backend/pnpm-lock.yaml`

#### Crónica

Se instaló `zod@4.6.7` en el backend. El proyecto no tenía validación de `req.query` en el módulo de movimientos; solo existían validaciones con `express-validator` para `body` y `param`.

Se creó un schema acotado al módulo de movimientos:

```ts
export const DEFAULT_MOVEMENTS_PAGE = 1
export const DEFAULT_MOVEMENTS_PAGE_LIMIT = 20
export const MAX_MOVEMENTS_PAGE_LIMIT = 100

export const getMovementsQuerySchema = z.object({
    page: z.coerce.number()
        .int('page must be an integer')
        .min(1, 'page must be greater than or equal to 1')
        .default(DEFAULT_MOVEMENTS_PAGE),
    limit: z.coerce.number()
        .int('limit must be an integer')
        .min(1, 'limit must be greater than or equal to 1')
        .max(
            MAX_MOVEMENTS_PAGE_LIMIT,
            `limit must be less than or equal to ${MAX_MOVEMENTS_PAGE_LIMIT}`
        )
        .default(DEFAULT_MOVEMENTS_PAGE_LIMIT),
})
```

Se agregó `validateMovementQuery` como middleware. El resultado validado se guarda en `res.locals.validatedQuery` para no mutar `req.query`, que en Express 5 funciona como getter.

Los errores de Zod se mapean al contrato existente del backend:

```json
{
  "errors": [
    {
      "msg": "limit must be less than or equal to 100",
      "path": "limit",
      "location": "query",
      "type": "field"
    }
  ]
}
```

La ruta se actualizó sin cambiar el path ni el método:

```ts
router.get('/', validateMovementQuery, MovementController.getAllMovements)
```

No se modificó la validación global de `backend/src/middleware/index.ts` ni la validación de creación de movimientos.

</details>

---

### Sub-parte 3: Controlador paginado

<details>

* **Status:** Completed
* **Timestamp:** 2026-11-13
* **Archivo:** `backend/src/controllers/MovementControllers.ts`

#### Crónica

`getAllMovements` ahora consume `page` y `limit` desde `res.locals.validatedQuery`, calcula `skip` y `take`, y ejecuta `findMany` junto con `count()` dentro de una transacción batch de Prisma.

```ts
const { page, limit } = res.locals.validatedQuery as GetMovementsQuery
const skip = (page - 1) * limit

const [movements, total] = await prisma.$transaction([
    prisma.movement.findMany({
        include: {
            incomeAccount: { select: { id: true, name: true, kind: true } },
            expenseAccount: { select: { id: true, name: true, kind: true } },
            tags: { select: { id: true, name: true, slug: true, color: true } },
        },
        orderBy: [
            { date: 'desc' },
            { createdAt: 'desc' },
        ],
        skip,
        take: limit,
    }),
    prisma.movement.count(),
])
```

Los metadatos se calculan en el backend:

```ts
const totalPages = total === 0 ? 0 : Math.ceil(total / limit)
const hasMore = page < totalPages
```

La respuesta final usa el envelope acordado:

```ts
return res.status(200).json({
    data: movements,
    meta: {
        total,
        page,
        limit,
        totalPages,
        hasMore,
    },
})
```

Se eliminó la interfaz `MovementQueryLocals`, que no se usaba y no tipaba `res.locals` por sí sola. El controlador tipa el valor validado con `GetMovementsQuery`.

`GET /api/movements/:id` no se modificó y sigue devolviendo un objeto plano.

</details>

---

### Sub-parte 4: Verificación manual

<details>

* **Status:** Completed
* **Timestamp:** 2026-11-13
* **Archivo local:** `backend/requests.http` (ignorado por git)

#### Crónica

Se agregaron requests de paginación a `backend/requests.http` y se ejecutó la matriz de verificación contra una base con 47 movimientos.

Casos verificados:

| Caso | Resultado |
| --- | --- |
| Request sin query | `200`; `page=1`; `limit=20`; `total=47`; `totalPages=3`; `hasMore=true` |
| `page=2&limit=20` | `200`; 20 ítems; `hasMore=true` |
| `page=3&limit=20` | `200`; 7 ítems; `hasMore=false` |
| `page=4&limit=20` | `200`; `data=[]`; `hasMore=false`; sin `404` |
| `limit=100` | `200`; 47 ítems; `totalPages=1`; `hasMore=false` |
| `page=0` | `400` con `errors[0].msg` |
| `limit=101` | `400` con `errors[0].msg` |
| `page=` | `400` |
| `page=abc` | `400` |
| `page=1.5` | `400` |
| `foo=bar&page=1` | `200`; parámetro desconocido ignorado |
| Orden | `date desc` y `createdAt desc` verificados en 47 movimientos |
| Integridad de páginas | 47 IDs únicos y mismo orden que `limit=100` |
| `GET /api/movements/:id` | `200`; objeto plano sin `data` ni `meta` |

También se ejecutaron:

```bash
pnpm -C backend exec tsc --noEmit
pnpm -C backend build
```

Ambos comandos pasan.

</details>

---

### Sub-parte 5: Alcance y cierre del backend

<details>

* **Status:** Completed
* **Timestamp:** 2026-11-13

#### Crónica

La rama `feat/movements-pagination-backend` quedó limitada al backend y a la documentación de la feature.

Confirmaciones de alcance:

- No se modificó `frontend/`.
- No se modificó `backend/prisma/schema.prisma`.
- No se ejecutaron migraciones.
- No se agregaron endpoints nuevos.
- No se tocaron los módulos de cuentas, tags, dashboard o dev.
- La única dependencia nueva es `zod` en el backend.

El PR del backend queda preparado pero no se fusiona hasta que la rama frontend esté lista. La rama frontend se creará desde `feat/movements-pagination-backend` para poder probar el contrato nuevo de punta a punta y luego se retargeteará a `main` cuando el backend se fusione.

</details>

---

## Próxima fase

La Fase 2 implementará en el frontend:

- Schema Zod para el envelope paginado.
- Migración de la lista a `useInfiniteQuery`.
- Aplanado de `data.pages`.
- Control "Cargar más" con estados de carga y fin de historial.
- Verificación de invalidación de caché después de crear, borrar y modificar tags.
