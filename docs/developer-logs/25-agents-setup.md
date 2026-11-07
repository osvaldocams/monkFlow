# 📓 Phase 25: Agents setup

---

**[2026-11-07] - `AGENTS.md`**

<details>

1. **Objetivo**
   - Documentar el contexto que un agente no puede inferir rápido leyendo el repo: comandos por paquete, contratos entre backend y frontend, gotchas de Prisma y convenciones de trabajo.

2. **Contenido**
   - **Stack y entrypoints:** backend Express 5 + TypeScript ESM/NodeNext + Prisma 6 + PostgreSQL; frontend React 19 + Vite + TanStack Query + Zod + Tailwind. Flujo de arranque de cada paquete.
   - **Comandos reales:** `pnpm -C backend ...` y `pnpm -C frontend ...`, incluyendo typecheck vía `exec` porque no existen scripts dedicados. Se aclara que no hay `package.json` raíz y que `pnpm install` en la raíz falla.
   - **Baseline conocido:** backend compila; frontend lint y typecheck fallan por errores preexistentes (`MovementForm.tsx` y whitespace irregular en hooks). Así el agente distingue errores nuevos de los existentes.
   - **Contratos backend:** imports relativos con `.js`, singleton de Prisma, reglas de negocio en `middleware/index.ts`, diferencia entre `Decimal(12,2)` y `Float`, y forma de los errores (`{ error }` / `{ errors }`).
   - **Prisma y entorno:** secretos fuera de control de versiones y aclaración de que el CLI no carga `backend/.env` cuando existe `prisma.config.ts`; se documenta el comando para exportarlo antes de ejecutar Prisma.
   - **Convenciones frontend:** Zod centralizado en `types/index.ts`, flujo `api -> hooks -> views`, query keys e invalidaciones, tokens del tema y textos de UI en español.
   - **Workflow y docs:** ramas, Conventional Commits en inglés, bitácoras numeradas en `docs/developer-logs/` y advertencia de que `frontend/README.md` es la plantilla de Vite.

3. **Resultado**
   - Archivo de 64 líneas, sin secretos ni rutas sensibles, pensado para leerse rápido al iniciar una sesión.

</details>

---

**[2026-11-07] - `opencode.json`**

<details>

1. **Configuración mínima**
   ```json
   {
     "$schema": "https://opencode.ai/config.json",
     "instructions": ["AGENTS.md"]
   }
   ```
   - `$schema` habilita validación y autocompletado en el editor.
   - `instructions` deja explícito que `AGENTS.md` es la fuente de contexto. OpenCode ya lo carga por convención, pero declararlo mantiene la configuración portable.

2. **Lo que no se agregó**
   - Sin modelo fijado: se hereda la configuración global.
   - Sin `permission`: se mantiene el comportamiento por defecto de OpenCode.
   - Sin subagentes, comandos, skills ni MCP.

</details>

---

