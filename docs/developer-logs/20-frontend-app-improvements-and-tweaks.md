
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
