# SDD: Reset Database (development only)

- **Estado:** Fases 0-5 y 6.1 implementadas; Fase 7 documentada; pendiente prueba positiva manual
- **Fecha:** 2026-11-08
- **Rama sugerida:** `feature/reset-db`
- **Alcance:** backend únicamente
- **Documento:** `specs/reset-db.md`

---

## 1. Resumen ejecutivo

Se propone un endpoint exclusivo de desarrollo que vacía las tablas `movements`, `accounts` y `tags` en el orden correcto para respetar las llaves foráneas. El endpoint se bloquea con un middleware que exige estrictamente `NODE_ENV=development`; en cualquier otro entorno responde `403` antes de tocar la base de datos.

La implementación no modifica el esquema de Prisma ni requiere migraciones. La limpieza se hace con `deleteMany` dentro de una transacción interactiva de Prisma.

---

## 2. Contexto verificado

- El backend arranca desde `backend/src/index.ts`, que conecta Prisma y monta la app de `backend/src/server.ts`.
- Los routers se registran en `server.ts` con el prefijo `/api/...` y usan imports ESM con extensión `.js`.
- Los controladores son clases con handlers estáticos (`AccountControllers`, `MovementControllers`, `TagControllers`, `DashboardControllers`).
- El proyecto ya tiene un archivo central de middlewares: `backend/src/middleware/index.ts`.
- `backend/.env` contiene hoy únicamente `DATABASE_URL`; **`NODE_ENV` no está definido**. Sin agregarlo, un guard estricto bloquearía también el entorno local.
- El script `pnpm -C backend dev` ejecuta `tsx --watch --env-file=.env`, por lo que las variables de `backend/.env` sí se cargan en desarrollo.
- `pnpm -C backend start` ejecuta `node dist/index.js` y **no** carga `.env`; en producción `NODE_ENV` debe venir del entorno de despliegue.
- `backend/requests.http` existe localmente pero está ignorado por git (`*.http` y `backend/*.http`).
- `Movement` tiene dos FKs hacia `Account` con `onDelete: Restrict`, y una relación implícita muchos-a-muchos con `Tag`. Por eso el orden de borrado importa.

---

## 3. Objetivo

Permitir que un desarrollador vacíe los datos de prueba desde Kulala, Postman o cualquier cliente HTTP, sin ejecutar comandos de Prisma ni tocar la terminal, con bloqueo total fuera de `development`.

---

## 4. No objetivos

- No crear interfaz en el frontend.
- No modificar `schema.prisma` ni ejecutar migraciones.
- No implementar autenticación ni autorización de usuarios.
- No resetear secuencias ni recrear datos semilla.
- No permitir el endpoint en staging, producción o cualquier entorno distinto de `development`.
- No agregar dependencias nuevas.

---

## 5. Decisiones de diseño

### 5.1 Método y ruta

| Decisión | Valor |
| --- | --- |
| Método | `POST` |
| Ruta | `/api/dev/reset` |
| Router | `backend/src/routes/devRoutes.ts` |
| Prefijo en `server.ts` | `/api/dev` |

**Justificación:** `POST` representa una acción con efectos secundarios y evita ambigüedad sobre qué recurso se elimina. La ruta `/api/dev/*` agrupa funcionalidades exclusivas de desarrollo y deja espacio para futuros endpoints de apoyo sin mezclarlos con los recursos de negocio.

### 5.2 Capa de seguridad

Se implementa un middleware dedicado, `requireDevelopment`, aplicado antes del controlador:

```ts
// Referencia de diseño, no implementar todavía
if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({
        error: 'Reset endpoint is only available in development environment'
    })
}
```

Reglas:

- Comparación estricta contra `'development'`.
- Si `NODE_ENV` está ausente, vacío o es distinto, se bloquea. El fallo es seguro por defecto.
- **No usar `server.get('env')`**: Express devuelve `'development'` por defecto cuando `NODE_ENV` no está definido, lo que abriría el endpoint accidentalmente.
- El middleware responde `403` y no ejecuta ninguna consulta a Prisma.
- El controlador no repite la validación; la responsabilidad vive en un único punto.

La Fase 6.1 agrega una segunda capa independiente, `requireResetConfirmation`, que exige el header `x-confirm-reset: true` (ver 5.7).

### 5.3 Orden de borrado

Orden obligatorio dentro de la transacción:

1. `movement.deleteMany()`
2. `account.deleteMany()`
3. `tag.deleteMany()`

**Justificación:**

- `Movement` referencia a `Account` con `onDelete: Restrict`; si se intentara borrar cuentas primero, PostgreSQL rechazaría la operación.
- La relación implícita `Movement` ↔ `Tag` se materializa en una tabla intermedia. Al borrar los movimientos, Prisma/PostgreSQL eliminan también esas filas de unión, por lo que después se pueden borrar los tags sin conflicto.
- Borrar tags antes que movimientos también podría funcionar por el `ON DELETE CASCADE` de la tabla intermedia, pero se respeta el orden solicitado y el más conservador.

### 5.4 Transacción

Se usa `prisma.$transaction(async (tx) => { ... })`:

- Garantiza atomicidad: si falla un borrado, se revierte todo.
- Permite capturar los conteos de cada `deleteMany` (`{ count }`).
- Evita dejar la base en un estado intermedio.

### 5.5 Sin `TRUNCATE`

Se descarta `TRUNCATE ... CASCADE` con SQL crudo porque:

- Salta la capa de Prisma y requiere `$executeRawUnsafe`.
- Dificulta el tipado y el manejo de errores.
- La transacción con `deleteMany` ya resuelve el caso y devuelve conteos útiles.

### 5.6 Respuesta

Se devuelve `200` con los conteos eliminados. No se devuelve `204` porque los conteos ayudan a verificar el reset desde el cliente HTTP.

### 5.7 Header de confirmación

Además del guard de entorno, el endpoint exige el header `x-confirm-reset: true`.

- Es una confirmación deliberada, no un secreto.
- En navegadores, un header personalizado obliga a un preflight CORS, lo que reduce el riesgo de peticiones simples accidentales o CSRF.
- No sustituye al guard de entorno: primero se valida `NODE_ENV` y luego la confirmación.
- Valor exacto: `true`. Cualquier otro valor o la ausencia del header responde `400`.
- Un cliente que conozca el header puede enviarlo; la protección real contra ejecución accidental es que la acción debe declararse explícitamente.

---

## 6. Contrato HTTP

### 6.1 Request

```http
POST /api/dev/reset
Content-Type: application/json
x-confirm-reset: true
```

Sin body ni parámetros. Requiere el header de confirmación; no es autenticación.

### 6.2 Respuesta exitosa

**Status:** `200 OK`

```json
{
  "message": "Database reset successfully",
  "deleted": {
    "movements": 12,
    "accounts": 3,
    "tags": 5
  }
}
```

### 6.3 Entorno no permitido

**Status:** `403 Forbidden`

```json
{
  "error": "Reset endpoint is only available in development environment"
}
```

### 6.4 Error interno

**Status:** `500 Internal Server Error`

```json
{
  "error": "Error resetting database"
}
```

El detalle real del error se registra solo en consola con `console.error`, siguiendo el patrón existente de los controladores.

### 6.5 Confirmación faltante o inválida

**Status:** `400 Bad Request`

```json
{
  "error": "Missing or invalid confirmation header: x-confirm-reset"
}
```

Se usa `400` porque la petición está mal formada. El `403` queda reservado para el bloqueo por entorno. El controlador no se ejecuta.

---

## 7. Diseño de componentes

### 7.1 Middleware `requireDevelopment`

- **Archivo:** `backend/src/middleware/index.ts` (agregar exportación).
- **Firma:** `(req: Request, res: Response, next: NextFunction) => void`.
- **Responsabilidad:** bloquear la petición si `process.env.NODE_ENV !== 'development'`.
- **Ubicación en la cadena:** antes del controlador, en la definición de la ruta.

### 7.1.1 Middleware `requireResetConfirmation`

- **Archivo:** `backend/src/middleware/index.ts` (agregar exportación).
- **Firma:** `(req: Request, res: Response, next: NextFunction) => void`.
- **Responsabilidad:** exigir `req.header('x-confirm-reset') === 'true'`; si falta o es distinto, responder `400`.
- **Ubicación en la cadena:** después de `requireDevelopment` y antes del controlador.

```ts
// Implementado en backend/src/middleware/index.ts
if (req.header('x-confirm-reset') !== 'true') {
    return res.status(400).json({
        error: 'Missing or invalid confirmation header: x-confirm-reset'
    })
}
```

### 7.2 Controlador `DevControllers.resetDatabase`

- **Archivo nuevo:** `backend/src/controllers/DevControllers.ts`.
- **Clase:** `DevControllers` con handler estático `resetDatabase`.
- **Dependencias:** singleton `prisma` desde `../config/db.js`.
- **Lógica:**
  1. Ejecutar transacción interactiva.
  2. `tx.movement.deleteMany()`.
  3. `tx.account.deleteMany()`.
  4. `tx.tag.deleteMany()`.
  5. Retornar conteos.
  6. Responder `200` con `{ message, deleted }`.
  7. En `catch`, `console.error` y responder `500` con `{ error }`.

Borrador de referencia:

```ts
// Referencia de diseño, no implementar todavía
const deleted = await prisma.$transaction(async (tx) => {
    const movements = await tx.movement.deleteMany()
    const accounts = await tx.account.deleteMany()
    const tags = await tx.tag.deleteMany()
    return {
        movements: movements.count,
        accounts: accounts.count,
        tags: tags.count,
    }
})
```

### 7.3 Router `devRoutes.ts`

- **Archivo nuevo:** `backend/src/routes/devRoutes.ts`.
- **Contenido:** un único `router.post('/reset', requireDevelopment, requireResetConfirmation, DevControllers.resetDatabase)`.
- **Imports:** `express`, `requireDevelopment` y `requireResetConfirmation` desde `../middleware/index.js`, `DevControllers` desde `../controllers/DevControllers.js`.

### 7.4 Montaje en `server.ts`

- **Archivo:** `backend/src/server.ts`.
- **Cambio:** importar `devRouter` y montarlo con `server.use('/api/dev', devRouter)`.
- **Import con extensión:** `import devRouter from "./routes/devRoutes.js"` (obligatorio por NodeNext).

### 7.5 Resumen de archivos

| Archivo | Tipo | Cambio |
| --- | --- | --- |
| `backend/src/middleware/index.ts` | Modificar | Exportar `requireDevelopment` y `requireResetConfirmation` |
| `backend/src/controllers/DevControllers.ts` | Nuevo | Controlador de reset |
| `backend/src/routes/devRoutes.ts` | Nuevo | Router `/reset` con ambos guards |
| `backend/src/server.ts` | Modificar | Montar `/api/dev` |
| `backend/.env` | Local, ignorado | Agregar `NODE_ENV=development` |
| `backend/requests.http` | Local, ignorado | Agregar request de reset con `x-confirm-reset: true` |
| `docs/developer-logs/26-reset-db.md` | Opcional | Bitácora de la fase |

---

## 8. Lógica de limpieza y llaves foráneas

```text
┌─────────────────────┐
│ movement.deleteMany │  Elimina movimientos y filas de unión con tags
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ account.deleteMany  │  Ya no hay movimientos que las referencien
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ tag.deleteMany      │  Ya no hay filas de unión que las referencien
└─────────────────────┘
```

Puntos críticos:

- No invertir el orden de `movements` y `accounts`.
- No borrar `tags` antes de `movements` salvo que se verifique explícitamente el comportamiento de la tabla intermedia.
- La operación es idempotente: si las tablas están vacías, `deleteMany` devuelve `0` y responde `200`.
- No se tocan `_prisma_migrations` ni metadatos de Prisma.

---

## 9. Configuración de entorno

### 9.1 Desarrollo local

Agregar a `backend/.env` (archivo ignorado por git):

```env
NODE_ENV=development
```

Sin esta línea el middleware bloqueará el endpoint, porque `NODE_ENV` hoy no está definido en el proyecto.

### 9.2 Producción y otros entornos

- `pnpm -C backend start` no carga `.env`; `NODE_ENV` debe venir del entorno de despliegue.
- Si `NODE_ENV` no está definido, el endpoint responde `403`. Esto es intencional.
- No agregar `NODE_ENV=development` a archivos versionados ni al script de producción.

### 9.3 Advertencia sobre la base de datos

`DATABASE_URL` apunta a una instancia de PostgreSQL/Neon. El endpoint borra **la base configurada en esa variable**, no una base local implícita. Antes de usarlo:

- Confirmar que `DATABASE_URL` corresponde a una base desechable de desarrollo.
- No ejecutar el endpoint contra una base compartida con datos que se quieran conservar.

---

## 10. Plan de implementación por fases

Cada fase es independiente y debe aprobarse antes de continuar.

### Fase 0: Revisión y aprobación del SDD

- **Archivos:** ninguno.
- **Pasos:**
  1. Revisar este documento.
  2. Confirmar método/ruta (`POST /api/dev/reset`).
  3. Confirmar que `DATABASE_URL` apunta a una base de desarrollo desechable.
- **Criterio de aceptación:** SDD aprobado por el responsable del proyecto.

### Fase 1: Configurar `NODE_ENV` local

- **Archivos:** `backend/.env` (local, ignorado).
- **Pasos:**
  1. Agregar `NODE_ENV=development` a `backend/.env`.
  2. Verificar que `pnpm -C backend dev` sigue levantando sin errores.
- **Criterio de aceptación:** el backend arranca y `process.env.NODE_ENV` vale `'development'` en desarrollo.
- **Rollback:** quitar la línea de `.env`.

### Fase 2: Middleware `requireDevelopment`

- **Archivos:** `backend/src/middleware/index.ts`.
- **Pasos:**
  1. Agregar la función `requireDevelopment` con la comparación estricta.
  2. Exportarla.
  3. No modificar los middlewares existentes.
- **Criterio de aceptación:** `pnpm -C backend exec tsc --noEmit` pasa sin errores nuevos.

### Fase 3: Controlador `DevControllers`

- **Archivos:** `backend/src/controllers/DevControllers.ts` (nuevo).
- **Pasos:**
  1. Crear la clase `DevControllers`.
  2. Implementar `resetDatabase` con la transacción y el orden definido.
  3. Usar el singleton `prisma` con import `../config/db.js`.
  4. Manejar `catch` con `console.error` y respuesta `500`.
- **Criterio de aceptación:** el archivo compila y no instancia `new PrismaClient()`.

### Fase 4: Router `devRoutes`

- **Archivos:** `backend/src/routes/devRoutes.ts` (nuevo).
- **Pasos:**
  1. Crear el router.
  2. Registrar `POST /reset` con `requireDevelopment` antes del controlador.
  3. Exportar el router por defecto.
- **Criterio de aceptación:** compila y la cadena de middlewares es correcta.

### Fase 5: Montaje en `server.ts`

- **Archivos:** `backend/src/server.ts`.
- **Pasos:**
  1. Importar `devRouter` con extensión `.js`.
  2. Montar `server.use('/api/dev', devRouter)`.
  3. Mantener el orden actual de los demás routers.
- **Criterio de aceptación:** la app arranca y la ruta queda registrada.

### Fase 6: Prueba manual con Kulala/Postman

- **Archivos:** `backend/requests.http` (local, ignorado).
- **Pasos:**
  1. Agregar el request de reset.
  2. Crear datos de prueba (cuentas, movimientos y tags).
  3. Ejecutar el reset y verificar conteos.
  4. Consultar los endpoints de lectura y confirmar arreglos vacíos.
  5. Probar el bloqueo con `NODE_ENV` distinto de `development`.
- **Criterio de aceptación:** ver sección 11.

### Fase 6.1: Header de confirmación `x-confirm-reset`

- **Archivos:** `backend/src/middleware/index.ts`, `backend/src/routes/devRoutes.ts`, `backend/requests.http` (local, ignorado).
- **Pasos:**
  1. Agregar `requireResetConfirmation` en `middleware/index.ts`.
  2. Encadenarlo después de `requireDevelopment` en `POST /reset`.
  3. Agregar `x-confirm-reset: true` al request local.
  4. Reejecutar las pruebas manuales de la Fase 6.
- **Criterio de aceptación:**
  - Sin header o con valor distinto: `400` y base intacta.
  - Con header correcto y `NODE_ENV=development`: `200`.
  - Con header correcto pero `NODE_ENV` distinto de `development`: `403`.
- **Rollback:** quitar el middleware de la cadena y el header del request.

### Fase 7: Verificación final y cierre

- **Archivos:** `docs/developer-logs/26-reset-db.md` (opcional).
- **Pasos:**
  1. Ejecutar typecheck y build del backend.
  2. Revisar `git diff` para confirmar que no se tocó el frontend ni el schema.
  3. Crear la bitácora de la fase si se sigue la convención del proyecto.
  4. Commit y PR cuando el responsable lo indique.
- **Criterio de aceptación:** checks en verde y alcance respetado.

---

## 11. Pruebas y verificación

### 11.1 Verificación automática

```bash
pnpm -C backend exec tsc --noEmit
pnpm -C backend build
```

No hay suite de tests en el proyecto; la verificación es manual + compilación.

### 11.2 Casos manuales

| Caso | Preparación | Resultado esperado |
| --- | --- | --- |
| Reset con datos | `NODE_ENV=development`, datos creados, header `x-confirm-reset: true` | `200` y conteos mayores que cero |
| Tablas ya vacías | Segundo reset consecutivo con header válido | `200` y conteos en cero |
| Movimiento con tags | Crear movimiento con `tagIds`, header válido | Reset sin error de FK |
| Confirmación faltante | Sin header `x-confirm-reset` | `400`, base intacta |
| Confirmación inválida | `x-confirm-reset: false` u otro valor | `400`, base intacta |
| Bloqueo en producción | `NODE_ENV=production`, header válido | `403`, base intacta |
| `NODE_ENV` ausente | Sin definir la variable, header válido | `403`, base intacta |
| Verificación posterior | `GET /api/accounts`, `/api/movements`, `/api/tags` | Arreglos vacíos |

### 11.3 Comandos de referencia

```bash
# Desarrollo normal
pnpm -C backend dev

# Simular producción para probar el bloqueo
NODE_ENV=production pnpm -C backend dev

# Reset con confirmación (destructivo)
curl -X POST -H 'x-confirm-reset: true' http://localhost:3000/api/dev/reset

# Verificar tablas vacías
curl http://localhost:3000/api/accounts
curl http://localhost:3000/api/movements
curl http://localhost:3000/api/tags
```

---

## 12. Criterios de aceptación

- [ ] `POST /api/dev/reset` responde `200` solo con `NODE_ENV=development`.
- [ ] Responde `403` si `NODE_ENV` es distinto de `development` o no está definido.
- [ ] Sin `x-confirm-reset: true` responde `400` y no ejecuta el reset.
- [ ] Con `x-confirm-reset: true` y `NODE_ENV=development` responde `200`.
- [ ] El header no sustituye al guard de entorno: el `403` por entorno tiene prioridad.
- [ ] El bloqueo ocurre antes de cualquier consulta a Prisma.
- [ ] El borrado respeta el orden `movements -> accounts -> tags`.
- [ ] La operación es atómica mediante transacción.
- [ ] Funciona con movimientos que tienen tags asociados.
- [ ] Es idempotente.
- [ ] No se modifica el esquema de Prisma.
- [ ] No se agregan dependencias.
- [ ] No se toca el frontend.
- [ ] `pnpm -C backend exec tsc --noEmit` y `pnpm -C backend build` pasan.
- [ ] No se exponen secretos en logs ni en la respuesta.

---

## 13. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| `NODE_ENV` mal configurado en staging | Reset accidental fuera de local | Comparación estricta y revisión del entorno de despliegue |
| `DATABASE_URL` apunta a una base compartida | Pérdida de datos de otros | Confirmar la base antes de usar el endpoint |
| Uso de `server.get('env')` | Express asume `development` si falta la variable | Usar `process.env.NODE_ENV` directamente |
| Orden de borrado incorrecto | Error de FK `Restrict` | Respetar `movements -> accounts -> tags` |
| Falla a mitad del proceso | Estado parcial | Transacción interactiva |
| Endpoint visible en producción | Superficie de ataque | Respuesta `403` sin ejecutar lógica; opcionalmente se puede montar el router solo en desarrollo |
| Header de confirmación conocido | No protege contra un cliente local deliberado | Es una confirmación, no un secreto; para protección real usar token en variable de entorno |

### Endurecimiento futuro opcional

No forma parte de esta fase, pero puede evaluarse después:

- Exigir un token secreto en el header, leído de una variable de entorno.
- Exigir una variable adicional (`ALLOW_DB_RESET=true`).
- Montar el router condicionalmente solo cuando `NODE_ENV === 'development'`.
- Agregar un error handler que devuelva `403` para orígenes CORS rechazados.

---

## 14. Anexo: request para Kulala/Postman

```http
### RESET DATABASE (DEV ONLY)
POST http://localhost:3000/api/dev/reset
Content-Type: application/json
x-confirm-reset: true
```

También funciona vía `http://localhost:5173/api/dev/reset` cuando Vite está corriendo, porque proxya `/api` hacia el backend. En Postman: método `POST`, URL `http://localhost:3000/api/dev/reset`, header `x-confirm-reset: true`, sin body y sin autenticación.

---

## 15. Orden de aprobación sugerido

1. Aprobar este SDD (Fase 0).
2. Aprobar y ejecutar Fase 1 (entorno).
3. Aprobar y ejecutar Fases 2 a 5 (código backend).
4. Ejecutar Fase 6 (pruebas manuales).
5. Aprobar y ejecutar Fase 6.1 (header de confirmación).
6. Ejecutar Fase 7 (verificación y cierre).
