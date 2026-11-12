# Master Spec: Movement Pagination

- **Estado:** Propuesta, pendiente de aprobación
- **Fecha:** 2026-11-12
- **Ramas:**
  - `feat/movements-pagination-backend`
  - `feat/movements-pagination-frontend`
- **Alcance:** backend y frontend
- **Documento:** `specs/movements-pagination.md`
- **Dependencia nueva:** `zod` en `backend` (el frontend ya lo usa)
- **Cambios de base de datos:** ninguno

---

## 0. Resumen ejecutivo

El endpoint actual `GET /api/movements` devuelve la colección completa de movimientos en un arreglo, sin límite ni metadatos. A medida que crece el historial, el payload y el trabajo de renderizado crecen sin control.

Esta feature introduce **Offset Pagination** sobre el endpoint existente:

- `page` y `limit` en query string.
- `skip = (page - 1) * limit` y `take = limit` en Prisma.
- Orden determinista: `date: 'desc'`, `createdAt: 'desc'`.
- Respuesta en envelope: `{ data, meta }`.
- Validación en tiempo de ejecución de `req.query` con Zod, acotada al módulo de movimientos.
- Frontend con `useInfiniteQuery` y carga incremental de 20 en 20 mediante un control "Cargar más".

La ruta `GET /api/movements` se conserva. Lo que evoluciona es el contrato de respuesta. Por eso el backend y el frontend deben coordinarse antes de desplegar en un entorno compartido.

---

## 1. Contexto verificado

Hechos comprobados en el repositorio actual:

- `backend/src/controllers/MovementControllers.ts:103` implementa `getAllMovements` con `prisma.movement.findMany`, `include` de cuentas y tags, y `orderBy: { date: 'desc' }`. Devuelve un arreglo plano con `res.status(200).json(movements)`.
- `backend/src/routes/movementRoutes.ts:53` registra `router.get('/', MovementController.getAllMovements)` sin validación de query.
- El backend no tiene `zod` instalado. Usa `express-validator` para `body` y `param`, pero no valida `req.query` en el módulo de movimientos.
- `frontend/src/api/MovementAPI.ts:18` consume el endpoint y valida la respuesta con `movementListSchema`, que hoy es `z.array(movementSchema)`.
- `frontend/src/hooks/useMovements.ts:16` usa `useQuery` con query key `['movements', 'list']`.
- `frontend/src/views/movements/MovementView.tsx` pasa el arreglo directamente a `MovementsList`.
- `frontend/src/components/movements/MovementsList.tsx` renderiza tarjetas en móvil y tabla en desktop. Su footer actual tiene un botón decorativo "Ver historial completo" que no ejecuta ninguna acción.
- Las mutaciones actuales invalidan `['movements']` o `['movements', 'list']`. No existe endpoint de edición de movimientos; "editar" en el estado actual equivale a agregar o quitar tags.
- `Movement.amount` es `Decimal(12,2)` en Prisma. En JSON, Prisma serializa el `Decimal` como string; el frontend ya lo normaliza con `z.coerce.number()`.
- No hay suite de tests. La verificación es compilación, typecheck y pruebas HTTP/E2E manuales.

---

## 2. Visión general y reglas de negocio

### 2.1 Objetivo

Permitir que la vista de movimientos cargue los últimos 20 registros y libere bloques adicionales de 20 bajo demanda, sin descargar todo el historial en la primera petición y sin romper la ruta existente.

### 2.2 Alcance

- Backend:
  - Validar `req.query` con Zod.
  - Paginar `GET /api/movements`.
  - Devolver `data` y `meta`.
  - Mantener el `include` actual de cuentas y tags.
- Frontend:
  - Validar el nuevo envelope con Zod.
  - Migrar la lista de movimientos a `useInfiniteQuery`.
  - Aplanar páginas y renderizar un control "Cargar más".
  - Mantener la invalidación de caché existente.

### 2.3 No objetivos

- No implementar búsqueda, filtros por fecha, tipo, cuenta o tag.
- No implementar cursor pagination ni keyset pagination.
- No implementar scroll infinito automático.
- No modificar `schema.prisma` ni ejecutar migraciones.
- No agregar índices de base de datos en esta fase.
- No cambiar los endpoints `GET /api/movements/:id`, `POST /api/movements`, `DELETE /api/movements/:id` ni los endpoints de tags.
- No agregar autenticación ni multi-usuario.
- No introducir un modo legacy que devuelva el arreglo plano.
- No implementar un endpoint de edición de movimientos.

### 2.4 Reglas de negocio

| Regla | Valor |
| --- | --- |
| Estrategia | Offset pagination |
| Parámetro `page` | Entero `>= 1`; por defecto `1` |
| Parámetro `limit` | Entero entre `1` y `100`; por defecto `20` |
| Tamaño de bloque del frontend | `20` |
| `skip` | `(page - 1) * limit` |
| `take` | `limit` |
| Orden primario | `date: 'desc'` |
| Orden secundario | `createdAt: 'desc'` |
| `total` | Total de movimientos sin filtros |
| `totalPages` | `total === 0 ? 0 : Math.ceil(total / limit)` |
| `hasMore` | `page < totalPages` |
| Página fuera de rango | `200` con `data: []`, sin `404` |
| Query inválida | `400` con `{ errors: [...] }` |
| Envelope | `{ data: Movement[], meta: { total, page, limit, totalPages, hasMore } }` |

Reglas adicionales:

1. `page` y `limit` son opcionales; si faltan, se aplican los defaults.
2. Los parámetros desconocidos se ignoran, salvo que interfieran con el parseo de `page` o `limit`.
3. Valores vacíos, negativos, decimales o no numéricos producen `400`.
4. `meta.page` refleja la página solicitada, no una página corregida o clampeada.
5. `meta.total` no cambia por paginar; es el total global.
6. `hasMore` es la fuente de verdad para que el frontend decida si debe mostrar "Cargar más".
7. La primera carga del frontend usa `page=1&limit=20`.
8. Cada clic en "Cargar más" solicita exactamente la página `meta.page + 1` de la última página exitosa.

### 2.5 Estrategia de ramas

```text
main
└── feat/movements-pagination-backend
    └── feat/movements-pagination-frontend
```

Secuencia recomendada:

1. Crear `feat/movements-pagination-backend` desde `main`.
2. Implementar, verificar y revisar el backend.
3. Crear `feat/movements-pagination-frontend` desde la rama backend, no desde `main`, para poder probar E2E con el contrato nuevo.
4. Abrir el PR del backend.
5. Abrir el PR del frontend con base en la rama backend. Cuando el PR del backend se fusione, retargetear el PR del frontend a `main`.
6. No desplegar la rama backend sola en un entorno con frontend antiguo: el frontend actual espera un arreglo plano y fallará con el envelope.

El usuario realiza los merges. No se debe commitear directamente a `main`.

---

## 3. Contrato de API (fuente única de verdad)

### 3.1 Endpoint y request

```http
GET /api/movements?page=1&limit=20
```

| Parámetro | Tipo | Obligatorio | Default | Rango | Descripción |
| --- | --- | --- | --- | --- | --- |
| `page` | entero | No | `1` | `>= 1` | Página solicitada, base 1 |
| `limit` | entero | No | `20` | `1..100` | Cantidad de movimientos por página |

La ruta se mantiene exactamente igual:

```http
GET /api/movements
```

En ese caso se aplican `page=1` y `limit=20`.

### 3.2 Validación Zod de query (backend)

Archivo propuesto: `backend/src/schemas/movementSchemas.ts`.

Contrato exacto:

```ts
import { z } from 'zod'

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

export type GetMovementsQuery = z.infer<typeof getMovementsQuerySchema>
```

Notas de contrato:

- `z.object` elimina claves desconocidas por defecto. No se usa `.strict()`.
- `?page=` (string vacío) se coercionará a `0` y fallará por `.min(1)`, produciendo `400`.
- `?page=1&page=2` llega como arreglo; la coerción produce `NaN` y falla, produciendo `400`.
- `?limit=100` es válido; `?limit=101` produce `400`.
- No se valida un máximo de `page`; una página muy alta devuelve `data: []`.

### 3.3 Respuesta 200

```json
{
  "data": [
    {
      "id": "6a0f7e1c-3a4b-4c8d-9e2f-1234567890ab",
      "type": "EXPENSE",
      "amount": "125.50",
      "description": "Supermercado",
      "date": "2026-11-10T00:00:00.000Z",
      "createdAt": "2026-11-10T14:32:10.120Z",
      "updatedAt": "2026-11-10T14:32:10.120Z",
      "incomeAccountId": null,
      "expenseAccountId": "b1c2d3e4-5678-4901-8abc-def012345678",
      "incomeAccount": null,
      "expenseAccount": {
        "id": "b1c2d3e4-5678-4901-8abc-def012345678",
        "name": "Cuenta principal",
        "kind": "BANK"
      },
      "tags": [
        {
          "id": "c1d2e3f4-5678-4901-8abc-def012345678",
          "name": "Comida",
          "slug": "comida",
          "color": "#6B7280"
        }
      ]
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3,
    "hasMore": true
  }
}
```

Notas:

- `amount` viaja como string en JSON por la serialización de `Prisma.Decimal`. El schema del frontend usa `z.coerce.number()` y lo convierte a número.
- `date`, `createdAt` y `updatedAt` viajan como strings ISO 8601.
- El backend devuelve todos los campos escalares del movimiento además de las relaciones incluidas. El schema del frontend valida solo los campos que consume y descarta el resto.
- `incomeAccount` y `expenseAccount` son `null` cuando el tipo de movimiento no usa esa cuenta.
- `tags` siempre es un arreglo, vacío si no hay tags.

### 3.4 Tipos exactos del backend

Contrato de referencia, sin implementación completa:

```ts
import type { Prisma } from '@prisma/client'

export interface MovementPaginationMeta {
    total: number
    page: number
    limit: number
    totalPages: number
    hasMore: boolean
}

export type MovementWithRelations = Prisma.MovementGetPayload<{
    include: {
        incomeAccount: {
            select: { id: true; name: true; kind: true }
        }
        expenseAccount: {
            select: { id: true; name: true; kind: true }
        }
        tags: {
            select: { id: true; name: true; slug: true; color: true }
        }
    }
}>

export interface GetMovementsResponse {
    data: MovementWithRelations[]
    meta: MovementPaginationMeta
}
```

### 3.5 Errores

#### Query inválida

**Status:** `400 Bad Request`

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

El middleware de validación debe mapear `result.error.issues` de Zod a ese arreglo. Se preserva el contrato existente: el frontend lee `errors[0].msg || error || message` en `frontend/src/api/handleApiErrors.ts`.

#### Error interno

**Status:** `500 Internal Server Error`

```json
{
  "errors": [
    {
      "msg": "Error fetching movements"
    }
  ]
}
```

Se mantiene el patrón actual: detalle real en `console.error`, mensaje genérico en la respuesta.

### 3.6 Casos borde

| Caso | Request | Respuesta esperada |
| --- | --- | --- |
| Sin movimientos | `GET /api/movements` | `200`; `data: []`; `total: 0`; `totalPages: 0`; `hasMore: false` |
| Primera página con menos de 20 | `total=5`, `limit=20` | `data.length=5`; `totalPages=1`; `hasMore=false` |
| Primera página llena | `total=45`, `page=1`, `limit=20` | `data.length=20`; `totalPages=3`; `hasMore=true` |
| Página intermedia | `total=45`, `page=2`, `limit=20` | `data.length=20`; `totalPages=3`; `hasMore=true` |
| Última página parcial | `total=45`, `page=3`, `limit=20` | `data.length=5`; `totalPages=3`; `hasMore=false` |
| Última página exacta | `total=40`, `page=2`, `limit=20` | `data.length=20`; `totalPages=2`; `hasMore=false` |
| Página posterior a la última | `total=45`, `page=4`, `limit=20` | `200`; `data: []`; `meta.page=4`; `totalPages=3`; `hasMore=false`; no `404` |
| Defaults | `GET /api/movements` | `meta.page=1`; `meta.limit=20` |
| Límite máximo | `?limit=100` | `200`; `meta.limit=100` |
| Límite excedido | `?limit=101` | `400` |
| Página inválida | `?page=0`, `?page=-1`, `?page=1.5`, `?page=abc` | `400` |
| Query vacía | `?page=` o `?limit=` | `400` |
| Parámetros desconocidos | `?foo=bar&page=1` | `200`; `foo` ignorado |
| Misma fecha | Dos movimientos con igual `date` | El de mayor `createdAt` aparece primero |
| Cambio concurrente | Se crea o borra un movimiento entre dos páginas | Offset puede duplicar u omitir un ítem; se mitiga invalidando caché tras mutaciones |

### 3.7 Compatibilidad y transición

- La ruta y el método HTTP no cambian.
- Los query params son opcionales, así que una petición sin parámetros sigue funcionando a nivel de transporte.
- El body de respuesta cambia de `Movement[]` a `{ data, meta }`. Cualquier consumidor que espere el arreglo plano debe actualizarse.
- En este repositorio, el único consumidor es `frontend/src/api/MovementAPI.ts`.
- No se agrega un modo legacy. La coordinación se resuelve con ramas apiladas y una ventana de merge controlada.
- El endpoint `GET /api/movements/:id` no cambia y sigue devolviendo un objeto `Movement` plano.

---

## 4. Fase 0: Aprobación de la Master Spec

- **Archivos:** `specs/movements-pagination.md`.
- **Pasos:**
  1. Revisar y aprobar el contrato de API.
  2. Confirmar `limit` máximo `100` y tamaño de bloque `20`.
  3. Confirmar la estrategia de ramas apiladas.
  4. Confirmar que no se modifica el esquema de Prisma.
- **Criterio de aceptación:** spec aprobada por el responsable del proyecto.
- **Rollback:** no aplica.

---

## 5. Fase 1: Backend (`feat/movements-pagination-backend`)

### 5.1 Rama y archivos

```bash
git checkout main
git pull
git checkout -b feat/movements-pagination-backend
```

| Archivo | Tipo | Cambio |
| --- | --- | --- |
| `backend/package.json` | Modificar | Agregar `zod` como dependencia |
| `backend/pnpm-lock.yaml` | Modificar | Lockfile actualizado por `pnpm add` |
| `backend/src/schemas/movementSchemas.ts` | Nuevo | Constantes, schema de query y tipos |
| `backend/src/middleware/validateMovementQuery.ts` | Nuevo | Middleware de validación acotado a movimientos |
| `backend/src/controllers/MovementControllers.ts` | Modificar | `getAllMovements` paginado |
| `backend/src/routes/movementRoutes.ts` | Modificar | Aplicar el middleware a `GET /` |
| `backend/requests.http` | Local, ignorado | Requests manuales de verificación |
| `docs/developer-logs/27-movements-pagination-backend.md` | Opcional | Bitácora de la fase |

Instalación de la dependencia:

```bash
pnpm -C backend add zod
```

No se agregan otras dependencias. No se toca el frontend en esta rama.

### 5.2 Paso 1.1: Esquemas Zod y validación de `req.query`

**Objetivo:** eliminar el tipado local sin validación en runtime para la query de movimientos y reemplazarlo por un contrato Zod.

Crear `backend/src/schemas/movementSchemas.ts` con el contenido exacto definido en la sección 3.2.

Crear `backend/src/middleware/validateMovementQuery.ts`:

```ts
import type { Request, Response, NextFunction } from 'express'
import {
    getMovementsQuerySchema,
    type GetMovementsQuery,
} from '../schemas/movementSchemas.js'

export interface MovementQueryLocals {
    validatedQuery: GetMovementsQuery
}

export const validateMovementQuery = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const result = getMovementsQuerySchema.safeParse(req.query)

    if (!result.success) {
        return res.status(400).json({
            errors: result.error.issues.map((issue) => ({
                msg: issue.message,
                path: issue.path.join('.'),
                location: 'query',
                type: 'field',
            })),
        })
    }

    res.locals.validatedQuery = result.data
    next()
}
```

Reglas de implementación:

1. No mutar `req.query`. En Express 5, `req.query` es un getter; el valor validado se guarda en `res.locals.validatedQuery`.
2. El controlador consume `res.locals.validatedQuery` y lo tipa como `GetMovementsQuery`.
3. El middleware vive en un archivo propio del módulo de movimientos. No se modifica la validación global de `backend/src/middleware/index.ts`.
4. No se toca la validación de `createMovement` con `express-validator`.
5. La interfaz local `CreateMovementInput` pertenece al body de creación y queda fuera del alcance de esta fase. No se cambia su forma. El reemplazo de tipado local aplica a la query de paginación.

Actualizar `backend/src/routes/movementRoutes.ts`:

```ts
import { validateMovementQuery } from "../middleware/validateMovementQuery.js"

// GET ALL MOVEMENTS
router.get('/', validateMovementQuery, MovementController.getAllMovements)
```

**Criterio de aceptación:**

- `pnpm -C backend exec tsc --noEmit` pasa.
- `GET /api/movements?page=0` responde `400`.
- `GET /api/movements?limit=101` responde `400`.
- `GET /api/movements` responde `200` con defaults.
- El error `400` conserva `errors[0].msg`.

### 5.3 Paso 1.2: Paginar `getAllMovements`

Actualizar `MovementController.getAllMovements` para:

1. Leer `page` y `limit` desde `res.locals.validatedQuery`.
2. Calcular `skip` y `take`.
3. Ejecutar `findMany` y `count` en una transacción batch de Prisma.
4. Calcular `totalPages` y `hasMore`.
5. Responder con el envelope.

Contrato de referencia:

```ts
static getAllMovements = async (req: Request, res: Response) => {
    try {
        const { page, limit } = res.locals
            .validatedQuery as GetMovementsQuery

        const skip = (page - 1) * limit

        const [data, total] = await prisma.$transaction([
            prisma.movement.findMany({
                include: {
                    incomeAccount: {
                        select: { id: true, name: true, kind: true },
                    },
                    expenseAccount: {
                        select: { id: true, name: true, kind: true },
                    },
                    tags: {
                        select: { id: true, name: true, slug: true, color: true },
                    },
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

        const totalPages = total === 0 ? 0 : Math.ceil(total / limit)
        const hasMore = page < totalPages

        return res.status(200).json({
            data,
            meta: {
                total,
                page,
                limit,
                totalPages,
                hasMore,
            },
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            errors: [{ msg: 'Error fetching movements' }],
        })
    }
}
```

Decisiones:

- Se usa `prisma.$transaction([...])` en lugar de `Promise.all` para obtener una lectura consistente de `data` y `total` dentro de la misma transacción.
- El `include` existente no cambia.
- El `orderBy` se vuelve un arreglo para aplicar el desempate por `createdAt`.
- No se modifica el tipo de retorno de `GET /api/movements/:id`.
- No se usa SQL crudo ni `$queryRaw`.
- No se agrega índice en esta fase.

**Criterio de aceptación:**

- `findMany` usa `skip` y `take` derivados de `page` y `limit`.
- `count()` no recibe filtros y representa el total global.
- `totalPages` es `0` cuando `total` es `0`.
- `hasMore` es `false` en la última página y en páginas posteriores a la última.
- `pnpm -C backend build` pasa.
- `git diff` no incluye cambios en `schema.prisma`, `accounts`, `tags`, `dashboard` ni `dev`.

### 5.4 Paso 1.3: Verificación manual con Kulala/REST client

Agregar requests locales en `backend/requests.http` (archivo ignorado por git):

```http
### Movements - default page
GET http://localhost:3000/api/movements

### Movements - page 2
GET http://localhost:3000/api/movements?page=2&limit=20

### Movements - max limit
GET http://localhost:3000/api/movements?page=1&limit=100

### Movements - last page
GET http://localhost:3000/api/movements?page=3&limit=20

### Movements - beyond last page
GET http://localhost:3000/api/movements?page=4&limit=20

### Movements - invalid page
GET http://localhost:3000/api/movements?page=0

### Movements - invalid limit
GET http://localhost:3000/api/movements?limit=101

### Movements - unknown query param
GET http://localhost:3000/api/movements?foo=bar&page=1
```

Matriz de verificación:

| Caso | Preparación | Resultado esperado |
| --- | --- | --- |
| Defaults | Base con movimientos, request sin query | `200`; `meta.page=1`; `meta.limit=20` |
| Paginación básica | 45 movimientos | `page=1`: 20 ítems, `hasMore=true`; `page=3`: 5 ítems, `hasMore=false` |
| Página fuera de rango | 45 movimientos, `page=4` | `200`; `data=[]`; `hasMore=false`; no `404` |
| Lista vacía | Base sin movimientos | `200`; `data=[]`; `total=0`; `totalPages=0`; `hasMore=false` |
| Límite máximo | `limit=100` | `200`; `meta.limit=100` |
| Límite excedido | `limit=101` | `400` con `errors[0].msg` |
| Página inválida | `page=0`, `page=-1`, `page=1.5`, `page=abc` | `400` |
| Query vacía | `page=` o `limit=` | `400` |
| Parámetro desconocido | `foo=bar&page=1` | `200`; `foo` ignorado |
| Orden determinista | Dos movimientos con la misma `date` y `createdAt` distinto | El de `createdAt` mayor aparece primero |
| Endpoint por ID intacto | `GET /api/movements/:id` | Sigue devolviendo un objeto plano |
| Error interno | Forzar fallo de DB o revisar logs | `500` con `errors[0].msg` genérico |

Comandos:

```bash
pnpm -C backend exec tsc --noEmit
pnpm -C backend build
```

**Criterio de aceptación:** todos los casos de la matriz pasan y el diff respeta el alcance.

### 5.5 Cierre de la Fase 1

- Revisar `git status` y `git diff`.
- Confirmar que no se tocó el frontend.
- Confirmar que no se tocó `schema.prisma`.
- Crear la bitácora opcional `docs/developer-logs/27-movements-pagination-backend.md`.
- Commit sugerido: `feat(movements): add Zod query validation and offset pagination`.
- Abrir PR del backend. No fusionar ni desplegar solo si el frontend aún espera el arreglo plano.

**Rollback:** revertir el commit de la rama. No hay migraciones ni cambios de datos. El endpoint vuelve al arreglo plano; el frontend debe revertirse en conjunto.

---

## 6. Fase 2: Frontend (`feat/movements-pagination-frontend`)

### 6.1 Rama y archivos

Crear la rama desde la rama backend para probar el contrato nuevo:

```bash
git checkout feat/movements-pagination-backend
git checkout -b feat/movements-pagination-frontend
```

| Archivo | Tipo | Cambio |
| --- | --- | --- |
| `frontend/src/types/index.ts` | Modificar | Schema y tipos de paginación |
| `frontend/src/constants/movementPagination.ts` | Nuevo | Constantes de página y bloque |
| `frontend/src/api/MovementAPI.ts` | Modificar | `getMovements` con params y nuevo schema |
| `frontend/src/hooks/useMovements.ts` | Modificar | `useInfiniteQuery` para la lista |
| `frontend/src/views/movements/MovementView.tsx` | Modificar | Aplanar páginas y estados de paginación |
| `frontend/src/components/movements/MovementsList.tsx` | Modificar | Footer "Cargar más" y fin de historial |
| `docs/developer-logs/28-movements-pagination-frontend.md` | Opcional | Bitácora de la fase |

No se modifican `useMovementById`, las mutaciones de creación/borrado ni los componentes de detalle, salvo que el tipado lo exija.

### 6.2 Paso 2.1: Esquemas Zod y tipos del cliente

En `frontend/src/types/index.ts`, agregar:

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

Reglas:

1. `movementSchema` no cambia. Sigue usando `z.coerce.number()` para `amount`.
2. `movementPageSchema` reemplaza el uso de `movementListSchema` en la lista.
3. Eliminar `movementListSchema` y `MovementList` si no quedan usos. Hoy el único uso es `MovementAPI.getMovements`.
4. No crear un tipo local duplicado para la respuesta paginada; la fuente de verdad es `movementPageSchema`.
5. El tipo `MovementPage` representa una página, no el acumulado.

Crear `frontend/src/constants/movementPagination.ts`:

```ts
export const MOVEMENTS_INITIAL_PAGE = 1
export const MOVEMENTS_PAGE_SIZE = 20
```

**Criterio de aceptación:** `MovementPage` infiere `{ data: Movement[]; meta: PaginationMeta }` y no hay referencias colgantes a `movementListSchema`.

### 6.3 Paso 2.2: Servicio API y `useInfiniteQuery`

Actualizar `frontend/src/api/MovementAPI.ts`:

```ts
import {
    movementPageSchema,
    movementSchema,
    tagSchema,
    type CreateMovementDto,
    type Movement,
    type MovementPage,
    type Tag,
} from "@/types"

export interface GetMovementsParams {
    page: number
    limit: number
}

getMovements: async ({ page, limit }: GetMovementsParams): Promise<MovementPage> => {
    try {
        const { data } = await api.get("/movements", {
            params: { page, limit },
        })

        const response = movementPageSchema.safeParse(data)
        if (!response.success) {
            if (import.meta.env.DEV) {
                console.error('Zod Validation Error:', response.error.format())
            }
            throw new Error(
                "data received from the server does not match the expected format"
            )
        }

        return response.data
    } catch (error) {
        handleApiError(error, "MovementAPI.getMovements", { page, limit })
    }
}
```

Actualizar `frontend/src/hooks/useMovements.ts` para la lista:

```ts
import { useInfiniteQuery } from '@tanstack/react-query'
import { MOVEMENTS_INITIAL_PAGE, MOVEMENTS_PAGE_SIZE } from '@/constants/movementPagination'

export const useMovements = () => {
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

    return {
        ...query,
        errorMessage: query.error instanceof Error ? query.error.message : null,
    }
}
```

Reglas:

1. La query key se mantiene exactamente como `['movements', 'list']` para que las invalidaciones existentes sigan funcionando.
2. `initialPageParam` es `1`.
3. `getNextPageParam` usa `lastPage.meta.hasMore` y `lastPage.meta.page + 1`. No calcula `totalPages` en el cliente.
4. Si `hasMore` es `false`, retorna `undefined`; TanStack marca `hasNextPage = false`.
5. No se usa `useQuery` para la lista.
6. `useMovementById` sigue usando `useQuery` y no se toca.
7. Las mutaciones no cambian sus query keys de invalidación.

**Criterio de aceptación:** el hook expone `data.pages`, `fetchNextPage`, `hasNextPage`, `isFetchingNextPage` y `isFetchNextPageError`.

### 6.4 Paso 2.3: Vista, lista y control "Cargar más"

`MovementView` debe aplanar las páginas:

```tsx
import { useMemo } from "react"
import { useMovements } from "@/hooks/useMovements"

const {
    data,
    isLoading,
    isError,
    errorMessage,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
} = useMovements()

const movements = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data]
)

const total = data?.pages[0]?.meta.total ?? 0
```

Reglas de renderizado:

1. Error inicial: mostrar el bloque de error solo si `isError && !data`.
2. Error al cargar el siguiente bloque: conservar la lista ya cargada y mostrar un aviso inline con opción de reintentar. No reemplazar toda la vista por el error.
3. Lista vacía: mostrar "No hay movimientos registrados aun" solo cuando la carga inicial terminó y `movements.length === 0`.
4. Lista con datos: pasar a `MovementsList` los movimientos aplanados, `total`, `hasNextPage`, `isFetchingNextPage`, `isFetchNextPageError` y `onLoadMore`.
5. `onLoadMore` debe llamar a `fetchNextPage()`.
6. No derivar `hasNextPage` de `movements.length < total`; la fuente de verdad es `meta.hasMore` vía TanStack.
7. No usar `isFetching` para el botón: `isFetching` también es `true` durante refetches en background. El estado del bloque es `isFetchingNextPage`.

Contrato de props de `MovementsList`:

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

El footer actual debe reemplazarse. El botón "Ver historial completo" es decorativo y no debe conservarse. El nuevo footer es compartido por móvil y desktop, y se renderiza una sola vez fuera de las dos variantes de lista.

Contrato visual de referencia, minimalista y usando tokens del tema:

```tsx
<div className="flex flex-col items-center gap-2 border-t border-linen-light px-5 py-6">
    {hasNextPage ? (
        <button
            type="button"
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
            aria-busy={isFetchingNextPage}
            className="inline-flex items-center gap-2 rounded-full border border-linen-light bg-white px-5 py-2 text-sm font-medium text-clay-gray transition-colors hover:border-sage hover:text-green-balance focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage disabled:cursor-wait disabled:opacity-60"
        >
            {isFetchingNextPage ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando...
                </>
            ) : isFetchNextPageError ? (
                'Reintentar'
            ) : (
                'Cargar más'
            )}
        </button>
    ) : (
        movements.length > 0 && (
            <p className="text-xs tracking-wide text-clay-gray" aria-live="polite">
                Has llegado al final del historial
            </p>
        )
    )}

    <p className="text-[11px] text-clay-gray">
        Mostrando {movements.length} de {total}
    </p>
</div>
```

Reglas de UX:

1. La carga inicial de 20 movimientos no muestra el botón hasta que la primera página está disponible.
2. Mientras `isFetchingNextPage` es `true`, el botón se deshabilita, cambia a "Cargando..." y muestra un spinner de `lucide-react` (`Loader2`).
3. La lista existente permanece visible durante la carga del siguiente bloque. No hay pantalla de carga completa.
4. En la última página se oculta el botón y aparece el mensaje de fin de historial.
5. Si falla el siguiente bloque, se mantiene la lista y el botón cambia a "Reintentar". Al reintentar se vuelve a llamar a `fetchNextPage()`.
6. Se muestra el conteo "Mostrando X de Y" como referencia discreta.
7. El control usa `border-linen-light`, `text-clay-gray`, `hover:border-sage`, `hover:text-green-balance`, `focus-visible:ring-sage` y `animate-spin`. No se usan hex crudos ni la paleta por defecto de Tailwind.
8. El botón tiene `type="button"`, estado `disabled` y `aria-busy` para accesibilidad.
9. El footer se renderiza una sola vez; no se duplica en la vista móvil y desktop.

**Criterio de aceptación:**

- La lista muestra 20 movimientos al entrar.
- "Cargar más" agrega 20 más sin recargar la página.
- Al llegar a la última página, el botón desaparece y aparece el mensaje de fin.
- Los estados de carga, error y vacío son distinguibles.
- No hay errores de key duplicada en React.

### 6.5 Paso 2.4: Verificación E2E e invalidación de caché

#### Invalidación existente

No se cambia el mecanismo de invalidación. Se debe verificar que las query keys sigan siendo compatibles:

| Mutación | Invalidación actual | Efecto esperado con `useInfiniteQuery` |
| --- | --- | --- |
| Crear movimiento | `['movements']`, `['accounts']`, `['dashboard-summary']` | La lista infinita se refetch; el nuevo movimiento aparece según el orden |
| Borrar movimiento | `['movements']`, `['accounts']`, `['dashboard-summary']` | La lista infinita se refetch; el total disminuye |
| Agregar tag | `['movements', 'list']` | La lista se refetch; el detalle se actualiza con `setQueryData` |
| Quitar tag | `['movements', 'list']` | La lista se refetch; el detalle se actualiza con `setQueryData` |

Notas:

1. No existe endpoint de edición de movimiento en el estado actual. Si se agrega en el futuro, debe invalidar `['movements']` igual que creación y borrado.
2. `invalidateQueries({ queryKey: ['movements'] })` alcanza tanto la lista como el detalle. Es el comportamiento actual y se conserva.
3. Al invalidar una query infinita activa, TanStack refetchea las páginas cargadas. Es aceptable para bloques de 20; si el usuario cargó muchas páginas, el costo aumenta. No se implementa cirugía manual de caché en esta fase.
4. No se debe cambiar la query key a `['movements', 'list', page]`: eso rompería la invalidación por prefijo y el modelo de `useInfiniteQuery`.
5. No se hace deduplicación manual de páginas. La invalidación después de mutaciones es la mitigación principal contra datos obsoletos.

#### Matriz E2E

| Caso | Preparación | Resultado esperado |
| --- | --- | --- |
| Carga inicial | 45 movimientos, abrir `/movements` | 20 ítems, "Mostrando 20 de 45", botón "Cargar más" |
| Segundo bloque | Clic en "Cargar más" | 40 ítems, "Mostrando 40 de 45", botón sigue visible |
| Último bloque | Clic en "Cargar más" | 45 ítems, mensaje "Has llegado al final del historial", botón oculto |
| Lista vacía | Base sin movimientos | Estado vacío, sin botón, sin conteo |
| Error inicial | Backend caído al entrar | Bloque de error, sin lista |
| Error de siguiente bloque | Backend caído después de cargar 20 | La lista de 20 permanece visible; botón "Reintentar"; al volver el backend, el reintento carga el siguiente bloque |
| Crear movimiento | Crear desde `/movements/create` | Navega a `/movements`; el total aumenta y el nuevo movimiento aparece en la posición correcta |
| Borrar movimiento | Abrir detalle y borrar | Navega a `/movements`; el total disminuye y la lista se refetch |
| Agregar tag | Agregar tag en el detalle | El detalle se actualiza; al volver a la lista, el tag aparece si corresponde |
| Quitar tag | Quitar tag en el detalle | El detalle se actualiza; la lista se refetch |
| Página fuera de rango | Modificar la request manual a `page=9999` | `data=[]`, `hasMore=false`, sin `404` |
| Query inválida | `limit=101` desde REST client | `400` con `errors[0].msg` |

#### Comandos de verificación

```bash
pnpm -C backend dev
pnpm -C frontend dev

pnpm -C backend exec tsc --noEmit
pnpm -C backend build

pnpm -C frontend lint
pnpm -C frontend exec tsc --noEmit -p tsconfig.app.json
pnpm -C frontend build
```

Nota: el repositorio tiene fallos preexistentes de lint/typecheck en el frontend documentados en `AGENTS.md`. La verificación debe comparar contra la línea base y confirmar que esta feature no agrega errores nuevos.

**Criterio de aceptación:** todos los casos E2E pasan y las mutaciones mantienen la lista consistente sin recargar la página.

### 6.6 Cierre de la Fase 2

- Revisar `git diff` contra la rama backend.
- Confirmar que solo se tocaron los archivos del frontend previstos.
- Crear la bitácora opcional `docs/developer-logs/28-movements-pagination-frontend.md`.
- Commit sugerido: `feat(movements): add incremental pagination UI`.
- Abrir PR con base en la rama backend.
- Tras el merge del backend, retargetear el PR del frontend a `main`.

**Rollback:** revertir la rama frontend. Si el backend ya está desplegado con el envelope, revertir ambos en la misma ventana. No hay migraciones ni cambios de datos.

---

## 7. Verificación automática

Ejecutar desde la raíz del repositorio:

```bash
# Backend
pnpm -C backend exec tsc --noEmit
pnpm -C backend build

# Frontend
pnpm -C frontend lint
pnpm -C frontend exec tsc --noEmit -p tsconfig.app.json
pnpm -C frontend build
```

Criterios:

- Backend typecheck y build pasan sin errores nuevos.
- Frontend lint y typecheck no agregan errores respecto a la línea base conocida.
- Frontend build pasa.
- No se modifica `schema.prisma`.
- No se agregan dependencias al frontend.
- `zod` es la única dependencia nueva del backend.

---

## 8. Criterios de aceptación globales

- [ ] `GET /api/movements` conserva ruta y método.
- [ ] Sin query params, responde `page=1`, `limit=20`.
- [ ] `page` y `limit` se validan en runtime con Zod.
- [ ] `limit` acepta `1..100` y rechaza valores fuera de rango con `400`.
- [ ] `page` rechaza `0`, negativos, decimales y no numéricos con `400`.
- [ ] `skip` y `take` se derivan correctamente de `page` y `limit`.
- [ ] El orden es `date desc`, `createdAt desc`.
- [ ] La respuesta es `{ data, meta }` con `total`, `page`, `limit`, `totalPages`, `hasMore`.
- [ ] Lista vacía: `total=0`, `totalPages=0`, `hasMore=false`.
- [ ] Última página: `hasMore=false`.
- [ ] Página posterior a la última: `200` con `data=[]`, sin `404`.
- [ ] El error `400` mantiene `errors[0].msg`.
- [ ] El error `500` mantiene `errors[0].msg`.
- [ ] `GET /api/movements/:id` no cambia.
- [ ] El frontend valida el envelope con Zod.
- [ ] La lista usa `useInfiniteQuery` con `initialPageParam=1`.
- [ ] `getNextPageParam` usa `meta.hasMore` y `meta.page + 1`.
- [ ] La vista aplana `data.pages` con `flatMap`.
- [ ] "Cargar más" solicita el siguiente bloque de 20.
- [ ] `isFetchingNextPage` deshabilita el botón y muestra "Cargando...".
- [ ] Al terminar el historial se oculta el botón y aparece el mensaje de fin.
- [ ] La lista existente permanece visible durante la carga del siguiente bloque.
- [ ] Un error de siguiente bloque no borra la lista cargada y permite reintentar.
- [ ] Crear, borrar y modificar tags invalidan correctamente la lista.
- [ ] No se modifica el esquema de Prisma.
- [ ] No se agregan endpoints nuevos.
- [ ] No se agregan dependencias al frontend.
- [ ] No se exponen secretos en logs ni respuestas.

---

## 9. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| Cambio de contrato de arreglo plano a envelope | El frontend antiguo falla si el backend se despliega solo | Ramas apiladas, PR coordinados y ventana de merge controlada |
| Offset pagination con inserciones/borrados concurrentes | Duplicados u omisiones entre páginas | Orden determinista, invalidación tras mutaciones y aceptación documentada de la limitación |
| Costo de `count()` en tablas grandes | Latencia por request | Aceptable en la fase actual; evaluar índice y caché de conteo en el futuro |
| `skip` alto en páginas lejanas | Consulta más lenta | `limit` máximo 100; el frontend se detiene en `hasMore`; evaluar cursor pagination a futuro |
| Falta de índice compuesto `(date, createdAt)` | Ordenamiento costoso con muchos registros | No se modifica el schema en esta fase; evaluar migración futura |
| `req.query` es getter en Express 5 | Mutarlo puede fallar | Guardar el resultado validado en `res.locals.validatedQuery` |
| Zod no está instalado en backend | Error de compilación | `pnpm -C backend add zod` y lockfile actualizado |
| Errores de validación no compatibles con el frontend | El mensaje se pierde | Mapear `issues` a `{ msg, path, location, type }` y preservar `errors[0].msg` |
| `amount` serializado como string | Errores de tipo en el cliente | `movementSchema` ya usa `z.coerce.number()`; no cambiarlo |
| Error al cargar el siguiente bloque borra la lista | Mala UX | Separar error inicial de `isFetchNextPageError`; conservar datos y permitir reintento |
| Invalidación de muchas páginas cargadas | Refetch costoso tras mutaciones | Aceptable para bloques de 20; evaluar `resetQueries` o actualizaciones optimistas si crece el uso |
| Query key con página incluida | Rompe invalidación y el modelo infinito | Mantener `['movements', 'list']` |
| No existe endpoint de edición | El caso "editar" no se puede probar | Documentar que editar hoy equivale a tags; si se agrega edición, invalidar `['movements']` |

---

## 10. Orden de aprobación y merge

1. Aprobar esta Master Spec (Fase 0).
2. Aprobar el contrato de API y los límites (`20` por bloque, máximo `100`).
3. Implementar y revisar la Fase 1 (backend).
4. Ejecutar la verificación manual HTTP de la Fase 1.
5. Implementar y revisar la Fase 2 (frontend).
6. Ejecutar la verificación E2E de la Fase 2.
7. Fusionar el PR del backend.
8. Retargetear y fusionar el PR del frontend.
9. Verificar el entorno desplegado después de ambos merges.
10. Crear las bitácoras de desarrollo si corresponden.

No fusionar ni desplegar el backend aislado en un entorno con frontend antiguo. No commitear directamente a `main`.

---

## 11. Anexo: requests para Kulala/REST client

```http
### MOVEMENTS - DEFAULT PAGE
GET http://localhost:3000/api/movements

### MOVEMENTS - PAGE 2
GET http://localhost:3000/api/movements?page=2&limit=20

### MOVEMENTS - MAX LIMIT
GET http://localhost:3000/api/movements?page=1&limit=100

### MOVEMENTS - BEYOND LAST PAGE
GET http://localhost:3000/api/movements?page=9999&limit=20

### MOVEMENTS - INVALID PAGE
GET http://localhost:3000/api/movements?page=0

### MOVEMENTS - INVALID LIMIT
GET http://localhost:3000/api/movements?limit=101

### MOVEMENTS - UNKNOWN PARAM
GET http://localhost:3000/api/movements?foo=bar&page=1
```

También funcionan a través de Vite en `http://localhost:5173/api/movements`, porque el proxy reenvía `/api` al backend.

---

## 12. Anexo: checklist de archivos

### Backend

- [ ] `backend/package.json` y `backend/pnpm-lock.yaml`: dependencia `zod`.
- [ ] `backend/src/schemas/movementSchemas.ts`: schema, constantes y tipos.
- [ ] `backend/src/middleware/validateMovementQuery.ts`: validación y mapeo de errores.
- [ ] `backend/src/controllers/MovementControllers.ts`: `getAllMovements` paginado.
- [ ] `backend/src/routes/movementRoutes.ts`: middleware en `GET /`.
- [ ] `backend/requests.http` (local): requests manuales.
- [ ] `docs/developer-logs/27-movements-pagination-backend.md` (opcional).

### Frontend

- [ ] `frontend/src/types/index.ts`: `paginationMetaSchema`, `movementPageSchema`, tipos.
- [ ] `frontend/src/constants/movementPagination.ts`: `MOVEMENTS_INITIAL_PAGE`, `MOVEMENTS_PAGE_SIZE`.
- [ ] `frontend/src/api/MovementAPI.ts`: `getMovements` con params y validación.
- [ ] `frontend/src/hooks/useMovements.ts`: `useInfiniteQuery`.
- [ ] `frontend/src/views/movements/MovementView.tsx`: aplanado y estados.
- [ ] `frontend/src/components/movements/MovementsList.tsx`: footer "Cargar más".
- [ ] `docs/developer-logs/28-movements-pagination-frontend.md` (opcional).

### Fuera de alcance

- [ ] `backend/prisma/schema.prisma` sin cambios.
- [ ] Sin migraciones.
- [ ] Sin cambios en `accounts`, `tags`, `dashboard` o `dev`.
- [ ] Sin dependencias nuevas en frontend.
- [ ] Sin cambios en `GET /api/movements/:id`.
