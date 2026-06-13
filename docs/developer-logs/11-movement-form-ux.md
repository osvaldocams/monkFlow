# 📓 Phase 11: MOVEMENT FORM UX

Este archivo registra la implementación de la capa de experiencia de usuario (UX) y políticas reactivas del formulario de creación de movimientos. El objetivo es mitigar el error humano en la captura de datos mediante la habilitación selectiva de campos, limpieza automática de estados residuales y filtrado inteligente de catálogos según las reglas del negocio financiero de MonkFlow.

---

### 🎯 Objective
Garantizar que el formulario sea mecánicamente infalible en el cliente, impidiendo el envío de cargas de datos inconsistentes (payloads con datos residuales o combinaciones de cuentas inválidas) mediante el uso de las APIs reactivas de React Hook Form.

---

### 🧱 Index of Sub-parts
* **Sub-parte 1:** Suscripción al Estado y Control de Habilitación Base (`watch` API)
* **Sub-parte 2:** Reglas de Negocio Avanzadas para Filtros de Cuentas (Cash vs. Bank)
* **Sub-parte 3:** Orquestación de Limpieza de Estado (Efecto de Cambio de Opinión)
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

### 🛠️ Sub-parte 2: Reglas de Negocio Avanzadas para Filtros de Cuentas (Cash vs. Bank)

<details>

*   **Status:** ✅ Completed
*   **Timestamp:** 13/06/2026

#### 📝 Crónica de la Sesión & Decisiones Técnicas
En esta sesión se codificó el núcleo de la lógica financiera en el cliente para el formulario de MonkFlow. El objetivo primordial fue transformar los catálogos estáticos de cuentas en estructuras de datos dinámicas y reactivas, capaces de mutar y auto-filtrarse en tiempo real según el tipo de movimiento seleccionado, impidiendo desde la propia UI cualquier combinación transaccional inválida para el negocio.

***Decisiones de Optimización y Flujo Estricto***: 
1. Abstracción con useMemo: Para evitar el costo computacional de realizar operaciones de filtrado de arreglos sobre el árbol del DOM en cada ciclo de render genérico, se encapsuló la lógica distributiva dentro de un hook useMemo. Esta aduana computacional procesa y memoriza de forma aislada dos arreglos finales: incomeAccounts y expenseAccounts.
2. Suscripción Multivariable con useWatch: Se expandió el radar de telemetría de useWatch transformándolo en un arreglo de observación que escucha simultáneamente el tipo de movimiento y los identificadores únicos (id) de ambas cuentas.
3. Estrategia Antiduplicación (Validación Cruzada): Al procesarse una TRANSFER, el motor financiero evalúa si alguna de las cuentas gemelas (BANK) ha sido seleccionada. De ser así, remueve dinámicamente esa entidad del catálogo del input opuesto (id !== selected), neutralizando el error lógico de transferir fondos hacia la misma cuenta de origen.
4. Acoplamiento Síncrono de Dependencias: Se detectó un aislamiento de renderizado al mutar las cuentas en el cliente. Se resolvió incorporando selectedExpenseAccount y selectedIncomeAccount en las dependencias del useMemo, asegurando que cualquier interacción en los selects fuerce el recálculo sutil e inmediato de las exclusiones mutuas.

**Steps & Commands:**

1. Orquestación del Motor de Filtrado en la Capa Lógica `src/components/movements/MovementForm.tsx`
```tsx
import type { MovementFormInputs } from "@/types"
import { useFormContext, useWatch } from "react-hook-form"
import { MOVEMENT_TYPES } from "@/constants/movementTypes"
import { useAccounts } from "@/hooks/useAccounts"
import { useMemo } from "react"

export default function MovementForm() {

    const { register, control, formState: { errors } } = useFormContext<MovementFormInputs>()

    const [movementType, selectedExpenseAccount, selectedIncomeAccount] = useWatch({ 
        control,
        name: ["type", "expenseAccountId", "incomeAccountId"] //1️⃣NUESTRO USEwATCH AHORA ES UN ARRAY DE VALORES QUE QUEREMOS MONITOREAR
    })


    const { data, isLoading, isError, errorMessage } = useAccounts()

    //​2️⃣​reglas de negocios para filtro de cuentas según tipo de movimiento
    // USAREMOS USEMEMO PARA MEMORIZAR LOS RESULTADOS Y EVITAR CÁLCULOS INNECESARIOS EN CADA RENDERIZADO, SOLO SE REEJECUTARÁ CUANDO CAMBIE EL ARRAY DE CUENTAS O EL TIPO DE MOVIMIENTO
    const { incomeAccounts, expenseAccounts} = useMemo(() => {
        let incomeBase = data || []
        let expenseBase = data || []

        if(movementType === 'DEPOSIT'){
            incomeBase = data.filter(account => account.kind === 'BANK')
            expenseBase = data.filter(account => account.kind === 'CASH')
        }
        if(movementType === 'WITHDRAWAL'){
            incomeBase = data.filter(account => account.kind === 'CASH')
            expenseBase = data.filter(account => account.kind === 'BANK')
        }
        if(movementType === 'TRANSFER'){
            incomeBase = data.filter(account => account.kind === 'BANK')
            expenseBase = data.filter(account => account.kind === 'BANK')
            // 3️⃣​ VALIDACIÓN CRUZADA: Filtramos para que no se repitan
            if(selectedExpenseAccount){
                //​👇​ En la de ingreso (destino), quitamos la que ya se eligió en egreso (origen)
                incomeBase = incomeBase.filter(account => account.id !== selectedExpenseAccount)
            }
            if(selectedIncomeAccount){
                // ​👇​En la de egreso (origen), quitamos la que ya se eligió en ingreso (destino)
                expenseBase = expenseBase.filter(account => account.id !== selectedIncomeAccount)
            }
        }
        return { //4️⃣​ Devolvemos ambos arrays filtrados para usarlos en los selects
            incomeAccounts: incomeBase,
            expenseAccounts: expenseBase
        }

    }, [data, movementType, selectedExpenseAccount, selectedIncomeAccount]) //​5️⃣​Dependencias: se recalcula cada vez que cambian las cuentas o el tipo de movimiento


    return (
        resto...
    )
```
2. Inyección de Restricciones Unilaterales en la Capa del Mapeo Visual. Condicionamos la accesibilidad de los selectores para encapsular el comportamiento semántico de los flujos de dinero (INCOME / EXPENSE):
```tsx
<div>
    <label className="block text-sm font-medium text-obsidian mb-2">Cuenta Ingreso</label>
    <select 
        disabled={!movementType || movementType === 'EXPENSE'} //1️⃣​AGREGAMOS VALIDACION QUE BLOQUEA EXPENSE
        {...register("incomeAccountId")}
        className="w-full p-3 border border-stone-200 rounded-lg focus:ring-sage focus:border-sage transition duration-150"
    >
        <option value="">-- Seleccionar --</option>
        {incomeAccounts?.map(account => ( //2️⃣​​ HACEMOS MAP AL ARREGLO DEFINITIVO
            <option key={account.id} value={account.id}>{account.name}</option>
        ))}
    </select>
</div>

<div>
    <label className="block text-sm font-medium text-obsidian mb-2">Cuenta Egreso</label>
    <select 
        {...register("expenseAccountId")}
        className="w-full p-3 border border-stone-200 rounded-lg focus:ring-sage focus:border-sage transition duration-150"
        disabled={!movementType || movementType === 'INCOME'} //3️⃣​AGREGAMOS VALIDACION QUE BLOQUEA INCOME
    >
        <option value="">-- Seleccionar --</option>
        {expenseAccounts?.map(account => ( //4️⃣​ HACEMOS MAP AL ARREGLO DEFINITIVO
            <option key={account.id} value={account.id}>{account.name}</option>
        ))}
    </select>
</div>
```
</details>

---