
# 📓 Phase 19: CREATE TAG API

---
**[2026-09-20] - Scaffolding del Modal de Creación y Control por URL (`useSearchParams`)**

1. **Creación del Estructurado Base (`CreateTagModal.tsx`):**
   - Construimos el componente modal en `src/components/ui/CreateTagModal.tsx` con la estructura de contención base (backdrop/overlay e interfaz de propiedades `CreateTagModalProps`).
   - Vinculamos el evento `onClose` tanto al botón de acción directa como al clic en el fondo translúcido para garantizar un cierre intuitivo.

2. **Gestión del Estado del Modal mediante Parámetros de Búsqueda:**
   - En `MovementForm.tsx`, integramos `useSearchParams` de `react-router-dom` para controlar la visibilidad del modal a través de la URL (`?createTag=true`).
   - Implementamos las funciones declarativas `openCreateTag` y `closeCreateTag` para sincronizar la apertura y el cierre sin romper la navegación del navegador ni perder el historial.

3. **Conexión de Callbacks entre Componentes:**
   - Reemplazamos el handler temporal de `TagPicker` conectando la prop `onCreateTag` directamente con la función `openCreateTag`.
   - Renderizamos condicionalmente `<CreateTagModal onClose={closeCreateTag} />` al final del formulario de movimientos.

---

**[2026-09-24] - API**

1. **Definición del Contrato de Datos y Tipado (`createTagSchema`):**
   - Creamos `createTagSchema` en `src/types/index.ts` asegurando la presencia obligatoria del nombre y validando el formato Hexadecimal (`/^#([0-9A-Fa-f]{6})$/`) para la propiedad `color` con un valor por defecto.
   - Inferimos los tipos estáticos `CreateTagFormInputs` (`z.input`) para la entrada del formulario y `CreateTagDto` (`z.output`) para la carga útil que consume la API.

2. **Implementación del Servicio HTTP (`TagAPI.createTag`):**
   - Agregamos el método asíncrono `createTag` en `TagAPI.ts` para enviar peticiones `POST /tags`.
   - Implementamos validación en tiempo de ejecución de la respuesta utilizando `tagSchema.safeParse(response)` antes de retornarla a la UI, delegando capturas de excepción al helper `handleApiError`.

3. **Abstracción de Estado de Mutación y Revalidación de Caché (`useCreateTag`):**
   - Construimos el custom hook `useCreateTag` en `src/hooks/useTags.ts` respaldado por `useMutation` de React Query.
   - Configuramos el callback `onSuccess` ejecutando `queryClient.invalidateQueries({ queryKey: ['tags'] })`, lo que revalida automáticamente el listado en `TagPicker` al crear una nueva etiqueta sin recargar la página.
--- 

**[2026-09-28] - Separación de Responsabilidades: `CreateTagModal` y `TagForm`**

1. **Refactorización del Componente Orquestador (`CreateTagModal.tsx`):**
   - Separamos la lógica de orquestación (mutación de la API y control de estados) de la vista del formulario para mantener coherencia arquitectónica en el proyecto.
   - Ejecutamos el custom hook `useCreateTag` extrayendo `mutateAsync` y `isPending`.
   - Estructuramos la UI base con el modal wrapper (overlay, header con título y botón de cierre) y delegamos la captura de datos al componente hijo `<TagForm />` mediante props (`onSubmit`, `onCancel`, `isPending`).

2. **Construcción del Componente Presentacional (`TagForm.tsx`):**
   - Creamos `TagForm.tsx` tipando estrictamente su interfaz de propiedades para conectarlo de forma limpia con `CreateTagModal`.
   - Integramos `react-hook-form` con `@hookform/resolvers/zod` enlazando `createTagSchema` y estableciendo los valores por defecto para `name` y `color`.

3. **UX de Selección de Colores y Gestión del Formulario:**
   - Definimos la paleta predeterminada `PRESET_COLORS` mapeando píldoras de color interactivas que actualizan el campo `"color"` mediante `setValue` (forzando `shouldValidate` y `shouldDirty`).
   - Sincronizamos la vista del color activo mediante `watch("color")` e incluimos la representación visual junto al manejo de errores dinámico (`errors.color`).
   - Construimos la sección de acciones con estados deshabilitados durante el proceso de guardado (`disabled={isPending}`) y retroalimentación visual condicional (`Guardando...` / `Crear Etiqueta`).

   --- 

**[2026-09-28] - Corrección de Formularios Anidados con React Portals (`CreateTagModal.tsx`)**

1. **Resolución de Anidamiento en el DOM (*Nested Forms Issue*):**
   - Identificamos un problema de jerarquía de marcado en el que `<CreateTagModal />` se renderizaba directamente dentro del arbol HTML de `<MovementForm />`, generando formularios `<form>` anidados (inválidos según la especificación de HTML5) y provocando disparos indeseados del formulario principal al presionar enter o submit.

2. **Implementación de React Portal (`createPortal`):**
   - Importamos `createPortal` desde `react-dom` dentro de `CreateTagModal.tsx`.
   - Modificamos el retorno del componente para proyectar el marcado del modal directamente en el nodo `document.body`, fuera del árbol DOM del formulario de movimientos pero manteniendo el contexto de React intacto.
