# Frontend 100% — Plan de arquitectura StockMaster

# Frontend 100% — Plan de arquitectura
Estado actual: la estructura por features arrancó bien (`app/`, `features/`, `shared/`, `contexts/`), pero las features son solo páginas mudadas de sitio y siguen los **god-components**: `InventoryPage.tsx` (~80 KB), `POSPage.tsx` (~41 KB), `DashboardPage.tsx` (~22 KB). Mover un archivo de 80KB a una carpeta no es refactorizar. Este documento define cómo debe quedar el frontend para ser profesional, escalable y sin espagueti.

Stack: React 19 + Vite + TypeScript + React Router 7 + Tauri (desktop) + Dexie (offline/PWA) + Recharts + CSS Modules.

* * *
## 1\. Principio rector
**Organización por features (screaming architecture), NO por tipo de archivo.** Cada feature es autocontenida: su UI, su estado, sus llamadas a API y sus tipos viven juntos. Lo transversal va en `shared/`.

**Regla de oro de tamaño:** ningún componente supera ~250 líneas. Si crece más, se parte. Una página es un ORQUESTADOR: compone componentes y hooks, no contiene lógica ni JSX gigante.

**Regla de dependencia:**
*   Una feature NO importa internals de otra feature (solo vía su `index.ts`).
*   `shared/` puede ser usado por todas las features; `shared/` no importa features.
*   Toda llamada HTTP vive en `feature/api/`, nunca dentro de un componente.

* * *
## 2\. Estructura de carpetas objetivo

```plain
frontend/
├── public/                       # favicon, icons, lottie
├── src-tauri/                    # capa desktop (Rust) — ya está bien
├── src/
│   ├── main.tsx
│   ├── App.tsx                   # SOLO router + providers, nada más
│   │
│   ├── app/                      # arranque y config global
│   │   ├── router.tsx            # rutas + guards (Protected/Public/Plan/Admin)
│   │   ├── providers.tsx         # Theme, Auth, Toast, ExchangeRate anidados
│   │   └── styles/
│   │       ├── globals.css
│   │       ├── tokens.css        # design tokens: colores, spacing, radios, sombras
│   │       └── themes.css        # dark / light / OLED
│   │
│   ├── features/                 # una carpeta por dominio
│   │   └── <feature>/
│   │       ├── api/              # llamadas HTTP + hooks de datos de la feature
│   │       │   └── <feature>.api.ts
│   │       ├── components/       # componentes de la feature (< 250 líneas c/u)
│   │       ├── hooks/            # lógica/estado (useCart, useProductFilters...)
│   │       ├── pages/            # la página orquestadora
│   │       ├── types.ts          # tipos de la feature
│   │       └── index.ts          # API pública de la feature (barrel)
│   │
│   ├── shared/                   # transversal, reutilizable por cualquier feature
│   │   ├── ui/                   # design system: Button, Modal, Table, Card, KpiCard,
│   │   │                         #   Input, Select, Badge, Skeleton, EmptyState, Toast
│   │   │   └── Button/
│   │   │       ├── Button.tsx
│   │   │       └── Button.module.css
│   │   ├── hooks/                # useDebounce, useMediaQuery, useDisclosure...
│   │   ├── lib/
│   │   │   ├── http/client.ts    # wrapper fetch/axios: baseURL, token, refresh, errores
│   │   │   ├── format/currency.ts# formatter central $/Bs (ÚNICA fuente de verdad)
│   │   │   ├── format/number.ts
│   │   │   ├── format/date.ts
│   │   │   └── sync/             # lógica offline (Dexie) + cola de reintentos
│   │   ├── db/dexie.ts           # esquema IndexedDB
│   │   ├── config/env.ts         # lee import.meta.env validado
│   │   └── types/                # tipos globales (AuthenticatedUser, ApiResponse...)
│   │
│   ├── contexts/                 # Theme, Auth, Toast, ExchangeRate
│   └── assets/
├── index.html
├── vite.config.ts                # PWA + path aliases (@features/*, @shared/*, @app/*)
├── tsconfig.json                 # strict + paths
└── package.json
```

### Features a modelar
`auth, pos, inventory, sales, customers, suppliers, purchase-orders, accounts-payable, accounts-receivable, credit-notes, expenses, warehouses, reports, net-profit, best-sellers, stock-alerts, agenda, dashboard, settings, licenses, admin, social`.

* * *
## 3\. Cómo partir los god-components (lo más importante)
### 3.1 POSPage.tsx (~41 KB → orquestador de ~150 líneas)
La página solo compone. Extraer:

**Componentes** (`features/pos/components/`):
*   `ProductSearch.tsx` — buscador con foco automático + captura de escaneo.
*   `ProductGrid.tsx` — grilla de productos (con paginación/categorías).
*   `ProductCard.tsx` — tarjeta individual.
*   `Cart.tsx` — lista del carrito.
*   `CartItem.tsx` — línea editable (cantidad, eliminar).
*   `PaymentPanel.tsx` — métodos de pago + total + botón cobrar.
*   `CheckoutModal.tsx` — cobro, vuelto, confirmación.

**Hooks** (`features/pos/hooks/`):
*   `useCart.ts` — estado del carrito (add, remove, updateQty, totales, IVA).
*   `useBarcodeScanner.ts` — escucha del lector, agrega al carrito.
*   `useCheckout.ts` — proceso de cobro, llamada a API, manejo offline.
*   `usePosShortcuts.ts` — atajos de teclado (F-keys).

**API** (`features/pos/api/pos.api.ts`): `processSale`, `searchProducts`.

La página queda así (esqueleto):

```plain
export function POSPage() {
  const cart = useCart();
  const { checkout, isProcessing } = useCheckout(cart);
  useBarcodeScanner((product) => cart.add(product));
  usePosShortcuts({ onCharge: checkout });

  return (
    <div className={styles.pos}>
      <section className={styles.catalog}>
        <ProductSearch onSelect={cart.add} />
        <ProductGrid onAdd={cart.add} />
      </section>
      <aside className={styles.cart}>
        <Cart items={cart.items} onUpdate={cart.updateQty} onRemove={cart.remove} />
        <PaymentPanel totals={cart.totals} onCharge={checkout} loading={isProcessing} />
      </aside>
    </div>
  );
}
```

### 3.2 InventoryPage.tsx (~80 KB → dividir por pestañas)
Hoy mete Productos, Proveedores, Órdenes de Compra, Ajustes y Kardex en un archivo. Cada pestaña es su propia feature/componente:
*   `features/inventory/components/ProductsTab.tsx` (+ `ProductTable`, `ProductRow`, `ProductForm`, `ProductFilters`).
*   Proveedores → `features/suppliers/`.
*   Órdenes de compra → `features/purchase-orders/`.
*   Kardex → `features/inventory/components/KardexTab.tsx`.
*   `ProductForm` grande → dividir en secciones (datos, precios, stock, imagen).

La `InventoryPage` solo maneja el tab activo y compone.

### 3.3 DashboardPage.tsx (~22 KB)
Extraer cada widget: `SalesTrendChart`, `TopSellersDonut`, `RecentActivity`, `CriticalStockList`, `EventsCalendar`, `KpiRow`. La página solo los ordena en el grid.

* * *
## 4\. CSS Modules — estándar
### 4.1 Design tokens (una sola fuente)
`app/styles/tokens.css` con CSS variables. Nada de colores/espaciados hardcodeados en los módulos.

```css
:root {
  --color-primary: #f5661e;
  --color-bg: #0f0f11;
  --color-surface: #1a1a1e;
  --color-danger: #e5484d;
  --color-success: #30a46c;
  --color-warning: #f5a623;
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px; --space-6: 24px;
  --radius-sm: 6px; --radius-md: 10px; --radius-lg: 16px;
  --shadow-card: 0 1px 3px rgba(0,0,0,.2);
  --font-sm: 13px; --font-md: 15px; --font-lg: 18px;
}
```

Temas (dark/light/OLED) sobrescriben estas variables en `themes.css`. Así el toggle de tema es instantáneo y consistente.
### 4.2 Reglas de CSS Modules
*   Un `.module.css` por componente, junto al `.tsx`.
*   Clases en camelCase (`.productCard`), se importan como `styles.productCard`.
*   SIEMPRE consumir tokens (`var(--space-4)`), nunca valores mágicos.
*   Nada de estilos globales sueltos salvo reset y tokens.
*   Media queries dentro del módulo de cada componente (responsive local).

* * *
## 5\. Capa de datos y estado
### 5.1 Cliente HTTP central (`shared/lib/http/client.ts`)
Un solo wrapper que: pone `baseURL`, adjunta el token, refresca token al 401, y normaliza errores. Ningún `fetch` suelto en componentes.
### 5.2 Server state: usar TanStack Query (React Query)
Hoy el estado del servidor se maneja a mano con `useEffect` + `useState` (fuente de bugs y código repetido). Adoptar **@tanstack/react-query** para caché, refetch, loading/error y sincronización. Cada feature expone hooks: `useProducts()`, `useCreateSale()`, etc. Esto elimina muchísimo boilerplate.
### 5.3 Formato de moneda/número (mata la inconsistencia actual)
TODO monto pasa por `shared/lib/format/currency.ts`. Una función `formatMoney(amount, 'USD' | 'VES')` con `Intl.NumberFormat('es-VE')`. Se acaban los `$1742.32` conviviendo con `1.781,11`.
### 5.4 Gating de planes: UX en cliente, verdad en backend
`PlanRoute`/`AdminRoute` está bien para ocultar UI, pero la validación real vive en el backend. No confíes en el cliente para permisos.

* * *
## 6\. Calidad
*   **Path aliases** (`@features/*`, `@shared/*`, `@app/*`) en `vite.config.ts` + `tsconfig`. Se acaban los `../../../`.
*   **ESLint boundaries**: prohibir que una feature importe internals de otra, y que `shared` importe features.
*   **tsconfig estricto**: `strict`, `noUncheckedIndexedAccess`. Cero `any`.
*   **Tests**: Vitest + Testing Library para hooks críticos (`useCart`, `useCheckout`) y componentes clave. Al menos un e2e del flujo de venta.
*   **Lazy loading**: mantener el `lazy()` por página que ya tienes (code-splitting), extenderlo a los modales pesados.
*   **Error boundaries**: uno global + uno por feature crítica para que un fallo no tumbe toda la app.
*   **Accesibilidad**: foco visible, navegación por teclado (clave en el POS), labels en inputs, contraste desde los tokens.

* * *
## 7\. Checklist final (frontend 100%)
- [ ] Ningún componente > 250 líneas; páginas = orquestadores.
- [ ] POSPage partido en components + hooks (useCart, useBarcodeScanner, useCheckout, shortcuts).
- [ ] InventoryPage dividido por pestañas/feature.
- [ ] DashboardPage con cada widget extraído.
- [ ] Cada feature con `api/ components/ hooks/ pages/ types.ts index.ts`.
- [ ] Design tokens en `tokens.css`; temas por sobrescritura de variables.
- [ ] CSS Modules por componente, consumiendo tokens (sin valores mágicos).
- [ ] Cliente HTTP central con refresh de token; sin `fetch` sueltos.
- [ ] TanStack Query para todo el server state.
- [ ] `formatMoney` central para $/Bs en toda la app.
- [ ] Path aliases + ESLint boundaries + tsconfig estricto, cero `any`.
- [ ] Tests de hooks críticos + e2e de venta.
- [ ] Error boundaries + accesibilidad por teclado en POS.