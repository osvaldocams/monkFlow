# 📓 Phase 1: Cimientos e Infraestructura

Este archivo registra el proceso de configuración inicial del entorno, la arquitectura del monorepositorio y el levantamiento del servidor base en sesiones atómicas de 45 minutos.

---

## 📦 Hito 1: Backend Setup, Monorepo & Express Server

### 🎯 Objective
Configurar el entorno base del backend con TypeScript moderno (ESM), estructurar el monorepositorio con Git y levantar un servidor Express funcional como punto de partida.

---

### 🛠️ Sub-parte 1: Node.js & TypeScript Setup
<details>

*   **Status:** ✅ Completed
*   **Timestamp:** 19/05/2026 — Bloque matutino de infraestructura.

#### 📝 Crónica de la Sesión & Decisiones Técnicas
El objetivo primordial de estas sesiones fue levantar la infraestructura base de **MonkFlow** desde cero. Decidí arrancar el `/backend` utilizando **pnpm** 

La meta principal del entorno fue establecer **ESM (ECMAScript Modules)** nativo junto con TypeScript estricto. Esto nos alinea con los estándares actuales de la industria y previene discrepancias de sintaxis cuando acoplemos el frontend más adelante. Al usar `NodeNext` en la resolución de módulos, nos obligamos a una disciplina rigurosa (como usar extensiones `.js` explícitas en los `imports`).

**Steps & Commands:**
1. Crear estructura raíz `/monkFlow` y la carpeta `/backend`.
2. Inicializar Node de forma eficiente:
   ```bash
   pnpm init
   ```
3. Crear directorio `/src` con los archivos iniciales `index.ts` y `server.ts`.
4. Instalar TypeScript y el ejecutor en tiempo de desarrollo:
```bash
   pnpm add -D typescript tsx @types/node @tsconfig/node22
   ```
   **Critical Configurations:**

* **`package.json`:** Configurado para soportar ESM (*ECMAScript Modules*) nativo y scripts de ejecución rápida.
```json
{
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx --watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```
* **`tsconfig.json`:** Configuración estricta extendida de Node 22 usando NodeNext para garantizar compatibilidad total con módulos modernos.
```json
{
  "extends": "@tsconfig/node22/tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "skipLibCheck": true,
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  },
  "include": ["src/**/*.ts"]
}
```
5. finalmente instalamos los types
```bash
pnpm add -D @types/node
```
</details>

---

### 🛠️ Sub-parte 2: git & github Setup
<details>

*   **Status:** ✅ Completed
*   **Timestamp:** 20/05/2026 — Bloque matutino de infraestructura.

#### 📝 Crónica de la Sesión & Decisiones Técnicas
Se estructuró el monorepositorio controlando qué archivos se sincronizan con la nube. Diseñé un archivo `.gitignore` estricto en la raíz para aislar los entornos locales (`node_modules`), las variables de entorno críticas (`.env`) y la configuración personal del editor (`.vscode`), protegiendo la seguridad del proyecto desde el día uno.

Se renombró la rama por defecto a `main` para alinearse con los estándares modernos de la industria y evitar conflictos de sincronización con el servidor remoto.

**Steps & Commands:**
1. Crear el archivo `.gitignore` y la raiz del proyecto `/monkFlow`.
2. Escribimos esta configuracion inicial:
  ```md
  # -------------------------
  # Dependencias Globales y Locales
  # -------------------------
  node_modules/
  .pnpm-debug.log*

  # -------------------------
  # Builds (Resultado de la compilación)
  # -------------------------
  dist/
  build/
  .next/
  out/

  # -------------------------
  # Variables de Entorno
  # -------------------------
  .env
  .env.local
  .env.*.local

  # -------------------------
  # Directorios de Configuración Personal & Editores
  # -------------------------
  .vscode/
  .idea/
  *.suo
  *.ntvs*
  *.njsproj
  *.sln
  *.swp

  # -------------------------
  # Archivos de Logs, Caché y Temporales
  # -------------------------
  *.log
  npm-debug.log*
  yarn-debug.log*
  yarn-error.log*
  pnpm-debug.log*
  .eslintcache

  # -------------------------
  # Prisma (Específico para el Backend)
  # -------------------------
  *.db
  *.db-journal

  # -------------------------
  # Herramientas de Desarrollo (REST Clients)
  # -------------------------
  *.http
  backend/*.http
  ```
3. Inicializar git:
  ```bash
    git init
  ```
4. añadimos a stage y creamos nuestro primer commit
```bash
git add .
git commit -m "chore: setup initial monorepo structure and gitignore" 
```
5. creamos un nuevo repositorio en `github` es importante que se desactiven las opciones de añadir `README` y `.gitignore` ya que esos archivos los construimos manualmente
6. hacemos la conexión del repositorio local con el repositorio remoto de `github`
```bash
git remote add origin git@github.com:osvaldocams/monkFlow.git
git push -u origin main
```
---

**⚡ Próxima Sesión: Express Server Setup:**
- [ ] crear el archivo de templates docs/templates/git-github.md
- [ ] hacer el template para new brench, new branch first commit y pull request guide
- [ ] iniciar la sesion echando vistazos al notion handbook
- [ ] hacer el PR y merge de esta rama
- [ ] preparar la siguiente sesion, que es inicio de phase
</details>

---
### 🛠️ Sub-parte 3: Express server
<details>

*   **Status:** ✅ Completed
*   **Timestamp:** 21/05/2026 — Bloque matutino de infraestructura.

#### 📝 Crónica de la Sesión & Decisiones Técnicas
Se estructuró el monorepositorio controlando qué archivos se sincronizan con la nube. Diseñé un archivo `.gitignore` estricto en la raíz para aislar los entornos locales (`node_modules`), las variables de entorno críticas (`.env`) y la configuración personal del editor (`.vscode`), protegiendo la seguridad del proyecto desde el día uno.

Se renombró la rama por defecto a `main` para alinearse con los estándares modernos de la industria y evitar conflictos de sincronización con el servidor remoto.

**Steps & Commands:**
1. Realizamos la instalación de express y de sus types
  ```bash
    pnpm add express
    pnpm add -D @types/express
  ```
2. en el archivo `backend/src/server.ts` importamos express y hacemos su instancia, exportamos default
  ```typescript
  import express from "express"

  const server = express()

  export default server
  ```
3. vamos al archivo `backend/src/index.ts` para levantar el server, importamos la instancia de express y usamos el metodo listen.
  ```typescript
  import server from "./server.js"

  server.listen(3000, () => {
      console.log("Server is running on port 3000")
  })
  ```
4. volvemos a `server.ts` y creamos un pequeño routing a manera de test
  ```typescript
  import express from "express"

  const server = express()

  //routing
  server.get("/", (req, res) => { //⬅️​test
      res.send("Hello World")
  })

  export default server
  ```
5. creamos una carpeta para los routers y nuestro primer archivo `src/routes/accountRoutes.ts` importamos `Router` de express y creamos una instancia que exportamos default, traemos a este archivo el test que teniamos en server.
  ```typescript
  import { Router } from "express"

  const router = Router()

  //routing
  router.get("/", (req, res)=>{ 
      res.send("Hello World")
  })

  export default router
  ```
6. conectamos con el server, para ello volvemos a `server.ts` importamos la instancia de Router, ya podemos borrar el test que teniamos anteriormente, lo ejecutamos despues de la instancia de express usando el metodo use, dandole la ruta correcta en este caso `/api/account`, finalmente antes del router y despues de express habilitamos la lectura json.
```typescript
  import express from "express"
  import router from "./routes/accountRoutes.js"

  const server = express()

  server.use(express.json()) //⬅️lectura json habilitada

  //routing
  server.use("/api/account", router) //⬅️nuestro router​


  export default server
```
7. en /backend creamos el archivo `requests.http` el cual ya tenemos ignorado en el gitignore y nos sirve para hacer pruebas usando la vscode extention `rest client` hacemos el test con el metodo get que tenemos en nuestro router y revisamos que la salida sea "hello world"
```
### ACCOUNTS
### GET ACCOUNTS

GET http://localhost:3000/api/accounts

***send Request => Hello world
```
</details>