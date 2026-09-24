
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
