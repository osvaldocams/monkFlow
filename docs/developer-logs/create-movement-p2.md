# 📓 Phase 9.1: CREATE MOVEMENTS

Este archivo es la continuación de la fase 9 donde ya se registró el proceso del enrutamientos, vistas base provisionales, estructura de formulario con react-hook-form, para eeste achivo nos enfocaremos en validación de información con zod schemas, servicios api y su implementación con mutaciones. 

---

### 🎯 Objective
El objetivo es que al final de la fase podamos crear movimientos escribiendolos desde la interfaz de usuario y podamos renderizarlos en una lista de movimientos

---

### 🛠️ Sub-parte 2: zod schemas

<details>

*   **Status:** ✅ Completed
*   **Timestamp:** 07/06/2026

#### 📝 Crónica de la Sesión & Decisiones Técnicas
El objetivo de esta sesión fue centralizar las reglas de negocio y la validación estructural del formulario utilizando Zod. En lugar de delegar las restricciones lógicas al backend o dispersarlas en componentes de React, construimos un esquema unificado capaz de resolver tres frentes: la coerción de datos del navegador, la validación cruzada interdependiente y la mutación limpia de tipos para el canal de transporte (Axios).

Decisión de Arquitectura Crítica (El Patrón de Doble Interfaz): Un formulario en el navegador opera nativamente con strings (como los campos vacíos "" de los elementos select). Sin embargo, PostgreSQL y Prisma esperan valores null estrictos en sus llaves foráneas opcionales. En lugar de crear múltiples esquemas de mapeo, encapsulamos todo en un único flujo continuo (z.object -> .superRefine -> .transform). Mediante el uso estratégico de z.input y z.output, extraemos el contrato de UI para React Hook Form y el DTO final para el API Service desde la misma fuente de verdad.

**Steps & Commands:**

1. Creamos el esquema robusto en el archivo de tipos central. Implementamos z.coerce para mitigar el comportamiento de HTML5 con los montos numéricos, superRefine para inyectar issues quirúrgicos en los campos según el tipo de movimiento (INCOME, EXPENSE, TRANSFER, etc.), y .transform() como aduana final.
```typescript
// ==========================================
// 🔥 ESQUEMAS MOVEMENT
// ==========================================
export const movementTypeSchema = z.enum(["INCOME", "EXPENSE", "DEPOSIT", "WITHDRAWAL", "TRANSFER"], {
    message: "Selecciona un tipo de movimiento válido"
})
export type MovementType = z.infer<typeof movementTypeSchema>


// ******esquema del formulario (create)******

export const movementFormSchema = z.object({
    type: movementTypeSchema,
    date: z.string().min(1, "La fecha es obligatoria"),
    // Coerce convierte automáticamente "" o strings a número. Si falla, cae en el refino.
    amount: z.coerce.number("El monto es obligatorio").positive("El monto debe ser mayor a cero"),
    description: z.string().max(200, "La descripción no puede superar los 200 caracteres").optional(),
    incomeAccountId: z.string().optional().or(z.literal("")),
    expenseAccountId: z.string().optional().or(z.literal("")),
    tags: z.array(z.string()).default([])
})
// Lógica de negocio cruzada (Se ejecuta después de validar los tipos base)
.superRefine((data, ctx) => {
    
    // 🟩 REGLA: INCOME (Ingreso) -> Requiere cuenta destino
    if (data.type === "INCOME" && (!data.incomeAccountId || data.incomeAccountId === "")) {
        ctx.addIssue({
            path: ['incomeAccountId'],
            message: 'La cuenta de ingresos (destino) es obligatoria',
            code: z.ZodIssueCode.custom
        })
    }

    // 🟥 REGLA: EXPENSE (Gasto) -> Requiere cuenta origen
    if (data.type === "EXPENSE" && (!data.expenseAccountId || data.expenseAccountId === "")) {
        ctx.addIssue({
            path: ['expenseAccountId'],
            message: 'La cuenta de egresos (origen) es obligatoria',
            code: z.ZodIssueCode.custom
        })
    }

    // 🔄 REGLA: TRANSFER, DEPOSIT, WITHDRAWAL -> Requieren ambas cuentas
    if (["TRANSFER", "DEPOSIT", "WITHDRAWAL"].includes(data.type)) {
        if (!data.incomeAccountId || data.incomeAccountId === "") {
            ctx.addIssue({
                path: ['incomeAccountId'],
                message: 'La cuenta de destino es obligatoria para este movimiento',
                code: z.ZodIssueCode.custom,
            })
        }
        if (!data.expenseAccountId || data.expenseAccountId === "") {
            ctx.addIssue({
                path: ['expenseAccountId'],
                message: 'La cuenta de origen es obligatoria para este movimiento',
                code: z.ZodIssueCode.custom,
            })
        }
    }

    // 🚫 REGLA: TRANSFER -> No pueden ser la misma cuenta
    if (
        data.type === 'TRANSFER' && 
        data.incomeAccountId && 
        data.expenseAccountId && 
        data.incomeAccountId === data.expenseAccountId
    ) {
        ctx.addIssue({
            path: ['expenseAccountId'],
            message: 'La cuenta origen y destino no pueden ser la misma',
            code: z.ZodIssueCode.custom
        })
    }
})
// 🧼 Transformación final: Lo que sale limpio hacia Axios para el Backend
.transform((data) => ({
    ...data,
    description: data.description || undefined,
    incomeAccountId: data.incomeAccountId === '' ? null : data.incomeAccountId ?? null,
    expenseAccountId: data.expenseAccountId === '' ? null : data.expenseAccountId ?? null,
}))

// El único tipo que vas a necesitar para registrar useForm<MovementFormData>
export type MovementFormData = z.input<typeof movementFormSchema>

// 📺 Tipo de Entrada: El contrato para que la pantalla y useForm manejen strings vacíos
export type MovementFormInputs = z.input<typeof movementFormSchema>

// 🚀 Tipo de Salida: El contrato de los datos ya limpios y transformados que recibirá Axios
export type CreateMovementDto = z.output<typeof movementFormSchema>
```
2. Refactorización e Inyección del Resolver en la Vista Inteligente. Sustituimos el contrato estructural intermedio (FormFieldsTemporal) de la vista e instalamos el zodResolver. Esto vincula las emisiones de errores dinámicos de Zod directamente al estado nativo de React Hook Form, alimentando tanto a los inputs hijos como a la caja de depuración global de la Fase 1.5.
```typescript
import { useForm, FormProvider } from "react-hook-form"
import MovementForm from "@/components/movements/MovementForm"
import type { CreateMovementDto, MovementFormInputs } from "@/types"

//1️⃣ YA NO TENEMOS TYPE TEMPORAL

export default function CreateMovementView() {

    const methods = useForm<MovementFormInputs>({ //2️⃣useForm adopta el tipo de Entrada para mapear los controles del DOM de forma síncrona
        resolver: zodResolver(movementFormSchema), //3️⃣​ Acoplamos las reglas e interceptores de Zod
        defaultValues: { //4️⃣​ahora default values reales
            type: "INCOME",
            date: new Date().toISOString().split('T')[0], 
            amount: 0,
            description: ""
        }
    })
    
    //Función que se ejecuta SOLO si todas las validaciones pasan
    const onSubmit = (data: CreateMovementDto) => { //5️⃣​ l callback de sumisión recibe la estructura de salida mutada (Garantía Cero Any)
        console.log("🚀 Datos validados listos para enviar al backend:", data)
    }
    return (
        resto...)
```

</details>

---

### 🛠️ Sub-parte 3: API SERVICE & MUTATION

<details>

*   **Status:** ✅ Completed
*   **Timestamp:** 07/06/2026

#### 📝 Crónica de la Sesión & Decisiones Técnicas


**Steps & Commands:**

3. trabajaremos con el api service, gracias a los zod schemas tenemos un buen manejo de la información
```typescript
export const MovementAPI = {
    createMovement: async (dtoData: CreateMovementDto) => {
        try {
            const { data } = await api.post("/movements", dtoData)
            return data
        } catch (error) {
            handleApiError(error, 'Error creating movement', dtoData )
        }
    },
    resto...
```
4. ahora vamos al hook useMovement para crear la mutation
```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MovementAPI } from '@/api/MovementAPI'
import type { CreateMovementDto } from '@/types'

//==============================================
//  hook para consultar lista de movimientos
//==============================================

export const useMovements = () => {
    const query = useQuery({ //1️⃣​
        queryKey: ['movements'], 
        queryFn: MovementAPI.getMovements
    })
    return {
        ...query, // 2️⃣​
        errorMessage: query.error instanceof Error ? query.error.message : null
    }
}

//==============================================
//  hook para mutación/creación de nuevos movimientos
//==============================================
export const useCreateMovement = () => {//3️⃣ creamos nuestro hook para la mutación de creación de movimientos
    const queryClient = useQueryClient() //4️⃣ ​Para invalidar cache después de crear un movimiento
    
    return useMutation({ //5️⃣ usamos useMutation para manejar la creación de movimientos 
        mutationFn: (formData: CreateMovementDto) => MovementAPI.createMovement(formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["movements"] })
            console.log("¡Movimiento creado con éxito en la base de datos!")
        },
        onError: (error) => {
            console.error("Error en la mutación:", error)
        }
    })
}
```
6. aplicamos el mutation en nuestra vista
```typescript
//importaciones...

export default function CreateMovementView() {
    //1 Inicializamos la central de React Hook Form
    const methods = useForm<MovementFormInputs>({
        resolver: zodResolver(movementFormSchema), // Conectamos el esquema de Zod para validación
        defaultValues: {
            type: "INCOME",
            date: new Date().toISOString().split('T')[0], // Fecha de hoy por defecto
            amount: 0,
            description: ""
        }
    })

    const createMovementMutation = useCreateMovement() //1️⃣ instanciamos nuestro hook
    
    const onSubmit = (data: CreateMovementDto) => {
        console.log("🚀 Datos validados listos para enviar al backend:", data)
        createMovementMutation.mutate(data) // ​2️⃣ se ejecuta en el onSubmit​
    }
    return (
        resto de codigo...
    )
}
```
```tsx
<button 
    type="submit" 
    className="w-full border bg-sage text-black py-2 px-4 rounded-md font-medium hover:bg-opacity-90 transition-colors"
    disabled={createMovementMutation.isPending} //3️⃣ podemos ir al codigo tsx y disfrutar de las bondades, como el hecho de que podamos crear codigos condicionales si el elemento está pendiente
    >
    {createMovementMutation.isPending ? "Creando..." : "Crear Movimiento"} //​4️⃣​
</button>
```
</details>

---

### 🛠️ Sub-parte : SMOKE TEST

<details>

*   **Status:** ✅ Completed
*   **Timestamp:** 07/06/2026

#### 📝 Crónica de la Sesión & Decisiones Técnicas


**Steps & Commands:**

7.  haremos el smoke test para ello nos aseguramos de tener datos válidos para enviar, debido a que en algunas partes del formulario aún tenemos elementos estáticos que más adelante se desarrollaran.
```ts
<select 
    {...register("type")}
    className="w-full p-3 border border-stone-200 rounded-lg focus:ring-sage focus:border-sage transition duration-150"
>
    <option value="INCOME">Ingreso</option> // 👈 serie de options que simulan nuestro enum
    <option value="EXPENSE">Gasto</option>
    <option value="TRANSFER">Transferencia</option>
    <option value="DEPOSIT">Depósito</option>
    <option value="WITHDRAWAL">Retiro</option>
</select>
```
```ts
<select 
    {...register("incomeAccountId")}
    className="w-full p-3 border border-stone-200 rounded-lg focus:ring-sage focus:border-sage transition duration-150"
>
    <option value="">-- Seleccionar --</option>
    <option value="1524ec1f-cccf-4c50-ad8a-efa1d6b17c12">MERCADOPAGO</option>
    <option value="6f91e748-0c5a-42d3-a011-1139ef16854e">BBVA</option>
    <option value="0b4643a4-c544-4a34-83b8-122f84c72dca">EFECTIVO</option>
</select>
```
- 🚀​ listo para ejecutar test
    👨🏻‍⚖️​ veredicto: Error 400 bad request, la capa de validaciones que protegen la entrada de datos no acepta el valor null
    👷🏻‍♂️​solucion: cambiar el resolver de zod en lugar de null => undefined
    ```ts
    transform((data) => ({
        ...data,
        description: data.description || undefined,
        incomeAccountId: data.incomeAccountId === '' ? undefined : data.incomeAccountId ?? undefined,
        expenseAccountId: data.expenseAccountId === '' ? undefined : data.expenseAccountId ?? undefined,
    }))
    ```
</details>