# 📓 Phase 5: CORS CONFIG

Este archivo registra el proceso de configuración de CORS, creando una white list que permita al frontend acceso a la REST API

---
### SUB HEADER
## 📦 CORS config

### 🎯 Objective
el objetivo es crear ese puente que conceda los permisos al frontend del uso de la REST API

---

### 🛠️ Sub-parte 1: CORS config

<details>

*   **Status:** ✅ Completed
*   **Timestamp:** 25/05/2026

#### 📝 Crónica de la Sesión & Decisiones Técnicas
El objetivo primordial de estas sesiones es dejar listas las configuraciones de CORS listas dejando el camino libre para su usa en el frontend

**Steps & Commands:**

1. empezamos con la instalación de nuestra librería CORS y sus types
    ```bash
    cd backend
    pnpm add cors
    pnpm add -D @types/cors
    ```
2. creamos el archivo de configuración `src/config/cors.ts`
    ```typescript
    //definimos los origenes permitidos
    const whitelist = [
        process.env.FRONTEND_URL, //URL de producción (ej. Render/Vercel)
        'http://localhost:5173',   // URL local de Vite
    ].filter(Boolean) as string[]

    export const corsConfig: CorsOptions = {
        origin: (origin, callback) => {
            // En desarrollo, permitimos peticiones sin 'origin' (como Postman o Server-to-Server)
            if (!origin) {
                return callback(null, true);
            }

            if (whitelist.includes(origin)) {
                return callback(null, true);
            } else {
                // Error descriptivo para debuggear rápido en la terminal
                return callback(new Error(`CORS Error: Origin ${origin} is not allowed by whitelist`));
            }
        },
        optionsSuccessStatus: 200
    };
    ```
3. finalmente vamos a `server.ts` y ejecutamos cors (justo depues de la instancia de express)
    ```typescript
    server.use(cors(corsConfig)) //importamos cors y corsConfig y ejecutamos
    ```

</details>