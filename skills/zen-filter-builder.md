# Skill: Zen Filter Builder (MonkFlow UI)

## Objetivo
Construir el sistema de filtros para la vista de movimientos de forma estrictamente modular, desacoplada y sincronizada al 100% con React Router (`useSearchParams`), manteniendo la estética minimalista Zen (Tailwind CSS, tonos zinc).

## Principios Inquebrantables (Cero Deuda Técnica)
1. **La URL es la única fuente de verdad:** Queda prohibido usar `useState` local para guardar los valores de los filtros. Todo vive y muere en los query params de React Router.
2. **Atomicidad:** Ningún componente de filtros debe superar las 100 líneas. Si crece, se divide en subcomponentes (ej. `SearchInput.tsx`, `TagSelector.tsx`).
3. **Tipado Estricto:** Cero uso de `any`. Todos los parámetros de la URL deben tiparse y parsearse con seguridad.

## Estructura Modular de Construcción (Paso a Paso)
El agente NO debe generar todo el código de golpe. Debe construir la feature en el siguiente orden estricto:

### Bloque 1: El Custom Hook (`useMovementFilters.ts`)
- Debe leer y escribir en la URL usando `useSearchParams`.
- Debe proveer funciones limpias para actualizar parámetros individuales (ej. `setSearch`, `setType`, `setTags`, `setDates`) y un método `clearAllFilters`.
- Debe limpiar automáticamente los parámetros vacíos para evitar URLs sucias.

### Bloque 2: La Barra Primaria (`FilterBar.tsx`)
- Input de búsqueda con *debounce* integrado (400ms).
- Selector rápido de tipo de movimiento (Todos / Ingreso / Gasto).
- Botón minimalista de "Filtros Avanzados" que muestra un contador (badge) dinámico de cuántos filtros están activos.

### Bloque 3: El Panel Colapsable Avanzado (`AdvancedFiltersDrawer.tsx` o popover)
- Selector múltiple de tags (lógica visual de pastillas/tags seleccionables).
- Selector de cuentas (`accountId` / `accountKind`).
- Rango de fechas (`startDate`, `endDate`).
- Botón de "Limpiar filtros" que resetea todo a su estado inicial.
