# 📓 Phase 7: API AXIOS/REACT QUERY

Este archivo registra el proceso de configuración de la capa de servicios que se encargaran de hacer los llamados a la REST API, asi como la configuración de Tanstack react-query que nos permitira llevar esos consumos a las vistas y componentes

---

## 📦 Vite init, Tailwind & RRD

### 🎯 Objective
Configurar la capa base de servicios

---

### 🛠️ Sub-parte 1: AXIOS

<details>

*   **Status:** ✅ Completed
*   **Timestamp:** 02/06/2026

#### 📝 Crónica de la Sesión & Decisiones Técnicas
El objetivo de esta subparte es centralizar el llamado a la rest api mediante axios 

**Steps & Commands:**

1. creamos el archivo `src/lib/axios.ts`
2. realizamos la instalación de axios
    ```bash
    cd frontend
    pnpm add axios
    ```
3. vamos al archivo, importamos axios y creamos una instancia con el metodo create
    ```typescript
    import axios from "axios"

    const api = axios.create({
        baseURL: import.meta.env.VITE_API_URL, //👈​ a continuacion crear esta variable de entorno
    })

    export default api
    ```
4. en el root de /frontend creamos el archivo .env.local, y creamos la variable de entorno siguiendo la convención de vite
    ```
    VITE_API_URL=http://localhost:3000/api
    ```
5. realizamos la conexión proxy-api
    ```typescript
    //vite.config.ts
    //en el objeto defineConfig despues de los pluggins escribimos
    server:{
        proxy:{
        // Cada vez que en tu frontend pidas algo que empiece con /api...
            '/api':{
                target: 'http://localhost:3000',// ...Vite lo redirigirá al backend
                changeOrigin: true,
            }
        }
    }
    ```
    ```typescript
    //axios.ts
    //cambiamos el baseUrl para que apunte a /api
    import axios from "axios"

    const api = axios.create({
        // En desarrollo usa el proxy "/api", en producción usará la variable de entorno real
        baseURL: import.meta.env.PROD ? import.meta.env.VITE_API_URL : "/api"
    })

    export default api
    ```
</details>

---

