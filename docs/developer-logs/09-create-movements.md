# 📓 Phase 9: CREATE MOVEMENTS

Este archivo registra el proceso para la creación de movimientos desde el cliente, incluye enrutamientos, vistas base provisionales, estructura de formulario, validación de información con zod schemas, servicios api y su implementación con mutaciones. 

---

### 🎯 Objective
El objetivo es que al final de la fase podamos crear movimientos escribiendolos desde la interfaz de usuario y podamos renderizarlos en una lista de movimientos

---

### 🛠️ Sub-parte 1: Enrutamiento, vista base y estructra del formulario

<details>

*   **Status:** ✅ Completed
*   **Timestamp:** 06/06/2026

#### 📝 Crónica de la Sesión & Decisiones Técnicas
El objetivo primordial de esta sisión es crear un enrutamiento para las vistas, la lista de tareas `src/views/movements/MovementView.tsx` y un componente asociado `src/components/movements/MovementList.tsx`, una vista general para el formulario `src/views/movements/CreateMovementView.tsx` y un componente asociado `src/components/movements/MovementForm.tsx` una vez creados les daremos una forma provisional cubriendo lo mas indispensable para que al final se muestre la información.

#### 🚨​Descubrimiento Crítico
(JavaScript Proxy Layer): Durante la sesión se identificó que React Hook Form optimiza los ciclos de renderizado aislando la lectura del estado a través de un Proxy. Si el componente Padre no consume explícitamente las propiedades de formState en su cuerpo de renderizado, RHF suspende los re-renders del subárbol. Decidimos integrar un Error Summary Box en la raíz; este bloque no solo mejora la accesibilidad global de la interfaz, sino que fuerza la suscripción activa del componente contenedor, garantizando la sincronización inmediata de los errores síncronos hacia el componente hijo.

**Steps & Commands:**

1. empezaremos con lo relacionado al formulario, creamos la vista `CreateMovementView.tsx` aqui vivirá toda la lógica inherente del formulario que estaremos manejando con `react-hook-form`, una vez hecho el manejo pasaremos la información a un componente `MovementForm.tsx` de momento solo construimos un pequeño cascarón de codigo estático y en el siguiente paso agregamos react-hook-form, es importante tambien agregar esta nueva vista al router, podemos empezar con eso:
```ts
//router.tsx
//resto de importaciones
import CreateMovementView from "./views/movements/CreateMovementView" //👈importamos la vista

//...queryClient

export default function Router() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Routes>
                    <Route element={<AppLayout />} />
                        <Route path="/" element={<DashboardView/>} index />
                        <Route path="/movements/create" element={<CreateMovementView />} /> //👈NUEVA RUTA
                </Routes>
            </BrowserRouter>
        </QueryClientProvider>
    )
}
```
```tsx
//CreateMovemetView.tsx
export default function CreateMovementView() {
    return (
        <div className="max-w-3xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-obsidian mb-6">Crear Nuevo Movimiento</h1>

            <form className="space-y-6 bg-white p-6 rounded-lg border border-stone-200">
                
                <MovementForm />

                <button type="submit" className="w-full bg-sage text-white py-2 px-4 rounded-md font-medium hover:bg-opacity-90 transition-colors">
                    Guardar Transacción
                </button>
                
            </form>
        </div>
    )
}
```
```tsx
export default function MovementForm() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tipo de Movimiento */}
            <div>
                <label className="block text-sm font-medium text-obsidian mb-2">
                    Tipo de Movimiento
                </label>
                <select
                    className="w-full p-3 border border-green-balance rounded-lg focus:ring-sage focus:border-sage transition duration-150"
                >
                    <option value="income">Ingreso</option>
                    <option value="expense">Gasto</option>
                </select>
            </div>
            {/* Tag */}
            <div>
                <label className="block text-sm font-medium text-obsidian mb-2">
                    Tag
                </label>
                <select
                    className="w-full p-3 border border-green-balance rounded-lg focus:ring-sage focus:border-sage transition duration-150"
                >
                    <option value="income">tag</option>
                </select>
            </div>
            {/* Date and amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label
                        className="block text-sm font-medium text-obsidian mb-2"
                    >
                    Fecha
                    </label>
                    <input
                        type="date"
                        className={`w-full p-3 border border-green-balance rounded-lg focus:ring-sage focus:border-sage transition duration-150 `}
                    />
                </div>

                <div>
                    <label
                        className="block text-sm font-medium text-obsidian mb-2"
                    >
                    Monto ($)
                    </label>
                    <input
                        type="number"
                        placeholder="Ej: 50.00"
                        className={`w-full p-3 border border-green-balance rounded-lg focus:ring-sage focus:border-sage transition duration-150 `}
                    />
                </div>
            </div>

            {/*Accounts*/}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label
                        className="block text-sm font-medium text-obsidian mb-2"
                    >
                    Cuenta Ingreso
                    </label>
                    <select
                        className={`w-full p-3 border border-green-balance rounded-lg focus:ring-sage focus:border-sage transition duration-150`}
                    >
                        <option value="">-- Seleccionar --</option>
                        <option value="">EFECTIVO</option>
                        <option value="">BBVA</option>
                        <option value="">BANCO AZTECA</option>
                        
                    </select>
                </div>

                <div>
                    <label
                        className="block text-sm font-medium text-obsidian mb-2"
                    >
                    Cuenta Egreso
                    </label>
                    <select
                        className={`w-full p-3 border border-green-balance rounded-lg focus:ring-sage focus:border-sage transition duration-150 `}
                    >
                        <option value="">-- Seleccionar --</option>
                        <option value="">EFECTIVO</option>
                        <option value="">BBVA</option>
                        <option value="">BANCO AZTECA</option>
                    </select>
                </div>
            </div>

            {/* Description */}
            <div>
                <label
                    className="block text-sm font-medium text-obsidian mb-2"
                >
                Descripción
                </label>
                <textarea
                    placeholder="Detalles del movimiento (Ej: Pago de renta, Venta freelance)."
                    className={`w-full p-3 border border-green-balance rounded-lg focus:ring-sage focus:border-sage transition duration-150`}
                />
            </div>
        </div>
    )
}
```
2. en este paso vamos a implementar react-hook-form, para evitar el paso de información por props al compenente usaremos `FormProvider`
```bash
#iniciamos instalando react-hook-form y hookform/resolver que usaremos mas adelante
cd frontend
pnpm add react-hook-form @hookform/resolvers
```
```tsx
import { useForm, FormProvider } from "react-hook-form"
import MovementForm from "@/components/movements/MovementForm"

// 💡 Definimos un tipo temporal para el tipado del formulario
type FormFieldsTemporal = {
    type: "income" | "expense"
    date: string
    amount: number
    description: string
    incomeAccountId?: string
    expenseAccountId?: string
}

export default function CreateMovementView() {
    //1️⃣​ Inicializamos la central de React Hook Form
    const methods = useForm<FormFieldsTemporal>({
        defaultValues: {
            type: "income",
            date: new Date().toISOString().split('T')[0], // Fecha de hoy por defecto
            amount: 0,
            description: ""
        }
    })
    //2️⃣​ Función que se ejecuta SOLO si todas las validaciones pasan
    const onSubmit = (data: FormFieldsTemporal) => {
        console.log("🚀 Datos validados listos para enviar al backend:", data)
    }
    return (
        <div className="max-w-3xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-obsidian mb-6">Crear Nuevo Movimiento</h1>

            {/* 3️⃣​ Envolvemos con el FormProvider y esparcimos los métodos con {...methods} */}
            <FormProvider {...methods}>
                <form 
                    className="space-y-6 bg-white p-6 rounded-lg border border-stone-200"
                    onSubmit={methods.handleSubmit(onSubmit)} // 4️⃣​ Usamos handleSubmit para manejar el submit
                >
                    
                    <MovementForm /> {/* 🆓​ El hijo no recibe NINGUNA prop, está en el mismo canal de radio */}

                    <button type="submit" className="w-full border bg-sage text-black py-2 px-4 rounded-md font-medium hover:bg-opacity-90 transition-colors">
                        Guardar Transacción
                    </button>
                </form>
                {/* Error box: Muestra los errores actuales */}
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
            </FormProvider>
        </div>
    )
}
```
3. vamos al componente hijo, en lugar de usar props usaremos `useFormContext`
```tsx
import { useFormContext } from "react-hook-form"

// 1. Importa el tipo temporal que creaste en la vista
type FormFieldsTemporal = {
    type: "income" | "expense"
    date: string
    amount: number
    description: string
    incomeAccountId?: string
    expenseAccountId?: string
}

export default function MovementForm() {
    // 💡 Sintonizamos la frecuencia del FormProvider padre
    const { register, formState: { errors } } = useFormContext<FormFieldsTemporal>()

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Tipo de Movimiento */}
            <div>
                <label className="block text-sm font-medium text-obsidian mb-2">
                    Tipo de Movimiento
                </label>
                <select 
                    {...register("type")} // 👈 Conectamos con RHF
                    className="w-full p-3 border border-stone-200 rounded-lg focus:ring-sage focus:border-sage transition duration-150"
                >
                    <option value="income">Ingreso</option>
                    <option value="expense">Gasto</option>
                </select>
            </div>

            {/* Tag (Dummy temporal) */}
            <div>
                <label className="block text-sm font-medium text-obsidian mb-2">Tag</label>
                <select className="w-full p-3 border border-stone-200 rounded-lg focus:ring-sage focus:border-sage transition duration-150">
                    <option value="">-- Seleccionar Tag --</option>
                </select>
            </div>

            {/* Date and Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:col-span-2">
                <div>
                    <label className="block text-sm font-medium text-obsidian mb-2">Fecha</label>
                    <input 
                        type="date" 
                        {...register("date", { required: "La fecha es obligatoria" })} // 👈 Validación básica nativa
                        className="w-full p-3 border border-stone-200 rounded-lg focus:ring-sage focus:border-sage transition duration-150" 
                    />
                    {errors.date && <p className="text-red-500 text-xs mt-1">{String(errors.date.message)}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-obsidian mb-2">Monto ($)</label>
                    <input
                        type="number" 
                        step="0.01"
                        placeholder="Ej: 50.00" 
                        {...register("amount", { 
                            valueAsNumber: true, // Convierte el valor a número automáticamente
                            required: "El monto es obligatorio",
                            min: { value: 0.01, message: "El monto debe ser mayor a cero" }
                        })} 
                        className="w-full p-3 border border-stone-200 rounded-lg focus:ring-sage focus:border-sage transition duration-150" 
                    />
                    {errors.amount?.message && (<p className="text-red-500 text-xs font-semibold mt-1">{errors.amount.message}</p>)}
                </div>
            </div>

            {/* Accounts Relation */}
            <div>
                <label className="block text-sm font-medium text-obsidian mb-2">Cuenta Ingreso</label>
                <select 
                    {...register("incomeAccountId")}
                    className="w-full p-3 border border-stone-200 rounded-lg focus:ring-sage focus:border-sage transition duration-150"
                >
                    <option value="">-- Seleccionar --</option>
                    <option value="uuid-cuenta-1">EFECTIVO</option>
                    <option value="uuid-cuenta-2">BBVA</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-obsidian mb-2">Cuenta Egreso</label>
                <select 
                    {...register("expenseAccountId")}
                    className="w-full p-3 border border-stone-200 rounded-lg focus:ring-sage focus:border-sage transition duration-150"
                >
                    <option value="">-- Seleccionar --</option>
                    <option value="uuid-cuenta-1">EFECTIVO</option>
                    <option value="uuid-cuenta-2">BBVA</option>
                </select>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-obsidian mb-2">Descripción</label>
                <textarea 
                    placeholder="Detalles del movimiento (Ej: Pago de renta, Venta freelance)." 
                    {...register("description", { maxLength: { value: 200, message: "Máximo 200 caracteres" } })}
                    className="w-full p-3 border border-stone-200 rounded-lg focus:ring-sage focus:border-sage transition duration-150" 
                />
                {errors.description && <p className="text-red-500 text-xs mt-1">{String(errors.description.message)}</p>}
            </div>
        </div>
    )
}
```
</details>