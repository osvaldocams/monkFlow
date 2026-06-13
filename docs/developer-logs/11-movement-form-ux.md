# 📓 Phase 11: MOVEMENT FORM UX

Este archivo registra la implementación de la capa de experiencia de usuario (UX) y políticas reactivas del formulario de creación de movimientos. El objetivo es mitigar el error humano en la captura de datos mediante la habilitación selectiva de campos, limpieza automática de estados residuales y filtrado inteligente de catálogos según las reglas del negocio financiero de MonkFlow.

---

### 🎯 Objective
Garantizar que el formulario sea mecánicamente infalible en el cliente, impidiendo el envío de cargas de datos inconsistentes (payloads con datos residuales o combinaciones de cuentas inválidas) mediante el uso de las APIs reactivas de React Hook Form.

---

### 🧱 Index of Sub-parts
* **Sub-parte 1:** Suscripción al Estado y Control de Habilitación Base (`watch` API)
* **Sub-parte 2:** Orquestación de Limpieza de Estado (Efecto de Cambio de Opinión)
* **Sub-parte 3:** Reglas de Negocio Avanzadas para Filtros de Cuentas (Cash vs. Bank)
* **Sub-parte 4:** Control del Botón de Envío y Estados de Validación Estricta

---

### 🛠️ Sub-parte 1: Suscripción al Estado y Control de Habilitación Base (`watch` API)

<details>

*   **Status:** ✅ Completed
*   **Timestamp:** 13/06/2026

#### 📝 Crónica de la Sesión & Decisiones Técnicas
En esta sesión se implementó la primera barrera de UX reactiva en el formulario de creación de movimientos. El objetivo principal fue establecer un estado de "bloqueo base" generalizado en el componente hijo, inhabilitando los campos operativos (Fecha, Monto, Cuentas) hasta que el usuario seleccione explícitamente un tipo de transacción válido.

Decisión de Diseño de Estado: Se descartó el método watch tradicional extraído directamente de useFormContext debido a que las optimizaciones de renderizado de React Hook Form—en sinergia con los ciclos de Hot Module Replacement (HMR) de Vite—impedían que el componente hijo se enterara síncronamente del cambio de valor en el cliente, congelando la interfaz. Para resolver esto bajo un enfoque modular y sin recurrir a la transferencia rígida de props desde el padre, se implementó el hook especializado useWatch. Al inyectarle el objeto central de telemetría control, el subcomponente se suscribe de manera aislada y reactiva al campo type, forzando el re-renderizado local inmediato y la manipulación precisa de la propiedad disabled en los nodos del DOM nativo.

**Steps & Commands:**

1. Nuestro componente hijo `MovementForm` manejará la reactividad para deshabilitar y habilitar los campos para ello necesitamos realizar una conexión usando el hook `useWatch`
```tsx
//MovementForm.tsx
import type { MovementFormInputs } from "@/types"
import { useFormContext, useWatch } from "react-hook-form"
import { MOVEMENT_TYPES } from "@/constants/movementTypes"
import { useAccounts } from "@/hooks/useAccounts"

export default function MovementForm() {
    // 1️⃣ Extraemos 'control' directamente del contexto del formulario
    const { register, control, formState: { errors } } = useFormContext<MovementFormInputs>()

    // 2️⃣ Mandamos a vigilar el tipo de movimiento con el hook useWatch recibe un obj, con control y el name 
    const movementType = useWatch({control,name: "type"})

    const { data, isLoading, isError, errorMessage } = useAccounts()

    return (
    //codigo tsx
    )
```
2. nyección de Candados Operativos en los Inputs del Formulario. Condicionamos la interacción de los campos acoplándolos al estado de la suscripción:
```tsx
<div>
    <label className="block text-sm font-medium text-obsidian mb-2">Fecha</label>
    <input 
        type="date" 
        {...register("date", { required: "La fecha es obligatoria" })} // 👈 Validación básica nativa
        className="w-full p-3 border border-stone-200 rounded-lg focus:ring-sage focus:border-sage transition duration-150" 
        disabled={!movementType}  //3️⃣​ AGREGAMOS LA VALIDACIÓN AL DISABLE DE LOS INPUTS
    />
    {errors.date && <p className="text-red-500 text-xs mt-1">{String(errors.date.message)}</p>}
</div>
```
</details>

---