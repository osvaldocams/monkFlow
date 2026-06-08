# 📓 Phase 6: FRONTEND INITIAL SETTINGS

[DESCRIPCION EJEMPLO] Este archivo registra el proceso de configuración inicial del entorno del frontend, la inicialización de un proyecto con vite, instalación de tailwind y configuración de react-router-dom

---

## 📦 Vite init, Tailwind & RRD

### 🎯 Objective
Configurar el entorno base del frontend con vite, tener listos los archivos iniciales, tailwind y RRD

---

### 🛠️ Sub-parte 1: VITE & TAILWIND

<details>

*   **Status:** ✅ Completed
*   **Timestamp:** 28/05/2026

#### 📝 Crónica de la Sesión & Decisiones Técnicas
El objetivo de esta subparte es inicializar un proyecto para el frontend de MonkFlow usando `vite` en su configuración inicial con typescript, asi mismo haremos un reset de los archivos y la instalación de `tailwind` v4 

**Steps & Commands:**

1. nos ubicamos en la carpeta /monkFlow y ejecutamos el comando de inicio, el nombre de la carpeta `frontend`, elegimos `react` y `typescript`
```bash
    pnpm init vite@latest
```
2. hacemos una pequeña depuración de los archivos iniciales, archivos borrados `/assets` `App.css`, en cuanto a `App.tsx` e `index.css` no las borramos simplemente se elimina su contenido 
3. comenzamos con la instalacion de tailwind 4 que es bastante sencillo
```bash
    cd frontend
    pnpm add tailwindcss @tailwindcss/vite
```
```typescript
    import { defineConfig } from 'vite'
    import tailwindcss from '@tailwindcss/vite' //👈 ​importamos la dependencia de tailwind para vite

    export default defineConfig({
    plugins: [
        tailwindcss(), //👈​ lo ejecutamos en plugins
    ],
    })
```
```css
    /*index.css*/
    @import "tailwindcss"; /*👈​ importamos tailwind en nuestro archivo principal de css*/
```
```bash
    pnpm dev #👈​ reiniciamos servidor de desarrollo
```


</details>

---

### 🛠️ Sub-parte 2: REACT ROUTER DOM

<details>

*   **Status:** ✅ Completed
*   **Timestamp:** 02/06/2026

#### 📝 Crónica de la Sesión & Decisiones Técnicas
El objetivo de esta subparte es realizar las instalaciones y configuraciones de `react router dom` definir las rutas principales y arquitectura de carpetas de nuestro frontend 

**Steps & Commands:**

1. iniciamos con la instalación de react router dom
    ```bash
    pnpm add react-router-dom
    ```
2. creamos el archivo `src/router.tsx` e iniciamos la configuración de nuestro router
    ```tsx
    import { BrowserRouter, Routes, Route} from "react-router-dom" /*👈​importamos estas dependencias de rrd*/
    import AppLayout from "./layouts/AppLayout"
    import DashboardView from "./views/DashboardView"

    export default function Router() {
    return (
            <BrowserRouter> /*👈​creamos nuestro componente router y le damos esta estructura BrowserRoter/Routes/Route*/
                <Routes>
                    <Route element={<AppLayout />}> /*👈​ le damos como element un layout que a continuacion crearemos*/
                        <Route path="/" element={<DashboardView/>} index /> /*👈​ a DashboardView lo agregamos como hijo del layout como es pag principal el path es / agregamos como element el view que crearemos a continuación y agregamos index*/
                    </Route>
                </Routes>
            </BrowserRouter>
        )
    }
    ```
3. creamos el layout el archvio es `src/layouts/AppLayout.tsx`
    ```tsx
    import { Outlet } from "react-router-dom"

    export default function AppLayout() {
        return (
            <>
                <div>
                    AppLayout
                </div>
                <Outlet/> /*👈​agregamos de react router dom Outlet para que se muestre como layout*/
            </>
        )
    }
    ```
4. creamos el dashboard view `src/views/DashboardView.tsx` que de momento solo es un react component básico
    ```tsx
    export default function DashboardView() {
        return (
            <div>
                DashboardView
            </div>
        )
    }
    ```
5. finalmente vamos al `main.tsx` y renderizamos el router
    ```tsx
    import { StrictMode } from 'react'
    import { createRoot } from 'react-dom/client'
    import './index.css'
    import Router from './router'

    createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Router /> /*👈 en lugar de App ahora escribimos Router*/
    </StrictMode>,
    )
    ```
6. ya podemos eliminar `src/App.tsx`
</details>

---

### 🛠️ Sub-parte 3: CONFIGURACIÓN ALIASES

<details>

*   **Status:** ✅ Completed
*   **Timestamp:** 02/06/2026

#### 📝 Crónica de la Sesión & Decisiones Técnicas
El objetivo de esta subparte es realizar la configuración de alias para /src de esta forma evitamos la escritura de rutas complicadas

**Steps & Commands:**

1. iniciamos instalando la dependencia de vite para rutas con typescript
    ```bash
    pnpm add -D vite-tsconfig-paths
    ```
2. importamos y ejecutamos el plugin en el archivo `vite.config.json`
    ```json
    import { defineConfig } from 'vite'
    import react, { reactCompilerPreset } from '@vitejs/plugin-react'
    import babel from '@rolldown/plugin-babel'
    import tailwindcss from '@tailwindcss/vite'
    import tsconfigPaths from 'vite-tsconfig-paths' /*👈​ importamos el plugin*/

    // https://vite.dev/config/
    export default defineConfig({
    plugins: [
        tailwindcss(),
        tsconfigPaths(), /*👈 lo ejecutamos*/​
        react(),
        babel({ presets: [reactCompilerPreset()] })
    ],
    })
    ```
3. ahora vamos al archivo tsconfig.app.json para añadir las propiedades de baseUrl y paths dentro del objeto compilerOptions
    ```typescript
    "compilerOptions": {
        "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
        "target": "es2023",
        "lib": ["ES2023", "DOM"],
        "module": "esnext",
        "types": ["vite/client"],
        "skipLibCheck": true,
        /* 🎯 AÑADIR ESTAS LÍNEAS AQUÍ ABAJO */
        "baseUrl": ".", 
        "paths": {
        "@/*": ["./src/*"]
        }
    },
    ```
</details>