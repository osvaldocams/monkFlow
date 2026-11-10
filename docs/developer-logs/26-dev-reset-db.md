# 📓 Phase 26: Dev database reset

Este archivo registra la implementación de `POST /api/dev/reset`, una herramienta exclusiva de desarrollo para vaciar los datos de prueba de MonkFlow sin ejecutar comandos de Prisma. La feature se documentó primero en `specs/reset-db.md` y se implementó por fases, con dos capas de seguridad: entorno y confirmación explícita.

---

## 📦 Backend: reset de base de datos solo en desarrollo

### 🎯 Objective

Habilitar un reset rápido de `movements`, `accounts` y `tags` desde Kulala/Postman, respetando las llaves foráneas y bloqueando la ejecución fuera de `NODE_ENV=development`.

---

### 🛠️ Sub-parte 1: SDD y contrato HTTP

<details>

* **Status:** ✅ Completed
* **Timestamp:** 2026-11-08 — Diseño previo a la implementación.

#### 📝 Crónica
Se escribió `specs/reset-db.md` con el contrato, las decisiones de diseño, el orden de borrado, los riesgos y el plan por fases. El endpoint quedó definido como `POST /api/dev/reset`, sin body ni autenticación, con respuesta `200` y conteos de registros eliminados.

**Contrato principal:**

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

</details>

---

### 🛠️ Sub-parte 2: Guard de entorno

<details>

* **Status:** ✅ Completed
* **Timestamp:** 2026-11-08

#### 📝 Crónica
Se agregó `requireDevelopment` en `backend/src/middleware/index.ts`. El middleware responde `403` si `NODE_ENV` no es `development` y se ejecuta antes del controlador, por lo que el bloqueo ocurre sin consultar Prisma.

```ts
export const requireDevelopment = (req, res, next) => {
    if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({
            error: 'Reset endpoint is only available in development environment'
        })
    }
    next()
}
```

También se agregó `NODE_ENV=development` a `backend/.env`, archivo local ignorado por git. En producción la variable debe venir del entorno de despliegue, porque `pnpm -C backend start` no carga `.env`.

</details>

---

### 🛠️ Sub-parte 3: Controlador transaccional

<details>

* **Status:** ✅ Completed
* **Timestamp:** 2026-11-08

#### 📝 Crónica
Se creó `backend/src/controllers/DevControllers.ts` con el handler estático `resetDatabase`. La limpieza usa una transacción interactiva de Prisma y borra en orden `movements -> accounts -> tags` para respetar las llaves foráneas de `Movement` hacia `Account`.

```ts
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

En caso de error se registra el detalle en consola y se responde `500` con `{ error: 'Error resetting database' }`, siguiendo el contrato existente del backend.

</details>

---

### 🛠️ Sub-parte 4: Router y montaje

<details>

* **Status:** ✅ Completed
* **Timestamp:** 2026-11-08

#### 📝 Crónica
Se creó `backend/src/routes/devRoutes.ts` con la ruta `POST /reset` y se montó en `backend/src/server.ts` bajo el prefijo `/api/dev`.

```ts
router.post('/reset', requireDevelopment, DevControllers.resetDatabase)
```

```ts
server.use('/api/dev', devRouter)
```

En la Fase 6.1 se insertó `requireResetConfirmation` entre ambos (ver Sub-parte 5). El endpoint final queda en `POST /api/dev/reset`. No se tocó el frontend, el esquema de Prisma ni las migraciones.

</details>

---

### 🛠️ Sub-parte 5: Header de confirmación (Fase 6.1)

<details>

* **Status:** ✅ Completed
* **Timestamp:** 2026-11-10

#### 📝 Crónica
Después de revisar la superficie de ataque se agregó una segunda capa independiente: el header `x-confirm-reset: true`. El objetivo no es autenticar, sino obligar a que el reset sea una acción deliberada y evitar peticiones simples accidentales.

Se agregó `requireResetConfirmation` en `backend/src/middleware/index.ts` y se encadenó después de `requireDevelopment`:

```ts
export const requireResetConfirmation = (req, res, next) => {
    if (req.header('x-confirm-reset') !== 'true') {
        return res.status(400).json({
            error: 'Missing or invalid confirmation header: x-confirm-reset'
        })
    }
    next()
}
```

La cadena final de la ruta es:

```ts
router.post('/reset', requireDevelopment, requireResetConfirmation, DevControllers.resetDatabase)
```

Si el entorno no es `development`, prevalece el `403`; si el entorno es correcto pero falta el header o su valor es distinto de `true`, responde `400` sin ejecutar el controlador.

El request local `backend/requests.http` quedó actualizado con el header. Ese archivo está ignorado por git.

</details>

---

### 🧪 Verificación

<details>

* **Status:** ✅ Completed (rutas negativas) / ⏳ positivo pendiente
* **Timestamp:** 2026-11-10

#### Comandos

```bash
pnpm -C backend exec tsc --noEmit
pnpm -C backend build
```

Ambos terminaron sin errores.

#### Pruebas manuales

| Caso | Resultado |
| --- | --- |
| Reset sin header | `400` y base intacta |
| Reset con `x-confirm-reset: false` | `400` y base intacta |
| Reset sin header vía Vite (`:5173`) | `400` y base intacta |
| Reset con header correcto | `200` y conteos (validado en la Fase 6, antes de 6.1) |

No se repitió el reset positivo después de la Fase 6.1 para no borrar datos de trabajo. El camino positivo no cambió: solo atraviesa el nuevo guard.

También se verificó el comportamiento de CORS antes de agregar el header:

| Origen | Resultado |
| --- | --- |
| Sin `Origin` | `200` |
| `Origin: http://evil.com` | `500` (rechazado por CORS, sin handler específico) |
| `Origin: http://localhost:5173` | `200` |

Conclusión: CORS no es autorización. Kulala/Postman no envían `Origin` y el backend permite `!origin`, por eso el header de confirmación aporta una capa útil.

</details>

---

### 🔐 Decisiones de seguridad

<details>

* **Status:** ✅ Documented

1. **Doble guard:** `NODE_ENV=development` más `x-confirm-reset: true`.
2. **Prioridad del entorno:** el `403` por entorno se evalúa antes que la confirmación; fuera de desarrollo no se revela ni se procesa el header.
3. **Confirmación, no secreto:** el header evita ejecuciones accidentales y obliga a preflight en navegadores, pero cualquiera que conozca el valor puede enviarlo.
4. **Sin autenticación:** el endpoint sigue siendo una herramienta local de desarrollo, no una API administrativa.
5. **Endurecimiento futuro:** token secreto en variable de entorno, `ALLOW_DB_RESET=true`, montaje condicional del router y handler de errores CORS con `403`.

</details>

---

### 📌 Archivos tocados

| Archivo | Cambio |
| --- | --- |
| `specs/reset-db.md` | SDD completo con fases, contrato y Fase 6.1 |
| `backend/src/middleware/index.ts` | `requireDevelopment` y `requireResetConfirmation` |
| `backend/src/controllers/DevControllers.ts` | Controlador transaccional de reset |
| `backend/src/routes/devRoutes.ts` | Ruta `POST /reset` con ambos guards |
| `backend/src/server.ts` | Montaje de `/api/dev` |
| `backend/.env` | `NODE_ENV=development` (local, ignorado) |
| `backend/requests.http` | Request con `x-confirm-reset: true` (local, ignorado) |

### 📌 Pendientes

- Ejecutar el reset positivo con `x-confirm-reset: true` cuando sea seguro borrar los datos locales.
- Evaluar un token secreto si el endpoint deja de ser estrictamente local.
- Cerrar la rama con el PR; el merge lo realiza el responsable del repositorio.
