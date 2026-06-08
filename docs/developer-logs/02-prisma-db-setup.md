# 📓 Phase 2: PRISMA AND DB SETUP

En esta fase del proyecto creamos un servicio serverless en Neon para nuestra db postgressql, haremos las configuraciones necesarias de prisma 6 y un schema básico de Account y finalmente haremos la conexión entre nuestro server y la db

---
## 📦 Neon connection string, prisma, server connection

### 🎯 Objective
Tener lista la base de datos junto con su conexión al server para empezar a recibir información 

---

### 🛠️ Sub-parte 1: Crear DB Neon serverless

<details>

*   **Status:** ✅ Completed
*   **Timestamp:** 22/05/2026

#### 📝 Crónica de la Sesión & Decisiones Técnicas
El objetivo primordial de estas sesión fue crear desde el dashboard de Neon un nuevo proyecto y conseguir el string connection necesario para la conexión remota.

**Steps & Commands:**

1. Vamos al sitio web de `Neon` desde el dashboard damos click en "crear nuevo proyecto" dejamos todas las opciones por default, es importante no activar "neon auth"
2. copiamos el `connection string` y lo pegamos en un lugar seguro de forma provisional mientras creamos la variable de entorno, recordar que es una información sensible por lo que hay que manejarla con mucha responsabilidad.

</details>

---

### 🛠️ Sub-parte 2: Prisma & Account schema

<details>

*   **Status:** ✅ Completed
*   **Timestamp:** 22/05/2026

#### 📝 Crónica de la Sesión & Decisiones Técnicas
El objetivo de estas sesión fue hacer las instalaciones e inicializaciones de prisma orm asi como nuestro primer model `Account`

**Steps & Commands:**

1. se tomo la desición de usar `prisma 6` y se procedió a su instalación
    ```bash
    pnpm add -D prisma@6
    pnpm add @prisma/client@6
    pnpm prisma init
    ```
2. al hacer el init se nos crearan varios archivos entre ellos la carpeta `/prisma` importante porque contiene nuestro archivo `schema.prisma`, igualmente se crea el archivo `.env` donde vamos a guardar nuestra variable de entorno con el connection string de Neon
    ```
    DATABASE_URL="Neon connection string"
    ```
3. Llegó el momento de armar el primer model `Account`
    ```
    generator client {
    provider = "prisma-client-js"
    }

    datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
    }

    // 1. Definición del Enum nativo en Postgres ya que solo permitiremos 2 tipos de cuenta
    enum AccountKind {
    CASH
    BANK
    }

    // 2. Definición del Modelo Account
    model Account {
    id        String      @id @default(uuid())
    name      String      
    kind      AccountKind
    balance   Float       @default(0)
    createdAt DateTime    @default(now())
    updatedAt DateTime    @updatedAt

    @@map("accounts") // Esto renombra la tabla en la base de datos a minúsculas, una buena práctica en Postgres
    }
    ```
4. Teniendo esto listo ya podemos ejecutar el comando generate y db push, despues de esto podemos ir a revisar en nuestro proyecto en neon en la seccion de tables si se está generando correctamente.
    ```bash
    pnpm prisma generate
    pnpm prisma db push
    ```
</details>

---

### 🛠️ Sub-parte 3: DB-server connection

<details>

*   **Status:** ✅ Completed
*   **Timestamp:** 22/05/2026

#### 📝 Crónica de la Sesión & Decisiones Técnicas
El objetivo de esta sesión fue crear nuestra función de conexión entre la db y el server

**Steps & Commands:**

1. instalamos una libreria para colores en la terminal que nos permita dejar mensajes con mejor contraste y más visibles.
    ```
    pnpm add colors
    ```
2. Creamos el archivo `src/config/db.ts` aquí crearemos la función
    ```typescript
    import { PrismaClient } from '@prisma/client'
    import colors from 'colors'

    // Tipamos el objeto global de Node para que TypeScript no se queje
    const globalForPrisma = global as unknown as { prisma: PrismaClient }

    // Si ya existe una instancia global, la reutilizamos; si no, creamos una nueva
    export const prisma = globalForPrisma.prisma || new PrismaClient()

    if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

    export async function connectDB() {
        try {
            await prisma.$connect()
            console.log(colors.blue.bold('✅ Conexión exitosa a la Base de Datos (Neon Postgres)')) //usamos colors para los mensajes
        } catch (error) {
            console.error(colors.red.bold('❌ Error al conectar a la Base de Datos:'), error)
            process.exit(1) // Detiene por completo la ejecución del servidor
        }
    }

    export default prisma
    ```
3. ejecutamos connectDB en index.ts creando la función asincrona startServer, respecto a la version anterior de index.ts notar que tambien creamos una constante para el PORT
    ```typescript
    import server from "./server.js"
    import { connectDB } from "./config/db.js"
    import colors from 'colors'

    const PORT = process.env.PORT || 3000 //constante que maneja mejor el puerto

    async function startServer() {
        //asegurar el canal de datos antes de iniciar el servidor
        await connectDB()

        //si la conexión es exitosa, iniciamos el servidor
        server.listen(PORT, () => {
            console.log(colors.green.bold(`Server is running on port ${PORT}`))
        })
    }

    startServer() //ejecutar
    ```
4. finalmente haremos un pequeño cambio al script "dev" de nuestro `package.json` para  que node pueda leer las variables de entorno cada que se actualiza
    ```json
    "dev": "tsx --watch --env-file=.env src/index.ts"
    ```
</details>