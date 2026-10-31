

# 📓 Phase 23: Dashboard data layer

---
**[2026-10-28] Zod squemas para la respuesta del resumen y parametros de intervalo**

<details>

1. **Definición de Esquemas de Validación (Zod):**
   - Creamos `dashboardIntervalSchema` para restringir los intervalos permitidos exclusivamente a `'week'` o `'month'`.
   - Definimos `dashboardSummaryMetricsSchema` y `dashboardSummaryResponseSchema` para validar la respuesta del endpoint analítico `GET /api/dashboard/summary` en tiempo de ejecución.

2. **Tipado Fuertemente Enlazado (Type Safety):**
   - Inferimos y exportamos los tipos de TypeScript `DashboardInterval` y `DashboardSummaryResponse` directamente desde los esquemas Zod, garantizando coherencia entre la validación de datos y el autocompletado en el editor.


</details>

--- 

**[2026-10-29] dashboard api service**

<details>

1. **Implementación de Capa de Servicios:**
   - Creamos el objeto `DashboardAPI` encargado de realizar las peticiones HTTP al backend de MonkFlow.
   - Añadimos el método `getSummary` que acepta el parámetro de intervalo tipado (`DashboardInterval`) y se comunica con la ruta `/dashboard/summary`.

2. **Validación Segura con Zod:**
   - Integramos la validación estricta de la respuesta utilizando `dashboardSummaryResponseSchema.parse(response.data)`, asegurando que los datos cumplan con el contrato esperado antes de ser consumidos por la interfaz.


</details>

