
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
