# Backend 100% — Plan de arreglos StockMaster

# Backend 100% — Plan de arreglos
Estado actual (commit `26b72b5`): estructura ~95%, limpieza real ~80%. Lo grande ya está (compila, inversión de dependencias real, guards globales con `@Public`, IDOR cerrado, CRUD aplanados). Este documento lista **todo lo que falta** para dejarlo 100%, con el código exacto. Orden = prioridad.

* * *
## BLOQUE 1 — Seguridad crítica (hacer primero)
### 1.1 Rotar JWT\_SECRET y eliminar el fallback
El secreto tuvo un fallback hardcodeado y el repo estuvo público → considéralo comprometido.

`auth.module.ts` debe quedar sin fallback:

```plain
JwtModule.registerAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const secret = config.get<string>('JWT_SECRET');
    if (!secret) throw new Error('JWT_SECRET no definida'); // falla al arrancar, no usa default
    return { secret, signOptions: { expiresIn: '15m' } };
  },
}),
```

*   Rotar el valor en producción (nuevo secreto fuerte).
*   Validar `JWT_SECRET` también en `shared/infrastructure/config/env.validation.ts` (que ya existe).
### 1.2 Quitar `rejectUnauthorized: false` de Prisma
En `shared/infrastructure/prisma/prisma.service.ts`, desactivar la validación del certificado permite MITM.

```plain
const pool = new pg.Pool({
  connectionString: url,
  ssl: { rejectUnauthorized: true, ca: process.env.DATABASE_CA_CERT },
});
```

Usa el CA de Supabase/tu proveedor. Nunca `false` en producción.
### 1.3 Admin por rol, no por email
Eliminar cualquier chequeo `email === 'admin@stockmaster.com'`. Usar el campo `role` (ya existe en `User`) validado en backend con `@Roles('admin')` + `RolesGuard`.

* * *
## BLOQUE 2 — Cerrar la metodología hexagonal (lo que quedó a medias)
### 2.1 Enchufar las excepciones tipadas
**Problema:** los use-cases siguen con `throw new Error('...')` genérico → salen como HTTP 500 en vez de 404/400. El filtro y la base `DomainException` ya existen pero no se usan.

`shared/domain/domain-exception.ts` (asegurar `status`):

```plain
export abstract class DomainException extends Error {
  abstract readonly code: string;
  readonly status: number = 400;
  constructor(message: string) { super(message); this.name = new.target.name; }
}
```

`modules/accounts-payable/domain/accounts-payable.errors.ts`:

```plain
import { DomainException } from '@shared/domain/domain-exception';

export class PayableNotFoundException extends DomainException {
  readonly code = 'PAYABLE_NOT_FOUND';
  readonly status = 404;
  constructor() { super('Cuenta por pagar no encontrada'); }
}
export class PayableAlreadyPaidException extends DomainException {
  readonly code = 'PAYABLE_ALREADY_PAID';
  constructor() { super('Esta cuenta ya está pagada'); }
}
export class InvalidPaymentAmountException extends DomainException {
  readonly code = 'INVALID_PAYMENT_AMOUNT';
  constructor(msg: string) { super(msg); }
}
```

Confirmar que el filtro global está registrado en `main.ts`:

```plain
app.useGlobalFilters(new DomainExceptionFilter());
```

y que mapea `exception.status` → respuesta HTTP con `{ code, message }`.
### 2.2 Mover la regla de negocio a la entidad (dominio anémico)
**Problema:** la validación del abono vive suelta dentro del use-case. Debe vivir en la entidad.

`domain/accounts-payable.entity.ts` — añadir método con invariantes:

```plain
applyPayment(amount: number): number {
  if (this.status === 'paid') throw new PayableAlreadyPaidException();
  if (amount <= 0) throw new InvalidPaymentAmountException('El monto del abono debe ser mayor a cero');
  if (amount > this.pendingAmount) throw new InvalidPaymentAmountException('El abono excede el saldo pendiente');
  return this.pendingAmount - amount;
}
```

`application/use-cases/PayAccountsPayable.ts` — queda limpio:

```plain
async execute(data: PayablePaymentData): Promise<PayablePayment> {
  const payable = await this.repo.findById(data.accountPayableId, data.tenantId);
  if (!payable) throw new PayableNotFoundException();

  const newPending = payable.applyPayment(data.amount); // la regla la aplica el dominio

  const payment = await this.repo.addPayment(data);
  await this.repo.updatePendingAmount(data.accountPayableId, data.tenantId, newPending);
  if (newPending <= 0) await this.repo.markAsPaid(data.accountPayableId, data.tenantId);
  return payment;
}
```

Aplicar el mismo patrón a los otros módulos Molde A (sales, inventory, auth, cash-register, accounts-receivable).
### 2.3 Sacar la lógica de negocio de los CRUD (Molde B)
`customers.service.ts` tiene `payCredit` con `Math.max(0, balance - amount)`: eso es regla de negocio en un CRUD. Como customers maneja crédito/saldo, **promover customers a Molde A** (entidad `Customer.applyPayment`, puerto, use-case) o mover esa operación al módulo de accounts-receivable. El resto del CRUD de customers puede seguir plano.
### 2.4 Unificar nombres de archivo (kebab-case)
Siguen mezclados PascalCase y kebab-case. Renombrar en todos los módulos:
*   `PayAccountsPayable.ts` → `pay-accounts-payable.use-case.ts`
*   `PostgresAccountsPayableRepo.ts` → `postgres-accounts-payable.repository.ts`
*   `AccountsPayableRepository.interface.ts` → `accounts-payable.repository.ts`
*   `AccountsPayable.ts` (entidad) → `accounts-payable.entity.ts`

Ajustar imports. Usar `git mv` para preservar historial.

### 2.5 API pública por módulo (index.ts / barrels)
Cada módulo debe exponer solo su API pública (el NestModule, puertos/tokens y tipos que otros necesiten) por un `index.ts`. Prohibir imports a rutas internas de otro módulo.

* * *
## BLOQUE 3 — Integridad de datos (crítico para un POS)
### 3.1 Transaccionalidad de las ventas
La venta debe crear la venta + items + descontar stock + registrar movimiento en UNA transacción. Verificar `ProcessSale`/`PostgresSaleRepo` y envolver todo:

```plain
return this.prisma.$transaction(async (tx) => {
  // validar stock con bloqueo, crear sale, crear items, descontar stock, registrar movimiento
});
```

Validar stock disponible dentro de la transacción para evitar sobreventa en concurrencia. Tipar `processBulkSales` (hoy `any[]`).
### 3.2 RLS real o eliminarlo
`rls.sql` define políticas que dependen de `set_config('app.tenant_id', ...)`, pero Prisma nunca lo ejecuta. Existe un `shared/infrastructure/prisma/rls-helper.ts`: hay que **usarlo** en cada request (interceptor/middleware que abra transacción, haga `SELECT set_config('app.tenant_id', $tenantId, true)` y ejecute las queries) o eliminar `rls.sql` para no dar falsa seguridad. Decidir una vía y aplicarla completa.

* * *
## BLOQUE 4 — Completar módulos y auth
### 4.1 accounts-receivable y cash-register son cascarones
Hoy solo tienen controller + module vacíos. Implementar según Molde A:
*   **accounts-receivable:** deuda del cliente al vender a crédito (validar `creditLimit`), abonos, saldo, vencimientos.
*   **cash-register:** apertura de caja, movimientos, corte X/Z, arqueo (esperado vs contado), historial por cajero.
### 4.2 Auth: refresh tokens + logout + reset de contraseña
*   Access token corto (15m) + refresh token con rotación y revocación (tabla de refresh tokens por usuario/dispositivo).
*   Endpoint de logout que revoque el refresh.
*   "Olvidé mi contraseña" y verificación de email con tokens de un solo uso y expiración.

* * *
## BLOQUE 5 — Calidad e infraestructura
### 5.1 Tests
Casi no hay tests pese a tener Jest. Añadir:
*   Unitarios de casos de uso críticos (ProcessSale: atomicidad/stock/totales; PayAccountsPayable; auth; guards).
*   Tests de aislamiento por tenant (que un tenant no lea/escriba datos de otro).
*   e2e de los flujos principales (login, venta, inventario).
*   Integrarlos en el CI (`.github/workflows`).
### 5.2 Límites de capa con ESLint
Instalar `eslint-plugin-boundaries` (o `import/no-restricted-paths`) para prohibir por lint: `domain` → importar Nest/Prisma/infra; `application` → importar `infrastructure`; módulo A → importar internals de módulo B. Fallar el CI si se viola.
### 5.3 tsconfig estricto
Activar `strict`, `noImplicitAny`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`. Regla ESLint que prohíba `any` explícito.
### 5.4 DTOs de salida y mappers
No devolver entidades/filas de Prisma crudas desde los controllers. Response DTO por endpoint + mapper Prisma↔dominio, para no filtrar campos internos y poder versionar la API.

* * *
## Checklist final (backend 100%)
- [ ] JWT\_SECRET rotado, sin fallback, validado en env.
- [ ] Prisma con SSL validado (sin `rejectUnauthorized:false`).
- [ ] Admin por rol, no por email.
- [ ] Excepciones de dominio tipadas enchufadas + filtro global activo.
- [ ] Reglas de negocio en entidades (no en use-cases ni services).
- [ ] customers: crédito movido a Molde A o a accounts-receivable.
- [ ] Nombres de archivo unificados (kebab-case).
- [ ] index.ts (API pública) por módulo.
- [ ] Ventas 100% transaccionales, sin sobreventa.
- [ ] RLS real aplicado o eliminado (sin estado híbrido).
- [ ] accounts-receivable y cash-register implementados.
- [ ] Auth: refresh tokens, logout, reset de contraseña.
- [ ] Tests unit + e2e + aislamiento por tenant en CI.
- [ ] ESLint de límites de capa en CI.
- [ ] tsconfig estricto, cero `any`.
- [ ] Response DTOs + mappers en todos los endpoints.