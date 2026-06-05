# 📓 Phase 8: ZOD SCHEMA & API SERVICE

Este archivo registra el proceso de creación del archivo types que contiene el zod schema que usaremos para obtener todos los movimientos

---


### 🎯 Objective
Configurar la capa de servicios api, en este avance puntualmente solo vamos a avancer con el servicio GET para obtener todos los movimientos

---

### 🛠️ Sub-parte 1: MovemetType constant, TYPES & ZOD SCHEMA

<details>

*   **Status:** ✅ Completed
*   **Timestamp:** 03/06/2026

#### 📝 Crónica de la Sesión & Decisiones Técnicas
El objetivo de esta subparte es crear un archivo centralizado para los types y zod schemas y crear una base que nos permita poder consumir con react-query 

**Steps & Commands:**

1. creamos 2 archivos `src/constants/movementTypes.ts` y `src/types/index.ts`

2. vamos primero con `constants/movementTypes.ts` porque vamos a necesitar limitar nuestras opciones al momento de escoger que tipo de movimiento lo usaremos mas adelante en la construcción del formulario
    ```typescript
    //movementType.ts
    import type { MovementType } from "@/types"

    export const MOVEMENT_TYPES: Record<MovementType, { label: string }> = {
        INCOME: {
            label: 'Ingreso',
        },
        EXPENSE: {
            label: 'Gasto',
        },
        DEPOSIT: {
            label: 'Depósito',
        },
        WITHDRAWAL: {
            label: 'Retiro',
        },
        TRANSFER: {
            label: 'Transferencia',
        },
    } as const
    ``` 
3. realizamos la instalación de zod
    ```bash
    cd frontend
    pnpm add zod
    ```
4. ahora si vamos a `src/types/index.ts` para los types y zod schemas
    ```typescript
    import { z } from 'zod'

    /*Account*/
    // Esquema temporal de soporte para Account
    export const accountSchema = z.object({
        id: z.string().uuid(),
        name: z.string()
    })

    /*Movements*/
    // 1. Esquema del Tipo de Movimiento alineado al Backend (Prisma Enums)
    export const movementTypeSchema = z.enum(["INCOME", "EXPENSE", "DEPOSIT", "WITHDRAWAL", "TRANSFER"], {
        message: "Selecciona un tipo de movimiento válido"
    })
    // Extraemos el tipo puro directamente de Zod: "INCOME" | "EXPENSE" | etc.
    export type MovementType = z.infer<typeof movementTypeSchema>

    // 2. Esquema Core de un Movimiento (Estructura de la API)
    export const movementSchema = z.object({
        id: z.string().uuid(),
        type: movementTypeSchema,
        date: z.string().datetime(),//ISO string
        amount: z.coerce.number().positive("El monto debe ser mayor a cero"),
        description: z.string().max(200, "La descripción es demasiado larga").optional(),
        incomeAccount: accountSchema.optional(),
        expenseAccount: accountSchema.optional(),
        tags: z.array(z.string()).default([])
    })

    // 3. Esquema para colecciones de datos (GET response)
    export const movementListSchema = z.array(movementSchema)

    // 4. Inferencia de Tipos de TypeScript purificados
    export type MovementList = z.infer<typeof movementListSchema>
    export type Movement = z.infer<typeof movementSchema>
    ```
</details>

---

### 🛠️ Sub-parte 2: MovementAPI.ts y Manejo de Errores

<details>

*   **Status:** ✅ Completed
*   **Timestamp:** 03/06/2026

#### 📝 Crónica de la Sesión & Decisiones Técnicas
El objetivo de esta subparte es crear un servicio get para mostrar los Movements, asi como una función encargada del manejo de los errores.

**Steps & Commands:**

1. empezamos creando el archivo `src/api/MovementAPI.ts` en este archivo crearemos los servicios relacionados a nuestros endpoints Movement api

2. comenzamos crando el service get para todos los movimientos la funcionse llamara `getMovements`
    ```typescript
    import api from "@/lib/axios"
    import { movementListSchema, type MovementList } from "@/types"

    export const MovementAPI = {
        /** 
        *PARA MovemetAPI USAMOS EL PATRÓN DE OBJETO CON METODOS 
        * obtener la colección completa de movimientos desde el backend
        * validando las respuestas con Zod para asegurar la integridad de los datos en el frontend
        */
        getMovements: async(): Promise<MovementList> => {
            try {
                const {data} = await api.get("/movements")
                //validamos la estructura exacta que viene del backend
                const response = movementListSchema.safeParse(data)
                if(!response.success){
                    if(import.meta.env.DEV){
                        console.error('⚠️ [Zod Validation Error]:', response.error.format())
                    }
                    //lanzamos un error explicito si la validación falla, para que el frontend pueda manejarlo adecuadamente
                    throw new Error("data received from the server does not match the expected format")
                }
                return response.data
            } catch (error) {
                console.error('❌ [API Error]:', error)
                throw error
            }
        }
    }
    ```
3. lo siguiente es crear una función para el manejo de los errores especialmente los que vienen del servidor, la haremos en un archivo `src/api/handleApiErrors.ts`
    ```typescript
    import { isAxiosError } from "axios"

    type ValidationError = {
        location: string
        msg: string
        path: string
        type: string
        value: string
    }

    type ErrorResponse = {
        error?: string
        message?: string
        errors?: ValidationError[]
    }

    /**
    * Intercepta, procesa y unifica los errores de red (Axios) y de tiempo de ejecución
    * para entregar un mensaje de error limpio a TanStack React Query.
    */
    export function handleApiError(error: unknown, context: string, sentData?: unknown): never {
        // Debugging logs estructurados solo en desarrollo
        if (import.meta.env.DEV) {
            console.group(`🔴 [API Error Context]: ${context}`)
            if (sentData) console.log('Data sent to API:', sentData)
        }

        // Tipamos de forma segura el interceptor de Axios usando su genérico interno
        if (isAxiosError<ErrorResponse>(error)) {
            if (error.response) {
                if (import.meta.env.DEV) {
                    console.log('Status HTTP:', error.response.status)
                    console.log('Response payload:', error.response.data)
                    console.groupEnd()
                }

                const responseData = error.response.data
                
                // Extracción segura y priorizada de mensajes de error del backend
                const errorMessage = 
                    (typeof responseData === 'object' && responseData !== null)
                        ? (responseData.errors?.[0]?.msg || responseData.error || responseData.message)
                        : null
                
                throw new Error(errorMessage || `Error ${error.response.status}: ${error.response.statusText}`)
            }

            if (error.request) {
                if (import.meta.env.DEV) {
                    console.log('No response received from server')
                    console.groupEnd()
                }
                throw new Error('No se pudo establecer conexión con el servidor de MonkFlow')
            }
        }

        if (import.meta.env.DEV) {
            console.log('Runtime or Unknown error:', error)
            console.groupEnd()
        }

        throw new Error(error instanceof Error ? error.message : 'Ocurrió un error inesperado')
    }
    ```
    ahora conectamos en el catch de nuestro metodo `getMovements` (importante decir que la podremos usar en los demas metodos que crearemos)
    ```typescript
    catch (error) {
        // Pasamos el error y el contexto explícito para tus logs del modo dev
        handleApiError(error, "MovementAPI.getMovements") 
    }
    ```

</details>

---

### 🛠️ Sub-parte 3: CUSTOM HOOK useMovements

<details>

*   **Status:** ✅ Completed
*   **Timestamp:** 04/06/2026

#### 📝 Crónica de la Sesión & Decisiones Técnicas
El objetivo de esta subparte es abstraer la lógica de TanStack Query dentro de un Custom Hook personalizado. Optamos por un diseño de **desestructuración y purificación de retorno** en lugar de exponer el objeto Query crudo. Esto encapsula la infraestructura de red, formatea los tipos de error hacia la vista y permite un consumo directo y semántico en los componentes de la interfaz.

**Steps & Commands:**

1. empezamos creando el archivo `src/hooks/useMovements.ts` la idea de momento es construir una función que consuma nuestro servicio `getMovements`
    ```typescript
    import { useQuery } from '@tanstack/react-query'
    import { MovementAPI } from '@/api/MovementAPI'
    
     export const useMovements = () => {
        //haremos una instancia de useQuery, pero que contiene?
        // data: contiene lo que retorna tu función getMovements (los movimientos ya validadas por Zod)
        // isLoading: true mientras la promesa de axios está pendiente
        // isError: true si axios o Zod lanzaron un throw
        // error: el objeto de error con el mensaje que definimos en el catch
        const {data, isLoading, isError, error} = useQuery({
            queryKey: ['movements'], //identificador unico para el cache
            queryFn: MovementAPI.getMovemets //el servicio
        })
        return {
            data,
            isLoading,
            isError,
            // Homologamos el mensaje extraído por nuestro controlador central de errores
            errorMessage: error instanceof Error ? error.message : null
        }
     }
    ```

</details>

---

### 🛠️ Sub-parte 4: SMOKE TEST

<details>

*   **Status:** ✅ Completed
*   **Timestamp:** 04/06/2026

#### 📝 Crónica de la Sesión & Decisiones Técnicas
El objetivo de esta subparte fue realizar una prueba de humo (Smoke Test) para estresar el funcionamiento integrado de toda la capa lógica (Servicio API, tipados nativos, esquemas Zod de validación, Custom Hook y el manejador centralizado de excepciones). La sesión demostró el valor de la programación defensiva al capturar discrepancias críticas de nulidad entre la base de datos y el cliente en tiempo de ejecución.

**Steps & Commands:**

1. **Prueba 1: Render de Éxito & Validación en Tiempo de Ejecución**  
   Montamos un renderizado de prueba provisional en `src/views/DashboardView.tsx` consumiendo las propiedades desestructuradas del Custom Hook:
```tsx
import { useMovements } from "@/hooks/useMovements"

export default function DashboardView() {
    const { movements, isLoading, isError, errorMessage } = useMovements()

    if (isLoading) return <div className="p-6 text-sage animate-pulse">Cargando flujos de MonkFlow...</div>
    
    if (isError) return <div className="p-6 text-rose-500 font-semibold">🚨 Error: {errorMessage}</div>

    return (
        <div className="p-6 bg-stone-50 min-h-screen">
            <h1 className="text-2xl font-bold text-obsidian mb-4">Smoke Test: Capa de Lógica</h1>
            <pre className="bg-white p-4 border border-stone-200 rounded-lg overflow-auto max-h-96 text-xs text-stone-700">
                {JSON.stringify(movements, null, 2)}
            </pre>
        </div>
    )
}
```
*   **Resultado Inicial:** 🚨 Fallido por validación defensiva de Zod.  
*   **Diagnóstico:** El registro #4 de la base de datos correspondía a un `EXPENSE`, devolviendo la relación `incomeAccount: null`. Nuestro esquema original usaba `.optional()`, lo cual acepta valores ausentes (`undefined`) pero rechaza explícitamente los `null` enviados por Prisma.
*   **Solución:** Ajustamos el modelo en `src/types/index.ts` incorporando `.nullable()` para absorber correctamente el comportamiento de la base de datos relacional de Neon:
```typescript
    export const movementSchema = z.object({
        id: z.string().uuid(),
        type: movementTypeSchema,
        date: z.string().datetime(),
        amount: z.coerce.number().positive("El monto debe ser mayor a cero"),
        description: z.string().max(200, "La descripción es demasiado larga").optional().nullable(),
        incomeAccount: accountSchema.optional().nullable(), // 👈 Permite tanto undefined como null
        expenseAccount: accountSchema.optional().nullable(), // 👈 Permite tanto undefined como null
        tags: z.array(z.string()).default([])
    })
```
*   **Segundo Intento:** ✅ Exitoso. Los datos fluyeron limpios al componente en formato JSON.

2. **Prueba 2: Simulación de Errores del Servidor (Capa de Excepciones)**  
   Forzamos intencionalmente un código de estado `HTTP 400` en el controlador del backend devolviendo un payload `{ error: "Acceso denegado o parámetros incorrectos" }`.
    *   **Resultado:** ✅ Exitoso. La interfaz interceptó el error imprimiendo el string amigable, y la consola del navegador agrupó limpiamente los detalles técnicos (`Status`, `Payload` y `Contexto`) gracias a la lógica estructurada con `console.group` en nuestro archivo `handleApiErrors.ts`.

</details>

