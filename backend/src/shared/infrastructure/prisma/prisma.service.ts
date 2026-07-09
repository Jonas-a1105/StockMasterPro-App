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

        // Si hay una transacción activa de RLS en el storage, redirigir allí.
        // Pero excluir métodos de ciclo de vida de NestJS / Prisma
        const isLifecycle =
          typeof prop === 'string' &&
          (prop.startsWith('$') || prop.startsWith('onModule'));
        const client = !isLifecycle && store?.tx ? store.tx : target;
        const value = Reflect.get(client, prop, receiver);
        if (typeof value === 'function') {
          return value.bind(client);
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
