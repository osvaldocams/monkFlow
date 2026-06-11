# 📓 Phase 10: ACCOUNT CATALOG

Este archivo registra el proceso de consumo del endpoint GET /accounts de nuestra REST API, con la finalidad de nutrir los selectores dinámicos que conforman el formulario de movimientos. Implementaremos el flujo estructurado y defensivo de siempre: validación de esquemas con Zod, capa de abstracción en el API Service y sincronización de estado global mediante hooks personalizados con useQuery.

Aprovechando la intervención sobre los controles de la interfaz de usuario, se integrará el mapeo de la constante indexada de tipos de transacciones para eliminar de forma definitiva las opciones estáticas del DOM.

---

### 🎯 Objective
Sustituir los datos cableados (hardcoded) del formulario por flujos de información vivos provenientes de la base de datos y de las constantes indexadas del sistema, garantizando la integridad referencial de los identificadores (UUID) y los enums al momento del envío.

---

### 🛠️ Sub-parte 1: Mapeo del Enum de Tipos (MovementType)

<details>

*   **Status:** ✅ Completed
*   **Timestamp:** 08/06/2026

#### 📝 Crónica de la Sesión & Decisiones Técnicas
Sustituimos las opciones manuales del selector de tipo de movimiento implementando una iteración dinámica sobre la constante de diccionario MOVEMENT_TYPES.

Decisión de Diseño: Al utilizar Object.entries(), transformamos el diccionario de configuración en una matriz de tuplas [value, config]. Esto nos permite usar la llave en mayúsculas como el value real del nodo option (cumpliendo con el contrato de Zod/Prisma) mientras renderizamos de forma limpia la etiqueta traducida y amigable (config.label) para el usuario final.

**Steps & Commands:**

1. Refactorización de Opciones en el Componente del Formulario. Importamos la constante centralizada e iteramos sobre su estructura dentro de MovementForm.tsx:
```typescript
//otros imports
import { MOVEMENT_TYPES } from "@/constants/movementTypes" //1 importamos nuestro constant que tiene el enum que necesitamos

export default function MovementForm() {

    const { register, formState: { errors } } = useFormContext<MovementFormInputs>()

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Tipo de Movimiento */}
            <div>
                <label className="block text-sm font-medium text-obsidian mb-2">
                    Tipo de Movimiento
                </label>
                <select 
                    {...register("type")}
                    className="w-full p-3 border border-stone-200 rounded-lg focus:ring-sage focus:border-sage transition duration-150"
                >
                    <option value="">-- Seleccionar --</option>
                    {Object.entries(MOVEMENT_TYPES).map(([value, config]) => ( //Hacemos un map de esta forma
                        <option key={value} value={value}>{config.label}</option>
                    ))}
                </select>
            </div>
    )   /*resto del form*/ 
```
2. 🔄 hacemos un pequeño ajuste ya que el valor por default actualmente es "INCOME" para que respete nuestro input que funje como ​placeholder ---seleccionar-- haremos una pequeña modificacion a los default values en el useForm
```ts
//vamos a CreateMovementView.tsx en esta parte:
export default function CreateMovementView() {
//1 Inicializamos la central de React Hook Form
const methods = useForm<MovementFormInputs>({
    resolver: zodResolver(movementFormSchema), // Conectamos el esquema de Zod para validación
    defaultValues: {
        type: "" as MovementTYpe, //👈​ Valor inicial vacío para forzar selección usamos un pequeño type assertion
        date: new Date().toISOString().split('T')[0], // Fecha de hoy por defecto
        amount: 0,
        description: ""
    }
})
```

</details>

---

### 🛠️ Sub-parte 2: Estructura de Datos de Accounts (Zod Schemas & Types)

<details>

*   **Status:** ✅ Completed
*   **Timestamp:** 09/06/2026

#### 📝 Crónica de la Sesión & Decisiones Técnicas
En esta sesión se definieron los contratos estructurales para el modelo de datos de Cuentas (Accounts) en el frontend, garantizando una paridad estricta con las reglas del backend y de la base de datos (PostgreSQL/Prisma).

Tras inspeccionar el enrutador del servidor, se replicó el enum estricto para el campo kind (CASH o BANK), protegiendo la integridad referencial del sistema. Además de modelar la entidad individual (accountSchema), se construyó el esquema de colecciones (accountListSchema). Este último actuará como el colador y aduana de tipado para el API Service, asegurando que cualquier payload devuelto por el endpoint de lectura masiva (GET /accounts) sea sanitizado y tipado con precisión síncrona antes de tocar el caché de React Query.

**Steps & Commands:**

1. Es necesario echar un vistazo al archivo router aacounts del backend solo para recordar que inputs manejamos y como los validamos, entonces podemos notar que lleva un input "kind" el cual solo acepta valores de un enum ['CASH', 'BANK'] tenemos que replicarlo en nuestro archivo `src/types/index`
```ts
// ==========================================
// 🔥 ESQUEMAS ACCOUNT
// ==========================================

export const accountTypeSchema = z.enum(["CASH", "BANK"], {
    message: "Selecciona un tipo de cuenta válido"
})
```
2. vamos con el schema, actualmente tenemos uno provisional que vamos a sustituir, añadimos los campos de kind y balance qu es de tipo numero y es muy importante
```ts
export const accountSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    kind: accountTypeSchema,
    balance: z.coerce.number()
})
```
3. vamos a necesitar un schema para una lista que contenga todas las cuentas, aprovechamos la ocasión para crearlo
```ts
export const accountListSchema = z.array(accountSchema)
```
4. finalmente creamos los types tanto de la cuenta como de la lista de cuentas
```ts
export type Account = z.infer<typeof accountSchema>
export type AccountList = z.infer<typeof accountListSchema>
```

</details>

---

### 🛠️ Sub-parte 3: Creación del API service

<details>

*   **Status:** ✅ Completed
*   **Timestamp:** 09/06/2026

#### 📝 Crónica de la Sesión & Decisiones Técnicas
En esta sesión aislamos la lógica de persistencia de la entidad Accounts para abastecer dinámicamente los selectores del formulario de movimientos. Aplicamos el principio de Separación de Responsabilidades (SRP) al fragmentar los dominios de datos en archivos independientes (AccountAPI y useAccounts), garantizando la modularidad y reutilización del catálogo en futuras vistas del sistema (como dashboards o transferencias).

Decisión de Arquitectura Defensiva: En la capa de transporte implementamos .safeParse() con Zod. Si el servidor altera el contrato del payload, el ciclo se interrumpe inmediatamente en la frontera de red con un error controlado, impidiendo la propagación de datos corruptos en el estado de React. Asimismo, en el hook configuramos un staleTime de 5 minutos, considerando que el catálogo de cuentas es un recurso semiestático; esto optimiza el rendimiento y mitiga ráfagas innecesarias de peticiones HTTP al servidor durante los re-renders del formulario.

**Steps & Commands:**

1. Considerando que estamos trabajando con un CRUD diferente la separación de responsabilidades es importante a pesar de que de momento estamos trabajando con el formulario de creación de movimientos, entonces creamos el archivo `src/api/AccountAPI.ts`

2. al igual que en movements vamos a usar el patrón de objeto/metodos, creamos el objeto AccountAPI y el metodo getAllAccounts que desde luego hace el llamado a la api y parsea los datos con nuestro schema de lista de cuentas
```ts
import api from "@/lib/axios"
import { accountListSchema } from "@/types"
import { handleApiError } from "./handleApiErrors"


export const AccountAPI = {
    getAccounts: async () => {
        try {
            const { data } = await api.get("/accounts")
            const response = accountListSchema.safeParse(data)
            if(!response.success){
                throw new Error("invalid account format")
            }
            return response.data
        } catch (error) {
            //debbugging logs for development only
            handleApiError(error, "Error fetching accounts")
        }
    }
}
```
3. para la creación del hook nos creamos un nuevo archivo `src/hooks/useAccounts.ts`
```ts
import { AccountAPI } from "@/api/AccountAPI"
import { useQuery } from "@tanstack/react-query"

//==============================================
//  hook para consultar lista de cuentas
//==============================================


export const useAccounts = () => {
    const query = useQuery({ 
        queryKey: ['accounts'], 
        queryFn: AccountAPI.getAccounts,
        staleTime: 1000 * 60 * 5 // 5 minutos de cache para evitar consultas excesivas
    })
    return {
        ...query, // 2️⃣​
        errorMessage: query.error instanceof Error ? query.error.message : null
    }
}
```
4. para hacer uso de este hook vamos a MovementForm y lo ejecutamos de momento solo usaremos el data para llenar los select, las demás propiedades de la query las usaremos más adelante cuando se trabaje de forma aislada el diseño
```tsx
export default function MovementForm() {

    const { register, formState: { errors } } = useFormContext<MovementFormInputs>()

    const { data, isLoading, isError, errorMessage } = useAccounts() //👈​importamos el hook y lo ejecutamos asi
//... resto
}
```
```tsx
{/* Accounts Relation */}
<div>
    <label className="block text-sm font-medium text-obsidian mb-2">Cuenta Ingreso</label>
    <select 
        {...register("incomeAccountId")}
        className="w-full p-3 border border-stone-200 rounded-lg focus:ring-sage focus:border-sage transition duration-150"
    >
        <option value="">-- Seleccionar --</option>
        {data?.map(account => ( //👈​Mapeamos el arreglo de las cuentas
            <option key={account.id} value={account.id}>{account.name}</option>
        ))}
    </select>
</div>

```
</details>

### 🛠️ Sub-parte : SMOKE TEST

<details>

*   **Status:** ✅ Completed
*   **Timestamp:** 07/06/2026

### 📝 Crónica de la Sesión & Conclusiones
Ejecutamos la prueba de integración de extremo a extremo (End-to-End) en el entorno de desarrollo local para verificar la viabilidad del pipeline completo de datos. Conectamos los servicios del frontend con la API activa para comprobar que el catálogo dinámico de cuentas sustituyera de forma transparente a los objetos estáticos del sandbox.

Resultado del Análisis: El flujo de sincronización asíncrona funcionó de manera impecable. React Query montó la petición de forma nativa, la aduana de Zod parseó exitosamente la colección de arreglos, y el formulario renderizó las cuentas reales existentes en la base de datos relacional. Al realizar un envío de prueba, los identificadores UUID dinámicos fueron correctamente vinculados al JSON final del movimiento.

**Steps & Commands:**

1. Verificación de Entorno e Interfaz Dinámica
    - Asegurar que tanto el servidor backend de Express como el cliente de Vite estén activos en los puertos correspondientes.

    - Navegar a la ruta crítica: http://localhost:5173/movements/create.

    - Desplegar los selects de Cuenta Ingreso y Cuenta Egreso para constatar la destrucción del cableado estático.

    - 🚀 Estado del Test: Ejecutado en entorno de desarrollo.

    - 👨🏻‍⚖️ Veredicto: ¡PRUEBA EXITOSA! 🎉 Las opciones de cuentas (BBVA, MERCADOPAGO, EFECTIVO) ahora corresponden a registros mutables y vivos de la base de datos, listos para interactuar con el motor de transacciones.

</details>
