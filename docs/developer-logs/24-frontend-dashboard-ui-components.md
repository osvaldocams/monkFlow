# 📓 Phase 24: Dashboard ui components

---
**[2026-11-03] - Fase 1 backend: serie temporal y exclusión de traspasos en `getDashboardSummary`**

<details>

1. **Normalización del intervalo (`dashboardControllers.ts`)**
   - Reemplazamos `const { interval = 'month' } = req.query` por una unión literal:
     ```ts
     const interval: 'week' | 'month' = req.query.interval === 'week' ? 'week' : 'month'
     ```
   - Cualquier valor distinto de `week` cae en `month`, así que `?interval=basura` no rompe nada.
   - La anotación literal mantiene el contrato con el frontend: `dashboardIntervalSchema` es un `z.enum(['week','month'])` y nunca debería recibir otro valor.

2. **Rango de fechas alineado a medianoche**
   - Añadimos un helper puro `startOfDay` para evitar que la hora actual contamine las comparaciones:
     ```ts
     const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
     ```
   - **Semana:** 7 días incluyendo hoy (`today - 6`), para que el gráfico tenga exactamente 7 barras.
   - **Mes:** desde el primer día del mes actual hasta `now`.

3. **Consulta a Prisma más angosta**
   - Cambiamos `include: { tags: true }` por `select`, porque los tags no se usaban y el `include` traía todos los campos escalares del movimiento:
     ```ts
     select: { type: true, amount: true, date: true }
     ```

4. **Buckets zero-filled**
   - Declaramos `type Bucket = { label, income, expense, net }` y generamos **todos** los puntos por adelantado, aunque estén en cero.
   - Semana: 7 buckets diarios con `toLocaleDateString('es', { weekday: 'short' })`.
   - Mes: `Math.ceil(daysInMonth / 7)` buckets semanales (`Sem 1`…`Sem 5`). El último puede ser parcial.
   - Zero-filled evita que el gráfico se salte días sin movimientos y desalinee las barras con el eje.

5. **Índice del bucket DST-safe**
   - Para la semana usamos distancia en días calculada con `Date.UTC`, no con timestamps locales:
     ```ts
     const a = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
     const b = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
     return Math.round((a - b) / 86_400_000)
     ```
   - El día que cambia el horario de verano dura 23 o 25 horas; dividir timestamps locales entre 86 400 000 y usar `Math.floor` mandaría movimientos al bucket anterior.
   - Para el mes: `Math.floor((m.date.getDate() - 1) / 7)`.
   - Añadimos el guard `if (index < 0 || index >= buckets.length) continue` para descartar cualquier movimiento fuera de rango en vez de tocar un índice inexistente.

6. **Reparto de movimientos y exclusión de traspasos**
   - Antes, todo lo que no era `INCOME` se sumaba a `expense`, incluyendo `TRANSFER`, `DEPOSIT` y `WITHDRAWAL`. Eso inflaba los egresos cada vez que se movía plata entre cuentas propias.
   - Ahora solo participan ingresos y gastos reales:
     ```ts
     if (m.type === 'INCOME') buckets[index].income += amount
     else if (m.type === 'EXPENSE') buckets[index].expense += amount
     // TRANSFER / DEPOSIT / WITHDRAWAL: no tocan income ni expense
     ```
   - `movementsCount` sigue contando todos los movimientos del rango, incluidos los traspasos.

7. **Summary derivado del trend (una sola fuente de verdad)**
   - `income` y `expense` ya no se acumulan en un segundo recorrido sobre `movements`; se derivan sumando los buckets con `reduce`, y `balance` sale de ellos.
   - Así es imposible que la tarjeta y el gráfico muestren totales distintos.
   - Añadimos `round2` al final del cálculo (no dentro del loop) para evitar acumulación de error de punto flotante.

8. **Respuesta extendida**
   - El contrato crece con la cuarta clave `trend`, sin tocar `interval`, `summary` ni `movementsCount`.
   - El frontend actual sigue funcionando: Zod descarta las claves desconocidas hasta que la fase 2 actualice el schema.

</details>

---

**[2026-11-03] - Depuración de tipos: `let startDate = Date`**

<details>

1. **Síntoma**
   - `tsc --noEmit` reportó 9 errores repartidos en las líneas 18, 19, 22, 28, 49, 50 y 71, pero todos con la misma raíz.

2. **Causa raíz**
   - La declaración era `let startDate = Date`.
   - `Date` **sin `new`** es la función constructora (`DateConstructor`), no una instancia de fecha. TypeScript infiere ese tipo y luego rechaza cada asignación de un `Date` real y cada llamada a métodos de instancia (`setDate`, `getDate`, `getFullYear`, `getMonth`).

3. **Corrección**
   ```diff
   -let startDate = Date
   +let startDate: Date
   ```
   - `:` declara el **tipo** de la variable; `=` asigna un **valor**.
   - Al asignarse en ambas ramas del `if/else`, TypeScript sabe que está inicializada antes de usarse y no marca "used before assigned".

4. **Verificación**
   - `./node_modules/.bin/tsc --noEmit` sin salida: los 9 errores desaparecen con una sola corrección.

</details>

---

**[2026-11-03] - Código final del controlador**

<details>
<summary>`backend/src/controllers/dashboardControllers.ts`</summary>

```ts
import { Request, Response } from 'express'
import prisma from '../config/db.js'


export class DashboardControllers {
    static getDashboardSummary = async (req: Request, res: Response) => {
        try {
            const interval: 'week' | 'month' = req.query.interval === 'week' ? 'week' : 'month'

            //1. calcular rango de fechas segun intervalo
            const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

            const now = new Date()
            const today = startOfDay(now)

            let startDate: Date
            if (interval === 'week') {
                startDate = new Date(today)
                startDate.setDate(today.getDate() - 6)
            } else {
                //por default month primer dia del mes actual
                startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            }
            //2 consultar movimientos dentro del rango usando prisma
            const movements = await prisma.movement.findMany({
                where: {
                    date: {
                        gte: startDate,
                        lte: now,
                    },
                },
                select: {
                    type: true,
                    amount: true,
                    date: true,
                }
            })

            //Buckets
            type Bucket = {
                label: string
                income: number
                expense: number
                net: number
            }
            let buckets: Bucket[]
            if (interval === 'week') {
                buckets = Array.from({ length: 7 }, (_, i) => {
                    const d = new Date(startDate)
                    d.setDate(startDate.getDate() + i)
                    return {
                        label: d.toLocaleDateString('es', { weekday: 'short' }),
                        income: 0,
                        expense: 0,
                        net: 0,
                    }
                })
            } else {
                const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
                const weeks = Math.ceil(daysInMonth / 7)
                buckets = Array.from({ length: weeks }, (_, i) => ({
                    label: `Sem ${i + 1}`,
                    income: 0,
                    expense: 0,
                    net: 0,
                }))
            }
            //bucket index
            const dayIndex = (d: Date) => {
                const a = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
                const b = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
                return Math.round((a - b) / 86_400_000)
            }
            //repartir movimientos
            for (const m of movements) {
                const index = interval === 'week'
                    ? dayIndex(m.date)
                    : Math.floor((m.date.getDate() - 1) / 7)

                if (index < 0 || index >= buckets.length) continue

                const amount = Number(m.amount)

                if (m.type === 'INCOME') buckets[index].income += amount
                else if (m.type === 'EXPENSE') buckets[index].expense += amount
                // TRANSFER / DEPOSIT / WITHDRAWAL: no tocan income ni expense
            }

            //derivar summary del trend
            const round2 = (n: number) => Math.round(n * 100) / 100

            buckets.forEach(b => {
                b.income = round2(b.income)
                b.expense = round2(b.expense)
                b.net = round2(b.income - b.expense)
            })

            const income = round2(buckets.reduce((sum, b) => sum + b.income, 0))
            const expense = round2(buckets.reduce((sum, b) => sum + b.expense, 0))

            //retornar respuesta limpia al cliente
            return res.json({
                interval,
                summary: { income, expense, balance: round2(income - expense) },
                movementsCount: movements.length,
                trend: buckets,
            })
        } catch (error) {
            console.error('Error fetching dashboard summary:', error);
            res.status(500).json({ error: "Error getting dashboard summary" })
        }
    }
}
```

</details>

---

**[2026-11-03] - Checkpoint y siguiente fase**

1. **Respuesta esperada del endpoint**
   ```json
   {
     "interval": "week",
     "summary": { "income": 1200, "expense": 450, "balance": 750 },
     "movementsCount": 8,
     "trend": [
       { "label": "mié", "income": 0, "expense": 0, "net": 0 },
       { "label": "jue", "income": 1200, "expense": 200, "net": 1000 },
       { "label": "vie", "income": 0, "expense": 250, "net": -250 }
     ]
   }
   ```

2. **Pruebas con `requests.http`**
   - `GET /api/dashboard/summary?interval=week` → `trend.length === 7`.
   - `GET /api/dashboard/summary?interval=month` → 4 o 5 puntos (`Sem 1`…).
   - `summary.income` debe coincidir con la suma de los `income` de `trend`.
   - Transferir dinero entre cuentas propias **no** debe alterar `summary.expense`.
   - Un día sin movimientos debe aparecer con `income: 0, expense: 0, net: 0`.

3. **Pendiente para la fase 2**
   - Añadir `dashboardTrendPointSchema` en `types/index.ts`.
   - Extender `dashboardSummaryResponseSchema` con `trend: z.array(dashboardTrendPointSchema)`.
   - Hasta entonces el frontend sigue operando: Zod ignora la clave extra.

4. **Notas**
   - La "semana" ahora significa *últimos 7 días incluyendo hoy*, no la semana calendario (lunes a domingo).
   - Los buckets se calculan en hora local del servidor; un movimiento cerca de medianoche puede caer en el día vecino si el cliente está en otra zona horaria.

---

**[2026-11-03] Esquemas de tendencia y balance de cuentas**

<details>

1. **Serie temporal del dashboard:**
   - Añadimos `dashboardTrendPointSchema` con `label`, `income`, `expense` y `net`, y lo componemos en la respuesta como `trend: z.array(dashboardTrendPointSchema)`. El tipo `DashboardSummaryResponse` ahora incluye `trend` por inferencia.

2. **Balance de cuentas:**
   - Creamos `accountBalanceSchema` extendiendo `accountSchema` con `balance: z.coerce.number()`, más `accountBalanceListSchema`. No tocamos el schema base porque `movementSchema` lo reutiliza sin el campo `balance`.

3. **Tipado derivado:**
   - Exportamos `DashboardTrendPoint`, `AccountBalance` y `AccountBalanceList` con `z.infer`, manteniendo los tipos sincronizados con sus validaciones.

</details>

---

**[2026-11-03] AccountAPI con balance de cuentas**

<details>

1. **Validación con el nuevo schema:**
   - `getAccounts` ahora parsea con `accountBalanceListSchema`, así que cada cuenta llega como `AccountBalance` e incluye `balance`. Mantenemos `safeParse` con el mensaje `"invalid account format"` en lugar de `parse`.

2. **Contrato de retorno:**
   - Tipamos explícitamente `Promise<AccountBalanceList>`. Como `handleApiError` retorna `never`, el `catch` no necesita `return` y React Query infiere `AccountBalanceList | undefined` en `useAccounts`.

3. **Sin cambios en consumidores:**
   - `useAccounts` y `MovementForm` siguen igual: el formulario usa `id`, `name` y `kind`, e ignora `balance`. `movementSchema` conserva `accountSchema` (sin balance) para las cuentas anidadas en un movimiento.

</details>

---

**[2026-11-03] Invalidación del dashboard tras mutar movimientos**

<details>

1. **Creación y eliminación:**
   - `useCreateMovement` y `useDeleteMovement` ahora invalidan `['dashboard-summary']` junto con `['movements']` y `['accounts']`, así el resumen y el gráfico se refetchean después de cada cambio.

2. **Prefix matching:**
   - La key del dashboard es `['dashboard-summary', interval]`; invalidar `['dashboard-summary']` sin `exact` cubre `week` y `month` a la vez, e ignora el `staleTime` de 5 minutos.

3. **Alcance:**
   - Las mutaciones de tags no invalidan el dashboard porque no alteran `income`, `expense` ni `balance`. En creación se añadió también `['accounts']`, que faltaba y dejaba el balance desactualizado.

</details>

---

**[2026-11-03] Restyle del selector de intervalo**

<details>

1. **Paleta del tema:**
   - Sustituimos los `zinc-*` y el `backdrop-blur` por tokens del `@theme`: contenedor `bg-white border-linen-light`, activo `bg-green-balance text-linen-light` e inactivo `text-obsidian hover:bg-sage-opaque`.

2. **Clases compartidas:**
   - Extraemos `base`, `active` e `inactive` para no duplicar cadenas entre los dos botones y usamos `transition-colors` en lugar de `transition-all`. Añadimos `focus-visible:ring-green-balance` para teclado.

3. **Accesibilidad y limpieza:**
   - El contenedor lleva `role="group"` y `aria-label`, y cada botón `aria-pressed`. Quitamos el `import React` y la anotación `React.JSX.Element`, innecesarios con `jsx: react-jsx`.

</details>

---

**[2026-11-03] Tarjetas de resumen del dashboard**

<details>

1. **Componente presentacional:**
   - `SummaryCards` recibe `data` (resumen del periodo) y `accounts` (balances) y delega el markup a un subcomponente `Card`. No usa hooks, así que `DashboardView` sigue siendo el contenedor de los datos.

2. **Valores derivados:**
   - El balance total se calcula con `reduce` sobre `accounts.balance` (stock), mientras ingresos, gastos y balance del periodo salen de `data.summary` (flujo). `movementsCount` y `accounts.length` alimentan los subtítulos.

3. **Presentación:**
   - Grid responsivo `1 → 2 → 4`, tarjetas con tokens del tema (`bg-white`, `border-linen-light`, `shadow-md`) y color semántico: verde para ingresos, rojo para gastos y saldos negativos. `tabular-nums` alinea las cifras y `formatCurrency` centraliza el formato.

</details>

---

**[2026-11-03] Gráfico de tendencia del dashboard**

<details>

1. **Componente presentacional:**
   - `TrendChart` recibe `trend` e `interval`; no usa hooks, así `DashboardView` seguirá inyectando `data.trend`. Incluye early-return cuando `trend` está vacío.

2. **Barras agrupadas con Recharts:**
   - `BarChart` con dos `Bar` (`income` y `expense`), grid solo horizontal, ejes sin líneas y leyenda. El `Tooltip` va dentro del `BarChart` para acceder al store de Recharts, y el `ResponsiveContainer` vive en un contenedor `h-72` para no medir 0.

3. **Estilo y formato:**
   - Colores hex alineados a los tokens (`#6a994e` y `#d00000`), `maxBarSize` y `radius` para las barras, y tooltip con `formatCurrency(Number(value ?? 0))`. El backend ya entrega los buckets zero-filled y redondeados.

</details>

---

**[2026-11-05] Vista del dashboard**

<details>

1. **Contenedor de datos:**
   - `DashboardView` reemplaza el smoke test (`useMovements` + `<pre>`) por el estado `interval` (`'month'` por defecto) y las queries `useDashboardSummary(interval)` y `useAccounts()`. El header con saludo por hora y el picker quedan fuera del render condicional para poder cambiar de intervalo aun cargando.

2. **Estados combinados:**
   - Loading y error se combinan con `||` porque la vista necesita ambas respuestas; el mensaje prioriza `summaryQuery.error.message` y cae al `errorMessage` de `useAccounts`. El guard `summaryQuery.data && accountsQuery.data` estrecha los tipos antes de pasarlos a `SummaryCards` y `TrendChart`.

3. **Layout heredado:**
   - La vista usa solo `space-y-6`; `AppLayout` ya aporta ancho máximo, padding y fondo. Se eliminaron `p-6`, `min-h-screen` y `bg-stone-50` del smoke test. No se añaden movimientos recientes en esta fase.

</details>

---
