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
