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
*   **Timestamp:** 17/06/2026

#### 📝 Crónica de la Sesión & Decisiones Técnicas
En esta sesión se inauguró el desarrollo del contenedor maestro de la aplicación (`AppLayout.tsx`). Ante la complejidad técnica que representa estructurar un entorno de Dashboard responsivo desde cero, se optó por una estrategia de desarrollo modular incremental. El esfuerzo de este sprint se concentró exclusivamente en el diseño, maquetación y tokenización del **Header (Barra Superior)**, postergando la barra de navegación lateral y los estados interactivos para sub-fases posteriores con el fin de mitigar el desorden visual y de código.

**Decisiones de Diseño y Configuración del Tema:**
1. **Adopción de Iconografía Atómica (`lucide-react`):** Se integró la librería Lucide mediante `pnpm` para proveer un set de vectores consistente, ligero y estilizable mediante clases nativas de Tailwind (ej. `h-5 w-5`), eliminando el uso de imágenes o SVGs duros en el marcado.
2. **Posicionamiento Persistente (`sticky top-0`):** Se definió que el Header actúe como un elemento anclado en la parte superior del viewport de la pantalla mediante `sticky`, asegurando un índice de capa seguro (`z-30`) para que las tarjetas de balance o datos que hagan scroll pasen por debajo de forma orgánica sin romper la jerarquía visual.
3. **Inyección de la Identidad Zen:** Se aplicaron por primera vez los tokens CSS de Tailwind v4 configurados en la sub-parte anterior:
   * El fondo del header adoptó `--color-obsidian` (`bg-obsidian`) para dar un contraste de bloque maduro.
   * Los acentos de botones e iconos secundarios se mapearon con el verde `--color-sage` (`text-sage`).
   * Las interacciones destructivas (como el botón de cierre de sesión) incorporaron transiciones suaves (`transition-colors`) mutando al rojo `--color-ritual-red` únicamente durante el estado de `hover`.
4. **Preparación de la Rejilla Móvil:** Se incluyeron de forma estática los vectores de menú hamburguesa (`Menu`) y cierre (`X`) bajo utilidades adaptativas (`lg:hidden`), dejando la infraestructura lista para la lógica de estados que controlará el cajón de navegación lateral (*Sidebar Drawer*) en dispositivos móviles.

**Steps & Commands:**

1. Trabajaremos con el archivo `src/layouts/AppLayout.tsx` el cual tenemos casi que en blanco, para una mejor documentación de como vamos a contruir dividamos en tareas particulares, primero vamos a construri el header, nos preparamos instalando nuestra biblioteca de iconos lucide-react
```bash
cd frontend
pnpm add lucide-react
```
```tsx
import { Outlet, Link } from "react-router-dom"
import { Menu, X, LogOut, User,  } from "lucide-react" //1️⃣ importamos algunos iconos

export default function AppLayout() {
    return (
        <div className="min-h-screen bg-gray-50 font-inter"> //​2️⃣ un div container general
            {/* header */} //​3️⃣ iniciamos con el header
            <header className="sticky top-0 z-30 bg-obsidian shadow-md">
                <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        {/* Mobile menu button */} //​4️⃣ creamos un boton para desplegar el menú que aun construiremos estos botones mas adelante se mostraran de forma condicional
                        <button
                            type="button"
                            className="lg:hidden inline-flex items-center justify-center rounded-md p-2 text-sage hover:bg-clay-gray hover:text-linen-light focus:outline-none focus:ring-2 focus:ring-inset focus:ring-linen-light"
                            onClick={() => {}}
                        >
                            <span className="sr-only">Abrir menú</span>
                                <X className="block h-6 w-6" aria-hidden="true" />
                                <Menu className="block h-6 w-6" aria-hidden="true" />
                        </button>
                        {/* Logo */} //​5️⃣ dejamos un logo provisional
                        <Link to="/" className="flex items-center">
                            <div className="text-linen-light text-xl sm:text-2xl font-bold">
                                💰 MonkFlow
                            </div>
                        </Link>
                        {/* user menu */} //​6️⃣​ creamos el user menu
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
        </div>
    )
}
```

</details>

---
1. 

</details>

---
