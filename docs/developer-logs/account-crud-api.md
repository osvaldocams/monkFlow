# 📓 Phase 3: ACCOUNT CRUD API

En este bloque se trabajó el CRUD Account los endpoints POST GET GET(ALL) DELETE PUT, usaremos la arquitectura model view controller y express validator para la validación de los campos

---

## 📦 Account CRUD API

### 🎯 Objective
la finalidad es tener los endpoints de la rest api listos para ser consumidos en el cliente, en este caso account es un crud de la sección settings

---

### 🛠️ Sub-parte 1: MVC conexión

<details>

*   **Status:** ✅ Completed
*   **Timestamp:** 22/05/2026

#### 📝 Crónica de la Sesión & Decisiones Técnicas
El objetivo de esta sesión es poder realizar un test de comunicación entre el controlador y el router, para ello crearemos el archivo correspondiente `src/controllers/AccountControllers.ts` hacemos un controlador de test que ejecutaremos desde `accountRoutes.ts` lo llamaremos desde rest client esperando el mensaje de éxito.

**Steps & Commands:**

1. creamos `src/controllers/AccountController.ts` y escribimos el test:
    ```typescript
    import { Request, Response } from 'express'

    export class AccountControllers {
        static testConnection = async (req: Request, res: Response) => {
            res.json({ msg: 'MVC configurado correctamente!' })
        }
    }
    ```
2. vamos a `accountRoutes.ts` y creamos una ruta get solo para ejecutar el test:
    ```typescript
    router.get("/", AccountControllers.testConnection)
    ```
3. en el archivo `requests.http` vamos a realizar la prueba:
    ```
    GET http://localhost:3000/api/accounts

    **salida "msg": 'MVC configurado correctamente!'
    ```
</details>

---

