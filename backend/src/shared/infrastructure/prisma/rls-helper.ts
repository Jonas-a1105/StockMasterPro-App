/**
 * Helper para ejecutar consultas con RLS (Row Level Security).
 *
 * RLS requiere que el tenant_id se configure en la sesión de PostgreSQL
 * antes de cada consulta. Como Prisma usa connection pool, usamos
 * transacciones para aislar el setting.
 *
 * Uso:
 *   import { withTenant } from '@shared/infrastructure/prisma/rls-helper';
 *
 *   const products = await withTenant(prisma, tenantId, (tx) =>
 *     tx.product.findMany(),
 *   );
 *
 * Nota: Esto es una capa adicional de seguridad. El backend ya aplica
 * tenantId en los WHERE de cada consulta. RLS es un respaldo a nivel BD.
 */

import { PrismaService } from './prisma.service';

export async function withTenant<T>(
  prisma: PrismaService,
  tenantId: string,
  fn: (tx: any) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx: any) => {
    await tx.$executeRawUnsafe(
      `SELECT set_config('app.tenant_id', $1, true)`,
      tenantId,
    );
    return fn(tx);
  });
}
