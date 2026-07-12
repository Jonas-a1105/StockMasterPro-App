import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { rlsStorage } from './rls.context';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        'DATABASE_URL no definida. Asegúrate de que backend/.env existe y contiene DATABASE_URL=...',
      );
    }
    const ssl = process.env.DATABASE_CA_CERT
      ? { rejectUnauthorized: true, ca: process.env.DATABASE_CA_CERT }
      : process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: true }
        : undefined;

    const pool = new pg.Pool({
      connectionString: url,
      ssl,
    });
    const adapter = new PrismaPg(pool);
    super({ adapter });

    return new Proxy(this, {
      get: (target, prop, receiver) => {
        const store = rlsStorage.getStore();

        // Si ya hay una transacción de RLS activa y se solicita una sub-transacción,
        // simularla ejecutando el callback sobre la transacción existente (sin anidar en BD)
        if (prop === '$transaction' && store?.tx) {
          return async (arg: any) => {
            if (typeof arg === 'function') {
              return arg(store.tx);
            }
            // Si es un array de queries, ejecutarlas en orden
            if (Array.isArray(arg)) {
              const results = [];
              for (const query of arg) {
                results.push(await query);
              }
              return results;
            }
            return arg;
          };
        }

        const isLifecycle =
          typeof prop === 'string' &&
          (prop.startsWith('$') || prop.startsWith('onModule'));

        // Si ya hay una transacción activa en el storage, redirigir allí
        if (store?.tx && !isLifecycle) {
          const client = store.tx;
          const value = Reflect.get(client, prop);
          if (typeof value === 'function') {
            return value.bind(client);
          }
          return value;
        }

        // Obtener el valor original del target
        const value = Reflect.get(target, prop, receiver);

        // Si no hay transacción activa, pero hay un tenantId, y es un acceso a un modelo de BD
        if (
          !isLifecycle &&
          store?.tenantId &&
          typeof value === 'object' &&
          value !== null
        ) {
          // Retornar un Proxy para envolver las operaciones del modelo
          return new Proxy(value, {
            get: (modelTarget, modelProp) => {
              const method = Reflect.get(modelTarget, modelProp);
              if (typeof method === 'function') {
                return (...args: any[]) => {
                  const currentStore = rlsStorage.getStore();
                  // Envolver la operación individual en una transacción corta
                  if (currentStore?.tenantId && !currentStore?.tx) {
                    return target.$transaction(async (tx) => {
                      await tx.$executeRawUnsafe(
                        `SELECT set_config('app.tenant_id', $1, true)`,
                        currentStore.tenantId,
                      );
                      const txModel = Reflect.get(tx, prop);
                      const txMethod = Reflect.get(txModel, modelProp);
                      return (txMethod as any)(...args);
                    });
                  }
                  return (method as any)(...args);
                };
              }
              return method;
            },
          });
        }

        if (typeof value === 'function') {
          return value.bind(target);
        }
        return value;
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
