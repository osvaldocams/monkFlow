
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

