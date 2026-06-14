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

### 🛠️ Sub-parte 3: Orquestación de Limpieza de Estado (Efecto de Cambio de Opinión)

<details>

*   **Status:** ✅ Completed
*   **Timestamp:** 13/06/2026

#### 📝 Crónica de la Sesión & Decisiones Técnicas
En esta sesión se implementó la capa defensiva de saneamiento de memoria en el cliente. Una vez asegurados los filtros específicos de catálogos en la Sub-parte 2, surgía el riesgo de "persistencia de datos fantasma": si un usuario parametrizaba cuentas válidas para un flujo específico (por ejemplo, cuentas tipo `BANK` y `CASH` para un `DEPOSIT`) y posteriormente cambiaba de opinión hacia otro tipo de transacción (como `WITHDRAWAL` o `TRANSFER`), los identificadores de cuenta previos se mantenían retenidos en el estado interno de React Hook Form, provocando cargas de datos corruptas o inconsistentes con las reglas de negocio del backend.

**Decisión de Arquitectura Táctica:** Se determinó el uso del hook `useEffect` en sincronía con el método de escritura programática `setValue` de React Hook Form. En lugar de ramificar la lógica en validaciones condicionales complejas e individuales por cada tipo de movimiento, se optó por una política de **Saneamiento Absoluto**. Cada vez que la variable reactiva `movementType` (monitoreada por `useWatch`) experimenta una mutación de valor, el efecto interrumpe el ciclo y purga inmediatamente las llaves `incomeAccountId` y `expenseAccountId` regresándolas a un estado de cadena vacía (`""`). Esto asegura que la mesa de trabajo se limpie de forma transparente, obligando al usuario a realizar una selección consciente y alineada a los nuevos catálogos disponibles.

**Steps & Commands:**

1. Aprovechando que ya tenemos el useWatch para incomeAccountId y expenseAccountId la idea es reiniciar su valor cada que haya cambios en movementType, la desición técnica es usar el hook useEffect y setear nuevos valores con setValue de RHF
```tsx
// src/components/movements/MovementForm.tsx
import type { MovementFormInputs } from "@/types"
import { useFormContext, useWatch } from "react-hook-form"
import { MOVEMENT_TYPES } from "@/constants/movementTypes"
import { useAccounts } from "@/hooks/useAccounts"
import { useEffect, useMemo } from "react"

export default function MovementForm() {

    //1️⃣​ EXTRAEMOS SETVALUE
    const { register, control, setValue, formState: { errors } } = useFormContext<MovementFormInputs>()

    const [movementType, selectedExpenseAccount, selectedIncomeAccount] = useWatch({ 
        control,
        name: ["type", "expenseAccountId", "incomeAccountId"]
    })


    const { data, isLoading, isError, errorMessage } = useAccounts()

    //​​reglas de negocios para filtro de cuentas según tipo de movimiento
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
            //VALIDACIÓN CRUZADA: Filtramos para que no se repitan
            if(selectedExpenseAccount){
                incomeBase = incomeBase.filter(account => account.id !== selectedExpenseAccount)
            }
            if(selectedIncomeAccount){
                expenseBase = expenseBase.filter(account => account.id !== selectedIncomeAccount)
            }
        }
        return {
            incomeAccounts: incomeBase,
            expenseAccounts: expenseBase
        }
    }, [data, movementType, selectedExpenseAccount, selectedIncomeAccount])

    //2️⃣​ Guardián de Limpieza: Purga total ante el efecto "Cambio de Opinión"
    useEffect(() => {
        setValue("incomeAccountId", "")
        setValue("expenseAccountId", "")
    }, [movementType, setValue])

    return (
        resto...
    )
```

</details>

---

### 🛠️ Sub-parte 4: Control del Botón de Envío y Estados de Validación Estricta

<details>

*   **Status:** ✅ Completed
*   **Timestamp:** 13/06/2026

#### 📝 Crónica de la Sesión & Decisiones Técnicas
En esta sesión de cierre de fase, se consolidó la arquitectura defensiva del formulario en la vista padre, resolviendo fricciones críticas de tipado estructural en el cliente y saneando inconsistencias de datos asíncronos provenientes del backend.

Decisiones de Sincronización Global y Arquitectura de Tipos:

1. Validación Proactiva via mode: "onChange": Se configuró la escucha activa en cada cambio de input. Esto permite que el esquema de Zod reevalúe el estado en milisegundos, habilitando o bloqueando el botón de envío de forma nativa mediante las banderas combinadas isValid (síncrona) e isPending (asíncrona).

2. Aislamiento de Contratos (Entrada vs. Salida): Se identificó un conflicto en la firma del método onSubmit. React Hook Form opera estrictamente sobre los tipos de captura del formulario (MovementFormInputs), mientras que el hook de mutación de Axios exige el formato de persistencia refinado (CreateMovementDto). En lugar de recurrir a técnicas de evasión de tipado (as any), se implementó un flujo transparente donde onSubmit recibe de forma nativa los tipos de entrada y los procesa explícitamente a través del método .parse() del esquema mutador, garantizando la inyección de datos sanitizados hacia la API.

3. Saneamiento del Schema de Respuestas (Resolución de bug NaN): Durante las pruebas en entorno de desarrollo (localhost:5173), se detectó un bloqueo de ejecución en el método getMovements. El análisis del controlador de Prisma reveló que la consulta omitía deliberadamente el campo balance en las relaciones de cuenta. Al intentar coaccionar una propiedad inexistente (undefined), el cliente generaba un valor indeterminado (NaN), rompiendo las restricciones del esquema. Se resolvió alineando estructuralmente el accountSchema en el frontend para prescindir del balance en las lecturas de movimientos, acoplando la interfaz a la realidad de la base de datos.

**Steps & Commands:**

1. Orquestación del Formulario y el Guardián del Submit `src/views/movements/CreateMovementView.tsx`
```tsx
import { useForm, FormProvider } from "react-hook-form"
import MovementForm from "@/components/movements/MovementForm"
import { movementFormSchema, createMovementApiSchema, type CreateMovementDto, type MovementFormInputs, type MovementType } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { useCreateMovement } from "@/hooks/useMovements"

export default function CreateMovementView() {
    // 1️⃣ Inicialización del estado con tipado nativo de entrada
    const methods = useForm<MovementFormInputs>({
        resolver: zodResolver(movementFormSchema), 
        mode: "onChange", 
        defaultValues: {
            type: "" as MovementType, 
            date: new Date().toISOString().split('T')[0], 
            amount: 0,
            description: ""
        }
    })

    const createMovementMutation = useCreateMovement()
    const { isValid } = methods.formState
    const { isPending } = createMovementMutation
    
    // 2️⃣ Puente de Transformación: Conversión limpia de Entrada (Inputs) a Salida (DTO)
    const onSubmit = (data: MovementFormInputs) => {
        try {
            // Saneamos strings vacíos a undefined mediante la aduana de transformación de Zod
            const cleanData = createMovementApiSchema.parse(data)
            console.log("🚀 Payload sanitizado listo para Axios:", cleanData)
            
            createMovementMutation.mutate(cleanData)
        } catch (error) {
            console.error("⚠️ Error crítico en la transformación de datos:", error)
        }
    }

    return (
        <div className="max-w-3xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-obsidian mb-6">Crear Nuevo Movimiento</h1>

            <FormProvider {...methods}>
                <form 
                    noValidate
                    onSubmit={methods.handleSubmit(onSubmit)} 
                    className="space-y-6 bg-white p-6 rounded-lg border border-stone-200"
                >
                    <MovementForm /> 

                    <button 
                        type="submit" 
                        className={`w-full border bg-gray-400 text-black py-2 px-4 rounded-md font-medium hover:bg-opacity-60 transition-colors ${(!isValid || isPending) ? "cursor-not-allowed opacity-50" : "hover:bg-gray-500"}`}
                        disabled={!isValid || isPending} 
                    >
                        {isPending ? "Creando..." : "Crear Movimiento"}
                    </button>

                    {/* Panel de Depuración de Errores */}
                    {Object.keys(methods.formState.errors).length > 0 && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                            <p className="font-semibold mb-2">Errores en el formulario:</p>
                            <ul className="list-disc list-inside">
                                {Object.entries(methods.formState.errors).map(([field, error]) => (
                                    <li key={field}>{field}: {error?.message}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </form>
            </FormProvider>
        </div>
    )
}
```
2. Refactor Saneador del Esquema Core de Cuentas `src/types/index.ts` eliminamos la propiedad balance para sincronizar las respuestas del backend que carecen de dicha proyección en Prisma:
```tsx
export const accountSchema = z.object({
    id: z.string().uuid("El ID de la cuenta debe ser un UUID válido"),
    name: z.string().min(1, "El nombre de la cuenta es obligatorio"),
    kind: accountTypeSchema
    // 💡 Saneado: Se remueve el balance para evitar falsas coerciones de NaN en peticiones colectivas (GET)
})
```

</details>