
# 📓 Phase 20: APP IMPROVEMENTS AND TWEAKS

---
**[2026-09-30] toast notifications**

<details>

1. instalamos la biblioteca react-tostify
    -pnpm add react-tostify

2. vamos al archivo main.tsx ya que tenemos que importar los estilos de react-tostify es importante importarlos andes del index.css 
    - import 'react-toastify/dist/ReactToastify.css'

3. el el router.tsx vamos a montar el container lo vamos a hacer antes de las Routes despues de BrowserRoutes
    <BrowserRouter>
                <ToastContainer
                    position="top-right"
                    autoClose={3000}
                    newestOnTop
                    closeOnClick
                    pauseOnHover
                    theme="light"
                />
                <Routes>

4. vamos a ubicar los toast dentro de los hooks usequery, primero en useCreateMovement del archivo useMovements.ts 
    -en onSuccess: toast.success("Movimiento creado con éxito")
    - en onError toast.error(error.message)

5. hacemos lo propio con el hook useCreateTag del archivo useTags.ts 
    - en onSuccess añadir toast.success("Etiqueta creada con éxito")
    - para el caso de los tags todo el bloque onError
        onError: (error) => {
            toast.error(error.message)
        }

6. vamos al archivo index.css donde vamos a personalizar los colores del toast con unos más acordes al diseño
    - despues del bloque @theme
        ```css
        /* Toast notifications */
        .Toastify__toast--success {
            background: var(--color-green-balance-opaque);
            color: var(--color-obsidian);
        }

        .Toastify__toast--error {
            background: var(--color-ritual-red-opaque);
            color: var(--color-obsidian);
        }
        ```
</details>

--- 


**[2026-10-02] Tag validation in MovementForm**

<details>

1. en MovementForm los inputs respetan el patrón `disabled={!movementType}` TagPicker aun no cuenta con esa validacion tanto los chips como el boton 'crear tag' el usuario puede seleccionar tag antes de definir movimiento, para el caso de los tags estos no deben resetearse al cambiar type como en el caso de las cuentas, por lo que el cambio se limita al estado disabled sin tocar lógica de datos.

2. vamos al archivo MovementForm.tsx ya que necesitamos pasar via props el disabled por movementType
    ```ts 
    <TagPicker onCreateTag={openCreateTag} disabled={!movementType} />
    ```
3. vamos a TagPicker.tsx
    - recibimos el props
    ```tsx
    interface TagPickerProps {
    onCreateTag?: () => void
    disabled?: boolean
    }
    ```
    - desestructuramos props en la firma
    ```tsx
    export default function TagPicker({ onCreateTag, disabled }: TagPickerProps) {
    ```
    - trabajamos con los chips, agregamos en los className una codigo condicional dependiente de disabled, y agregamos el atributo disabled
    ```tsx
    ${disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer'
        }
    disabled={disabled}
    ```
    - damos al boton 'crear Tag el mismo tratamiento'
    ```tsx
    <button
    type="button"
    onClick={onCreateTag}
    disabled={disabled}
    className={`text-xs font-medium px-3 py-1.5 mt-2 border rounded-md
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    `}
>
    ```

</details>

--- 

**[2026-10-03] Refactor TagPicker rediseño boton 'crear tag' y fix empty state**

<details>

1. el primer paso es eliminar el empty state ya que este no renderiza el botón 'crear tag' tendremos un empty state pero lo tendremos dentro de un div pricipal y lo mostraremos de forma condicional al resto del componente. La linea a eliminar:
    ```tsx 
    if (!tags?.length) return <p className="text-sm text-clay-gray">No hay tags disponibles</p>

    ```
2. cambiamos los fragments por un div en este contendremos en mensaje de estado vacio (condicional) y un contenedor flex con los chips y el boton 
    ```tsx 
    return (
        <div>
            {/* Mensaje de estado vacío — antes era un return temprano que ocultaba el botón */}
            {!tags?.length && (
                <p className="text-sm text-clay-gray mb-2">
                    No hay tags disponibles todavía
                </p>
            )}

            <div className="flex flex-wrap gap-2">
                {tags?.map(tag => {
    ```
3. finalmente creamos un nuevo diseño para el boton 'crear tag' dentro del mismo flex container la principal diferencia es que ahora este botón es una chip mas del grupo y no un bloque aparte y ya tiene elementos de interaccion como hovers y focus.
    ```tsx
    {onCreateTag && (
        <button
            type="button"
            onClick={onCreateTag}
            disabled={disabled}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-dashed transition-all
                ${disabled
                    ? 'border-clay-gray text-clay-gray opacity-50 cursor-not-allowed'
                    : 'border-green-balance text-green-balance hover:bg-sage-opaque focus-visible:ring-2 focus-visible:ring-green-balance focus-visible:ring-offset-1 cursor-pointer'
                }
                `}
            >
                <Plus className="w-3 h-3" />
                    Crear Tag
        </button>
    )}
    ```

</details>


**[2026-10-04] Bug TagPicker submit propagación**

<details>

1. se identificó un bug, al hacer el tag submit el evento se propagaba al formulario que tenia por encima MovementForm, se creaba un tag exitosa o erroneamente y los demas inputs del formulario movement se activaba la validación y mostraba el error, y es un comportamiento que hay que solucionar 

2. vamos a nuestro archivo TagForm vamos a importar el type de nuestro evento submit
    ```tsx
    import type { SubmitEvent } from "react"
    ```
3. lo que vamos a hacer es crear una función aparte donde podamos manejar el evento y nuestra funcion submit, de manera que primero detenemos la propagación y segundo disparamos el submit 
    ```tsx
    const handleFormSubmit = (e: SubmitEvent<HTMLFormElement>) => {
        e.stopPropagation()
        handleSubmit(onSubmit)(e)
    }
    ```
4. finalmente pasamo esa funcion al form 
    ```tsx
    <form onSubmit={handleFormSubmit} noValidate className="space-y-5">
    ```

</details>
