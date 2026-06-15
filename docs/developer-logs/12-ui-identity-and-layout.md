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
