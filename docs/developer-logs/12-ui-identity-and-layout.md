# 📓 Phase 12: UI identity and Layout

Esta fase documenta la implementación de la identidad de la interfaz de usuario principal de MonkFlow. Comenzamos configurando elementos de diseño arquitectónico, como nuestra paleta de colores minimalista personalizada y la tipografía, integrados directamente mediante la nueva directiva de tema de Tailwind v4. Tras esta configuración, diseñaremos el AppLayout principal para crear un espacio de trabajo de panel de control limpio y listo para producción. Este diseño determinará la estructura visual, la adaptabilidad y el flujo de la experiencia del usuario tanto para el libro mayor de movimientos unificado como para nuestros formularios financieros rigurosamente validados.

---

### 🎯 Objective
establecer una identidad visual coherente, minimalista y altamente responsiva para MonkFlow utilizando Tailwind v4, garantizando la separación estructural entre los diseños principales y las vistas específicas de cada dominio. Al desacoplar el diseño de la interfaz de las vistas de la aplicación, buscamos ofrecer una experiencia de navegación orgánica (visualización, creación y retorno) a la vez que proporcionamos una estructura de componentes limpia y totalmente preparada para futuras refactorizaciones atómicas modulares.
---

### 🧱 Index of Sub-parts
* **Sub-parte 1:** Identidad Visual y Configuración del Tema (Tailwind v4 @theme)
* **Sub-parte 2:** Arquitectura del AppLayout desde Cero
* **Sub-parte 3:** El Centro de Control — MovementsView.tsx (Lista y Tabla)
* **Sub-parte 4:** El Flujo de Retorno — Redirección Pos-Submit
* **Sub-parte 5:** Diseño del Contenedor de Captura — CreateMovementView y MovementForm

---

### 🛠️ Sub-parte 1: Identidad Visual y Configuración del Tema (Tailwind v4 @theme)

<details>

*   **Status:** ✅ Completed
*   **Timestamp:** 15/06/2026

#### 📝 Crónica de la Sesión & Decisiones Técnicas
En esta sesión de apertura de la Fase 12, se establecieron los cimientos visuales de la aplicación migrando la configuración del diseño a la nueva arquitectura basada en CSS de Tailwind v4. El objetivo principal fue centralizar la identidad visual de *MonkFlow* a través de tokens de diseño (*Design Tokens*) semánticos y personalizados, optimizando la consistencia y eliminando la necesidad de archivos de configuración Javascript heredados (`tailwind.config.js`).

**Decisiones de Diseño y Configuración del Tema:**
1. **Adopción de Configuración Nativa en CSS (Tailwind v4):** Se utilizó la directiva `@theme` en el punto de entrada global (`index.css`) para inyectar variables CSS personalizadas directamente en el compilador de Tailwind. Esto simplifica el pipeline de empaquetado y alinea el proyecto con los estándares modernos de desarrollo web.
2. **Paleta Cronológica y Semántica Zen:** Se estructuró un esquema de color de bajo impacto visual pero con alto contraste funcional:
   * *Base & Estructura:* Un fondo orgánico suavizado (`--color-linen-light`) combinado con un tono oscuro profundo pero no absoluto (`--color-obsidian`) para mitigar la fatiga visual.
   * *Acentos & Estados:* Tonos verdes sofisticados (`--color-sage` y `--color-green-balance`) para flujos positivos y balances, balanceados con un rojo ritual (`--color-ritual-red`) para alertas y errores financieros severos.
3. **Estrategia de Capas Opacas Integradas:** Se declararon variantes opacas con canales alfa (`rgba`) para los colores secundarios críticos. Esto provee al frontend de herramientas ágiles para construir fondos de componentes atómicos (como Badges o contenedores de errores) sin forzar un código CSS repetitivo en el marcado de las vistas.
4. **Tipografía Corporativa Fluida:** Se importó la familia tipográfica *Inter* desde Google Fonts y se configuró bajo la variable `--font-inter`, asegurando un renderizado de texto legible, geométrico y con un excelente escalado tipográfico en layouts densos de datos (tablas y registros financieros).

**Steps & Commands:**

1. abrimos el archivo index.css que está en src del fontend `/frontend/src/index.css` vamos a definir algunas variables personalizadas tanto para nuestra paleta de colores primarios y secundarios tanto para nuestras fuentes.
```css
@import "tailwindcss";

@import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Outfit:wght@100..900&family=PT+Sans:wght@400;700&display=swap');


@theme {
/* COLORS */
/*primary*/
--color-obsidian: #2d3436; 
--color-linen-light: #f7f7f7;
--color-sage: #a3c9a8;
--color-sage-opaque: rgba(163, 201, 168, 0.3);
/*secondary*/
--color-clay-gray: #b2b8b8;
--color-clay-gray-opaque: rgba(178, 184, 184, 0.1);

--color-ritual-red: #d00000;
--color-ritual-red-opaque: rgba(208, 0, 0, 0.1);

--color-green-balance: #6a994e;
--color-green-balance-opaque: rgba(106, 153, 78, 0.1);

--color-rice-paper: #e9edc9;
--color-rice-paper-opaque: rgba(233, 237, 201, 0.1);

/* FONT FAMILIES */
--font-inter: "Inter", ui-sans-serif, system-ui, sans-serif;
}
```

</details>

---

### 🛠️ Sub-parte 2: AppLayout desde Cero

<details>

*   **Status:** ✅ Completed
*   **Timestamp:** 16/07/2026

#### 📝 Crónica de la Sesión & Decisiones Técnicas
En esta sesión se culminó exitosamente el diseño y maquetación de la estructura maestra de la aplicación (AppLayout.tsx). El layout ahora responde con total fluidez en dispositivos móviles y de escritorio gracias a un enfoque de diseño responsivo nativo, utilizando el sistema de ocultación/visualización condicional de Tailwind.

**Decisiones de Diseño y Configuración del Tema:**
Decisiones de Diseño y Solución de Retos:

1. Navegación Móvil Adaptativa (Responsive Sidebar Drawer):
    Se implementó un panel lateral móvil activado reactivamente mediante el estado local sidebarOpen. Para optimizar la experiencia de usuario (UX):

        - Se integró un Overlay (capa de fondo oscura) con un filtro de opacidad sutil (bg-obsidian opacity-40) que se cierra automáticamente con el evento onClick.

        - Se configuró un posicionamiento fijo (fixed inset-y-0 left-0) con una jerarquía de capas alta (z-50) para evitar que colisione con el contenido principal.

2. Corrección de la Inyección de Vistas (<Outlet/>):
    Se solucionó el desfase del contenedor principal. Ahora, el componente <Outlet/> se renderiza dentro de un bloque semántico <main> que actúa como hermano directo del <aside> de escritorio, ambos envueltos por un contenedor flexible con altura calculada (h-[calc(100vh-4rem)]).

3. Control de Scroll Independiente (overflow-y-auto):
    Se asignó el scroll nativo de forma individualizada tanto al área de contenido principal como a los paneles de navegación lateral. De esta forma, si la lista de movimientos crece de forma masiva, el Header superior se mantiene siempre estático y pegado al viewport de manera predecible.

4. Implementación Homogénea de Tokens CSS (Tailwind v4):
    Se terminaron de limpiar y mapear todas las clases de colores de nuestra identidad de diseño:

    - El fondo de las vistas activas se asignó con la variable orgánica clara (bg-linen-light).

    - Los enlaces activos del menú móvil y de escritorio adoptaron la variable verde balance (bg-green-balance text-linen-light).

    -El overlay de cierre adoptó el color negro ceniza (bg-obsidian).

**Steps & Commands:**

1. Trabajaremos con el archivo `src/layouts/AppLayout.tsx` el cual tenemos casi que en blanco, para una mejor documentación de como vamos a contruir dividamos en tareas particulares, primero vamos a construri el header, nos preparamos instalando nuestra biblioteca de iconos lucide-react
```tsx
import { Outlet, Link, useLocation } from "react-router-dom"
import { Menu, X, LogOut, User, ArrowDownUp, ChartNoAxesCombined, Settings, LayoutDashboard} from "lucide-react"
import { useState } from "react"

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Movimientos', href: '/movements', icon: ArrowDownUp },
    { name: 'Analítico', href: '/analytics', icon: ChartNoAxesCombined },
    { name: 'Configuración', href: '/settings', icon: Settings }
]


export default function AppLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const location = useLocation()

    const isActive = (path: string) => location.pathname === path

    return (
        <div className="min-h-screen bg-gray-50 font-inter">
            {/* header */}
            <header className="sticky top-0 z-30 bg-obsidian shadow-md">
                <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        {/* Mobile menu button */}
                        <button
                            type="button"
                            className="lg:hidden inline-flex items-center justify-center rounded-md p-2 text-sage hover:bg-clay-gray hover:text-linen-light focus:outline-none focus:ring-2 focus:ring-inset focus:ring-linen-light"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            <span className="sr-only">Abrir menú</span>
                            {sidebarOpen ? (
                                <X className="block h-6 w-6" aria-hidden="true" />
                            ):
                                <Menu className="block h-6 w-6" aria-hidden="true" />
                            }
                        </button>
                        {/* Logo */}
                        <Link to="/" className="flex items-center">
                            <div className="text-linen-light text-xl sm:text-2xl font-bold">
                                💰 MonkFlow
                            </div>
                        </Link>
                        {/* user menu */}
                        <div className="flex items-center gap-3">
                            <button className="hidden sm:flex items-center gap-2 rounded-lg border border-clay-gray bg-obsidian px-3 py-2 text-sm font-medium nth-2:text-linen-light nth-1:text-sage nth-1:hover:text-linen-light hover:bg-clay-gray transition-colors">
                                <User className="h-4 w-4 " />
                                <span className="hidden md:inline">Mi cuenta</span>
                            </button>
                            <button className="rounded-lg bg-obsidian p-2 text-sage border border-clay-gray hover:border-ritual-red hover:text-linen-light hover:bg-ritual-red transition-colors">
                                <LogOut className="h-5 w-5" />
                                <span className="sr-only">Cerrar sesión</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex h-[calc(100vh-4rem)]">
            {/* sidebar desktop */}
                <aside className="hidden lg:flex shrink-0">
                    <div className="flex w-64 flex-col bg-sage">
                        <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
                            <nav className="flex-1 space-y-1 px-3">
                                {navigation.map((item)=>{
                                    const Icon = item.icon
                                    const active = isActive(item.href)
                                    return(
                                        <Link
                                            key={item.name}
                                            to={item.href}
                                            className={`
                                                group flex items-center rounded-lg px-3 py-2.5 text-md font-medium transition-colors
                                                ${active ? 'bg-green-balance text-linen-light' : 'text-obsidian hover:bg-clay-gray'}
                                            `}
                                        >
                                            <Icon
                                                className={`mr-3 h-5 w-5 shrink-0 `}
                                            />
                                            {item.name}
                                        </Link>
                                    )
                                })}
                            </nav>
                            {/* footer */}
                            <div className="flex shrink-0 border-t border-green-balance p-4">
                                <button className="group flex w-full items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-full bg-linen-light flex items-center justify-center">
                                            <User className="h-5 w-5 text-obsidian" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-medium text-obsidian">Usuario</p>
                                            <p className="text-xs text-obsidian">Ver perfil</p>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Sidebar Mobile */}
                {sidebarOpen && (
                    <div className="lg:hidden">
                        {/* overlay */}
                        <div 
                            className="fixed inset-0 z-40 bg-obsidian opacity-40"
                            onClick={() => setSidebarOpen(false)}
                        >
                        </div>
                        {/* sidebar (mobile) panel */}
                        <div className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sage">
                            <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
                                {/* close button */}
                                <div className="flex items-center justify-between px-4 mb-8">
                                    <span className="text-lg font-bold text-obsidian">💰 MonkFlow</span>
                                    <button
                                        type="button"
                                        className="rounded-md text-obsidian hover:text-linen-light"
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <X className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>

                                {/* navigation (mobile)*/}
                                <nav className="flex-1 space-y-1 px-3">
                                    {navigation.map((item) => {
                                        const Icon = item.icon
                                        const active = isActive(item.href)
                                        return (
                                            <Link
                                                key={item.name}
                                                to={item.href}
                                                className={`
                                                    group flex items-center rounded-lg px-3 py-2.5 text-md font-medium transition-colors
                                                    ${active 
                                                        ? 'bg-green-balance text-linen-light' 
                                                        : 'text-obsidian hover:bg-linen-light'
                                                    }
                                                `}
                                            >
                                                <Icon
                                                    className={`mr-3 h-5 w-5 shrink-0 ${
                                                        active ? 'text-linen-light' : 'text-obsidian group-hover:text-obsidian'
                                                    }`}
                                                />
                                                {item.name}
                                            </Link>
                                        )
                                    })}
                                </nav>

                                {/* user section (mobile) */}
                                <div className="flex shrink-0 border-t border-linen-light p-4">
                                    <button className="group flex w-full items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-linen-light flex items-center justify-center">
                                            <User className="h-5 w-5 text-obsidian" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-medium text-obsidian">Mi cuenta</p>
                                            <p className="text-xs text-obsidian">Ver perfil</p>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main content */}
                <main className="flex-1 overflow-y-auto bg-linen-light">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* footer (visible only on large screens) */}
            <footer className="hidden lg:block border-t border-clay-gray bg-linen-light">
                <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                    <p className="text-center text-sm text-obsidian">
                        © {new Date().getFullYear()} MonkFlow. Todos los derechos reservados.
                    </p>
                </div>
            </footer>
        </div>
    )
}
```

</details>

---
### 🛠️ Sub-parte 3: El Centro de Control — MovementsView.tsx (Lista y Tabla)

<details>

*   **Status:** ✅ Completed
*   **Timestamp:** 17/07/2026

#### 📝 Crónica de la Sesión & Decisiones Técnicas
En esta sesión se inauguró la construcción de la vista principal del sistema financiero, MovementsView.tsx (el Centro de Control). Tras evaluar la complejidad de visualización de datos numéricos complejos en múltiples formatos de pantalla, se descartó el uso de un contenedor único. En su lugar, se optó por un enfoque adaptativo e híbrido que presenta la información en dos estructuras HTML completamente diferenciadas, gobernadas de forma exclusiva por las utilidades responsivas nativas de Tailwind v4. Esto garantiza la máxima legibilidad de los flujos de caja del usuario sin duplicar la lógica de negocio ni las peticiones al servidor.


**Decisiones de Diseño y Solución de Retos:***

1. Diseño de Interfaz Híbrido (Desktop vs. Mobile):
Se determinó que el formato de Tabla es el óptimo para pantallas de escritorio (lg), ya que permite el escaneo vertical rápido de transacciones, fechas y montos en columnas fijas. Por el contrario, para pantallas móviles se diseñó un flujo de Tarjetas individuales (Cards) que aprovecha el espacio vertical sin forzar un scroll horizontal incómodo para el usuario.

2. Consumo Centralizado de Datos (Monolithic Data Flow):
A pesar de duplicar el marcado visual (HTML) para móviles y escritorio, la lógica de negocio permanece unificada. Ambos esquemas consumen el mismo array de datos proveniente de la API/React Query en el nivel superior del componente, evitando peticiones de red adicionales o problemas de desincronización del estado de los movimientos. 

3. Control de Visibilidad Nativo con Tailwind v4:
Se resolvió el cambio de layout de manera puramente declarativa en el cliente mediante las clases hidden lg:block (para la tabla de escritorio) y block lg:hidden (para las tarjetas móviles). Esto delega la renderización y la carga de cálculo responsiva directamente al navegador, logrando transiciones instantáneas y fluidas al redimensionar la pantalla.

4. Consistencia Visual con la Identidad Zen:
Se proyectó el uso de los tokens de color integrados en fases previas: el verde --color-green-balance para representar los ingresos (inflows) y el rojo --color-ritual-red para destacar los gastos o salidas (outflows), manteniendo una semántica financiera estricta y de alta legibilidad.


**Steps & Commands:**

1. Crear el archivo src/views/DashboardView.tsx y estructurar el componente funcional base, crear la ruta en el archivo router
```md
**creamos el archivo**
/src/views/MovementView.tsx
```
```tsx
/*MovementView.tsx*/
/*de momento solo creamos un componente funcional*/

export default function MovementView() {
    return (
        <div>
            <h1>Movement View</h1>
        </div>
    )
}

```
```tsx
/*router.tsx*/
/*en el archivo router importamos nuestra vista y la añadimos a las rutas*/
export default function Router() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Routes>
                    <Route element={<AppLayout />}>
                        <Route path="/" element={<DashboardView/>} index />
                        <Route path="/movements" element={<MovementView/>} />  /*👈​ generamos la ruta*/
                        <Route path="/movements/create" element={<CreateMovementView />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </QueryClientProvider>
    )
}
```

2. crear un componente reutilizable para el heading de la pagina, src/components/ui/PageHeader.tsx, este nos permitira de una forma dinamica añadir a cada pagina un boton de redireccionamiento, un titulo y una descripción
```tsx
import { Link } from "react-router-dom"

type PageHeaderProps = {
    title: string
    description?: string
    backTo?: string
    backLabel?: string
}

export default function PageHeader({
    title,
    description,
    backTo,
    backLabel = 'Volver',
}: PageHeaderProps) {
    return (
        <div className="mb-6 sm:mb-8">
            {/* Back button - Móvil sticky, desktop normal */}
            {backTo && (
                <nav className="mb-4 sm:mb-6 -mx-4 sm:mx-0 px-4 sm:px-0 py-3 sm:py-0 bg-white sm:bg-transparent sm:border-0 sticky sm:static top-0 z-10">
                    <Link
                        to={backTo}
                        className=" inline-flex items-center gap-2 text-sm sm:text-base font-medium text-linen-light bg-green-balance p-2 rounded-md hover:text-sage hover:bg-green-balance-opaque transition-colors"
                    >
                        <span>{backLabel}</span>
                    </Link>
                </nav>
            )}

            {/* Title and actions */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 truncate">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-base sm:text-lg lg:text-xl font-light text-gray-600 mt-2 sm:mt-3">
                            {description}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
```

3. importamos la data de los movimientos del hook donde tenemos el usequery, hacemos las respectivas validaciones con isLoading, error y !data, para entonces retornar el componente, que lleva nuestro PageHeader y un componente nuevo MovementList (pasar data por props) que mostraremos de forma condicional en caso tambien de que no haya movimientos
```tsx
import { useMovements } from "@/hooks/useMovements" /*1️⃣ importamos el hook*/
import PageHeader from "@/components/ui/PageHeader"

export default function MovementView() {
    const { data, isLoading, isError, errorMessage } = useMovements() /*2️⃣​ ejecutamos extrayendo lo que vamos a necesitar*/

    if(isLoading)return <p>Cargando...</p> /*3️⃣​ creamos validaciones de carga*/
	if (isError) return <div className="p-6 text-rose-500 font-semibold">🚨 Error: {errorMessage}</div>
	if(!data) return null
    return ( /*​4️⃣ una vez pasadas las validaciones carga la vista*/
        <>
            <PageHeader 
                title="Mis Movimientos"
                description="Crea y Administra tus Movimientos"
                backTo="/movements/create"
                backLabel="Crear Movimiento"
            
            />
            {data.length ? (
                <MovementsList /*5️⃣​ renderizamos movement list comprobando que el arreglo no esté vacío*/
					movements={data} /*6️⃣​ pasamos los datos de los movimientos */​
				/>
            ):(
                <p className="text-gray-500">No hay movimientos registrados aun</p> /*7️⃣​ mensaje cuando no hay movimientos */
            )}
        </>
    )
}
```
4. ya podemos trabajar el componente por aparte lo primero es que declararemos un interface que nos traera los movimientos de la vista padre, despues declararemos un type para los iconos que nos será de utilidad más adelante
```ts

    interface MovementsListProps {
    movements: Movement[]
    }


    const TYPE_ICONS: Record<MovementType, React.ReactNode> = {
    INCOME: <ArrowDownLeft className="w-3.5 h-3.5" />,
    EXPENSE: <ArrowUpRight className="w-3.5 h-3.5" />,
    TRANSFER: <ArrowLeftRight className="w-3.5 h-3.5" />,
    DEPOSIT: <ArrowDownToLine className="w-3.5 h-3.5" />,
    WITHDRAWAL: <ArrowUpFromLine className="w-3.5 h-3.5" />,
    }
```
5. ya podemos iniciar escribiendo nuestro componente funcional tsx y la primera parte será un sub header este nos servirá tanto para la version mobile como desktop
    ```ts
    export default function MovementsList({ movements }: MovementsListProps) {
        return (
            <div className="bg-white rounded-lg shadow-md border border-linen-light">

                {/* HEADER */}
                <div className="p-5 border-b border-linen-light">
                    <h3 className="text-xl font-semibold text-obsidian">Movimientos Recientes</h3>
                </div>
    ```

6. la siguiente seccion es la parte mobile gracias al codigo tailwind podemos hacer el codigo resposivo desde un contenedor principal el cual no será tomado en cuenta para la version desktop, es importante que vamos a iterar movements para llenar la información
    ```ts

    {/* MOBILE CARDS */}
    <div className="md:hidden grid grid-cols-1 gap-4 p-5">
        {movements.map((movement) => {
            const config = MOVEMENT_TYPES[movement.type as MovementType]
            return (
                <div
                    key={movement.id}
                    className="border border-linen-light rounded-lg p-4 hover:shadow-md transition-all hover:border-gray-300" > {/* card header */}
                    <div className="flex items-start justify-between mb-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                            {TYPE_ICONS[movement.type as MovementType]}
                            {config.label}
                        </span>
                        <span className="text-xs text-obsidian flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(new Date(movement.date))}
                        </span>
                    </div>

                    {/* Monto */}
                    <p className="text-2xl font-bold text-obsidian mb-3">
                        {formatCurrency(movement.amount)}
                    </p>

                    {/* descripcion */}
                    <p className="text-sm text-obsidian mb-4 line-clamp-2 min-h-10">
                        {movement.description || 'Sin descripción'}
                    </p>

                    {/* cuentas */}
                    {(movement.incomeAccount || movement.expenseAccount) && (
                        <div className="mb-3 pb-3 border-b border-gray-100">
                            {movement.type === 'INCOME' || movement.type === 'EXPENSE' ? (
                                <p className="text-xs text-clay-gray">
                                    <span className="font-medium">
                                        {movement.incomeAccount?.name || movement.expenseAccount?.name}
                                    </span>
                                </p>
                            ) : (
                                <div className="text-xs text-clay-gray space-y-1">
                                    <p>
                                        <span className="font-medium">De:</span>{' '}
                                        <span className="capitalize text-obsidian">{movement.expenseAccount?.name}</span>
                                    </p>
                                    <p>
                                        <span className="font-medium">A:</span>{' '}
                                        <span className="capitalize text-obsidian">{movement.incomeAccount?.name}</span>
                                    </p>
                                </div>
                            )}

                        </div>
                    )}

                    {/* boton ver */}
                    <Link
                        to={`/movements/${movement.id}`}
                        className="flex items-center justify-center gap-2 w-full py-2 text-sm font-medium text-green-balance hover:bg-green-balance-opaque rounded-lg transition-colors"
                    >
                        <Eye className="w-4 h-4" />
                        ver detalle
                    </Link>

                </div>
            )
        })

        }
    </div>
    ```
7. finalmente creams otro contenedor especial que con clases de tailwind ignoraremos para la version mobile y servirá para la version desktop, usaremos por practicidad el tag table igual es importante que para versiones medianas no estaremos mostrando la descripcion
    ```ts

    {/* DESKTOP TABLE */}
    <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
            <thead>
                <tr className="border-b border-linen-light bg-gray-50 text-left text-xs font-semibold text-clay-gray uppercase tracking-wide">
                    <th className="px-5 py-3">Tipo</th>
                    <th className="px-5 py-3">Fecha</th>
                    <th className="px-5 py-3 hidden lg:table-cell">Descripción</th>
                    <th className="px-5 py-3">Origen</th>
                    <th className="px-5 py-3">Destino</th>
                    <th className="px-5 py-3 text-right">Monto</th>
                    <th className="px-5 py-3"></th>
                </tr>
            </thead>
            <tbody className="divide-y divide-linen-light">
                {movements.map((movement) => {
                    const config = MOVEMENT_TYPES[movement.type as MovementType]
                    return (
                        <tr
                            key={movement.id}
                            className="hover>bg-gray-50 transition-colors group"
                        >
                            {/* tipo */}
                            <td className="px-5 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                                    {TYPE_ICONS[movement.type as MovementType]}
                                    {config.label}
                                </span>
                            </td>

                            {/* fecha */}
                            <td className="px-5 py-4 whitespace-nowrap text-obsidian">
                                <span className="flex items-center gap-1.5 text-clay-gray">
                                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                                    {formatDate(new Date(movement.date))}
                                </span>
                            </td>

                            {/* descripcion */}
                            <td className="px-5 py-4 max-w-[200px] hidden lg:table-cell">
                                <span>
                                    {movement.description || (
                                        <span className="text-clay-gray italic">Sin descripcion</span>
                                    )}
                                </span>
                            </td>

                            {/* origen (expenseAccount) */}
                            <td className="px-5 py-4 whitespace-nowrap">
                                {movement.expenseAccount ? (
                                    <span className="text-obsidian capitalize">{movement.expenseAccount.name}</span>
                                ) : (
                                    <span className="text-clay-gray">-</span>
                                )}
                            </td>

                            {/* destino (incomeAccount) */}
                            <td className="px-5 py-4 whitespace-nowrap">
                                {movement.incomeAccount ? (
                                    <span className="text-obsidian capitalize">{movement.incomeAccount.name}</span>
                                ) : (
                                    <span className="text-clay-gray">-</span>
                                )}
                            </td>

                            {/* monto */}
                            <td className="px-5 py-4 whitespace-nowrap text-right">
                                <span className="font-semibold text-obsidian tabular-nums">
                                    {formatCurrency(movement.amount)}
                                </span>
                            </td>

                            {/* accion */}
                            <td className="px-5 py-4 whitespace-nowrap text-right">
                                <Link
                                    to={`/movements/${movement.id}`}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-balance hover:bg-green-balance-opaque rounded-lg transition-colors group-hover:opacity-100"
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                    Ver
                                </Link>
                            </td>
                        </tr>
                    )
                })}
            </tbody>
        </table>
    </div>
    ```
escribir en la bitacora:
    el heading con el props y un nuevo type para los icons 
    el mobile version 
    el destop version





</details>
