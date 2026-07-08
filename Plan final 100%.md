# Plan final 100% — Backend + Frontend StockMaster

# Plan final 100% — Backend + Frontend StockMaster
Estado actual tras los últimos commits:
*   **Backend:** ~97%
*   **Frontend:** ~90%

La base ya es profesional: arquitectura ordenada, hexagonal bien aplicada en módulos complejos, CRUD aplanados donde corresponde, RLS real, guards globales, migraciones versionadas, auth avanzada, feature-based frontend y god-components principales despedazados.

Este documento lista **TODO lo que falta** para dejarlo realmente 100%, sin huecos. Ordenado por prioridad y con criterio de arquitectura, calidad y producto.

* * *
# 1\. BACKEND — Qué falta para llegar al 100%
## 1.1 Seguridad y plataforma
### A. Rotación real de secretos y control operativo
Aunque el código ya no usa fallback para `JWT_SECRET`, falta cerrar el ciclo operativo:
*   Rotar **en producción** el secreto JWT si no se ha hecho ya.
*   Invalidar sesiones viejas si el secreto anterior estuvo expuesto.
*   Revisar otras variables sensibles (`DATABASE_URL`, Stripe keys, etc.) para confirmar que no quedaron filtradas en el pasado.
### B. Verificar que SSL de Prisma esté bien en todos los entornos
El código ya no usa `rejectUnauthorized:false`, bien. Falta:
*   Confirmar que **producción** tenga `DATABASE_CA_CERT` o una cadena de confianza válida.
*   Confirmar que **local/dev** no quede roto por la configuración de SSL.
*   Documentar los escenarios de conexión: local, staging, producción.
### C. Endurecer políticas de refresh token
Ya existe la base de auth avanzada, pero para quedar pro de verdad:
*   Guardar refresh tokens **hasheados**, no en texto plano.
*   Añadir revocación por dispositivo / logout individual y logout global.
*   Limpiar tokens expirados con un job periódico.
*   Limitar la cantidad de refresh tokens por usuario/dispositivo.

* * *
## 1.2 Dominio y arquitectura
### A. Terminar de quitar cualquier resto de dominio anémico
Ya arreglaste `AccountsPayable`, pero hay que revisar los otros módulos complejos para confirmar que la regla viva en la entidad y no en el use-case. Revisar especialmente:
*   `sales`
*   `inventory`
*   `accounts-receivable`
*   `cash-register`
*   `auth`

**Regla:** la entidad debe expresar invariantes (`applyPayment`, `openSession`, `closeSession`, `reserveStock`, `releaseStock`, etc.). El use-case orquesta, no valida reglas finas.
### B. Revisar consistencia de tokens de inyección
En algunos módulos usaste `Symbol` tokens, en auth todavía hay que confirmar consistencia total del estilo del token.

**Objetivo:**
*   Todos los módulos hexagonales usan `SYMBOL_TOKEN` exportado desde el puerto.
*   Ningún módulo inyecta clases concretas directamente en application/use-case.
### C. Cerrar customers: decidir si sigue Molde B o sube a Molde A
Hoy `customers` quedó como CRUD simple, pero tiene una operación con lógica (`payCredit` / balance / crédito).

Tienes dos opciones válidas, pero debes elegir una y sostenerla:
1. **Subir customers a Molde A** completo.
2. Mantener customers como CRUD y mover TODO lo financiero a `accounts-receivable`.

Mi recomendación: **mover lo financiero a accounts-receivable** y dejar customers como CRUD puro. Más limpio.
### D. Uniformidad de barrels (`index.ts`)
Ya existen, pero falta validar que realmente sean la única API pública de cada módulo.

**Qué revisar:**
*   Que otros módulos no importen rutas internas saltándose el `index.ts`.
*   Que cada `index.ts` exponga solo lo necesario (no todo indiscriminadamente).

* * *
## 1.3 Multi-tenant y RLS
### A. Validar RLS end-to-end
El RLS ya está implementado con `AsyncLocalStorage` y redirección de Prisma, que es excelente. Falta comprobarlo con pruebas reales:
*   Un tenant A no debe poder leer/escribir nada del tenant B ni siquiera si olvidas un filtro en Prisma.
*   Las transacciones anidadas deben comportarse bien.
*   Las queries en background/jobs también deben setear contexto de tenant si aplican.
### B. Verificar rutas públicas y privadas
Ya tienes `@Public()` y `JwtAuthGuard` global. Falta una auditoría final:
*   `auth/*` públicas
*   `webhooks` solo lo estrictamente necesario
*   herramientas/admin solo con rol apropiado

* * *
## 1.4 Integridad de negocio
### A. Ventas 100% transaccionales
Esto sigue siendo de las cosas más críticas del producto y hay que garantizarlo sin suposiciones:
*   Crear venta + items + descontar stock + registrar movimientos + CxC/Caja debe vivir en **una sola transacción**.
*   Validar stock dentro de la transacción.
*   Hacer la operación idempotente si viene del sync offline.
### B. Accounts-receivable y cash-register: terminar de endurecer reglas
Ya existen, bien. Ahora toca verificar calidad real:
*   **accounts-receivable:** no permitir abonos negativos, no permitir saldo negativo, respetar límite de crédito, estados claros (pending/paid/overdue).
*   **cash-register:** impedir cerrar caja dos veces, impedir movimientos fuera de una sesión abierta, calcular diferencias de arqueo correctamente.
### C. Recepción de órdenes de compra y stock por almacén
Si ya modelaste stock por almacén, falta asegurar consistencia:
*   Recepción parcial/total correctamente.
*   Ajustes de stock ligados al almacén correcto.
*   Transferencias entre almacenes realmente atómicas.

* * *
## 1.5 API y contratos
### A. Response DTOs en todos los endpoints
No basta con tener DTOs de entrada; falta verificar que **todos** los endpoints respondan con DTOs de salida consistentes y no filtren estructuras internas de Prisma/dominio.
### B. Versionado y convenciones de respuesta
Definir una convención única para respuestas:
*   `data`
*   `meta`
*   `error` (con `code`, `message`)

Esto evita que cada controller responda distinto.
### C. Paginación en endpoints listables
`findAll()` crudos en módulos con datasets grandes no escalan.
Aplicar paginación/orden/filtro a:
*   sales
*   inventory
*   customers
*   suppliers
*   reports supporting endpoints
*   accounts payable/receivable

* * *
## 1.6 Calidad y mantenimiento
### A. Tests (gran pendiente real)
Esto es lo más obvio que falta para llamarlo 100% profesional.

**Backend necesita:**
*   Unit tests de entidades con comportamiento (`applyPayment`, reglas de caja, etc.).
*   Unit tests de use-cases (`ProcessSale`, `PayAccountsPayable`, `OpenCashSession`, etc.).
*   e2e de flujos críticos: login, venta, pago, devolución, apertura/cierre de caja.
*   Tests de aislamiento por tenant y RLS.
### B. ESLint boundaries / reglas de capa
El código está bien hoy, pero sin barreras se puede degradar.

Implementar reglas de import para prohibir:
*   `domain` → Nest / Prisma / infrastructure
*   `application` → infrastructure
*   módulo A → internals del módulo B
### C. Cobertura mínima en CI
No necesitas obsesionarte con 100% coverage. Pero sí: una cobertura mínima razonable en módulos críticos y CI fallando si baja.
### D. Documentación técnica viva
Ya tienes docs, pero falta asegurar que siempre reflejen el código real:
*   arquitectura
*   reglas de naming
*   flujo de migraciones
*   cómo corre RLS
*   cómo crear un módulo Molde A / Molde B

* * *
# 2\. FRONTEND — Qué falta para llegar al 100%
## 2.1 Partir lo que aún sigue grande
### A. POSPage todavía está gordito
Bajó muchísimo, bien, pero todavía no está en el ideal.

**Meta:** que la página quede como un orquestador de ~150-250 líneas.

Posibles bloques a seguir extrayendo:
*   lógica de tabs/estado de paneles
*   control de modales
*   composición del layout principal
*   wiring de shortcuts
### B. Revisar Inventory y Dashboard igual
Ya se partieron, pero confirmar que:
*   cada componente tenga responsabilidad única
*   los hooks no se conviertan en "mini god-hooks"
*   no queden componentes de 500 líneas camuflados

* * *
## 2.2 Uso real de la arquitectura por features
La estructura ya está, ahora toca verificar disciplina:
*   que cada feature use de verdad `api/`, `hooks/`, `components/`, `pages/`, `types.ts`, `index.ts`
*   que una feature no importe internals de otra
*   que `shared/` sea realmente transversal y no un cajón desastre

* * *
## 2.3 CSS Modules y design system
### A. Confirmar que los tokens se usen en toda la app
Ya existe `tokens.css`/`themes.css`. Falta verificar que los módulos CSS no sigan teniendo colores, spacing y radios hardcodeados.

**Objetivo:**
*   colores → `var(--color-...)`
*   spacing → `var(--space-...)`
*   radius → `var(--radius-...)`
*   sombras → `var(--shadow-...)`
### B. Design system real en `shared/ui/`
Necesitas consolidar componentes base reutilizables:
*   Button
*   Input
*   Select
*   Modal
*   Table
*   Card
*   Badge
*   EmptyState
*   Skeleton
*   Tabs
*   KpiCard

Ahora mismo parte de eso existe disperso. Para quedar 100% debe vivir centralizado y con APIs consistentes.
### C. Evitar CSS duplicado por feature
Revisar que no haya botones, tablas, badges o layouts reinventados con estilos ligeramente distintos en cada módulo. Eso mata la mantenibilidad.

* * *
## 2.4 Estado, datos y sincronización
### A. Confirmar adopción de server-state seria
Si todavía hay mucho `useEffect + useState + fetch manual`, sigue habiendo deuda.

Mi recomendación sigue siendo la misma: **TanStack Query**.

¿Por qué?
*   cache de requests
*   loading/error estándar
*   invalidación de queries
*   menos boilerplate
*   te evita toneladas de bugs bobos
### B. Confirmar uso de cliente HTTP central
El frontend debe tener un único wrapper de red:
*   token
*   refresh token
*   manejo uniforme de errores
*   baseURL

Ningún `fetch` directo en componentes. Ninguno.
### C. Offline sync duro de verdad
La app tiene Dexie y sync. Ahora toca endurecerlo:
*   conflictos de stock
*   idempotencia de ventas offline
*   cola de reintentos
*   feedback visible del estado de sincronización
*   manejo de errores parciales

* * *
## 2.5 UX y diseño fino
### A. Formatter central usado en TODAS las pantallas
Ya existe `currency.ts`, `number.ts`, `date.ts`. Falta confirmar adopción real.

**Objetivo:**
*   no más `$1742.32` en una pantalla y `1.781,11` en otra
*   el dual-currency debe verse coherente en POS, dashboard, inventario, reportes, cuentas
### B. Accesibilidad y operación con teclado
Clave para POS:
*   foco visible
*   tab order lógico
*   shortcuts documentados
*   input del escáner siempre listo
*   botones y modales operables sin mouse
### C. Error boundaries
Agregar un boundary global y boundaries por features críticas (POS, inventory, dashboard), para que un bug en una pantalla no tumbe toda la app.
### D. Estados vacíos y errores uniformes
Todas las features deben tener:
*   loading consistente
*   empty state consistente
*   error state consistente

No un spinner distinto por cada módulo.

* * *
## 2.6 Calidad frontend
### A. Tests
Frontend aún necesita:
*   tests de hooks críticos (`useCart`, `useCheckout`, scanner, shortcuts)
*   tests de componentes base del design system
*   tests e2e del flujo de venta
### B. ESLint boundaries para features
Mismo principio que en backend:
*   una feature no importa internals de otra
*   `shared/` no importa features
### C. Storybook o catálogo visual (opcional, pero muy pro)
No es obligatorio para arrancar, pero si quieres un frontend serio de verdad, un catálogo visual del design system te sube muchísimo la calidad.

* * *
# 3\. Lo que ya está MUY bien y no tocaría
## Backend
*   Separación `shared/` + `modules/`
*   Guards globales con `@Public()`
*   Inversión de dependencias real con tokens
*   Hexagonal en módulos complejos
*   CRUD aplanados en módulos simples
*   Migraciones versionadas
*   RLS con contexto transaccional
## Frontend
*   feature-based structure
*   `app/` layer
*   design tokens base
*   formatter central creado
*   POS/Inventory/Dashboard ya despedazados en buena dirección
*   barrels por feature

* * *
# 4\. Checklist final realista para decir “quedó 100%”
## Backend
- [ ] Secretos rotados en producción y refresh tokens endurecidos
- [ ] SSL validado en todos los entornos
- [ ] Dominio rico en todos los módulos complejos
- [ ] Customers financiero movido a accounts-receivable o elevado a Molde A
- [ ] Response DTOs consistentes y paginación en listados grandes
- [ ] Tests unit + e2e + RLS/tenant isolation
- [ ] ESLint boundaries en CI
- [ ] Cobertura mínima razonable en CI
- [ ] Documentación técnica viva alineada con el código
## Frontend
- [ ] POSPage reducido al rol de orquestador real
- [ ] Inventory/Dashboard auditados para evitar mini god-components
- [ ] Tokens usados en toda la UI, sin estilos mágicos
- [ ] Design system consolidado en `shared/ui/`
- [ ] Cliente HTTP central obligatorio, sin fetches sueltos
- [ ] TanStack Query o equivalente para server-state
- [ ] Formatter usado en todas las pantallas
- [ ] Offline sync endurecido
- [ ] Error boundaries + accesibilidad + shortcuts pulidos
- [ ] Tests de hooks, componentes base y e2e de venta
- [ ] ESLint boundaries para features

* * *
# 5\. Mi take final
Honestamente: **ya no estás peleando contra arquitectura mala.** Esa guerra la ganaste.

Lo que queda ya no es “salvar el proyecto”, es **pulirlo para llevarlo de muy bueno a excelente**. Y eso cambia todo: ahora cada mejora suma sobre una base sana, no tapa grietas.

Si te quieres mover como alguien serio, el orden correcto desde aquí es:
1. tests críticos
2. boundaries/lint en CI
3. consolidar design system + formatter real
4. endurecer offline sync
5. pulir UX fina del POS

Ese es el último 10-15% que separa una app buena de una app que se siente profesional en producción.