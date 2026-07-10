import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

@Injectable()
export class AuthPrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const url =
      process.env.AUTH_DATABASE_URL ||
      process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        'AUTH_DATABASE_URL o DATABASE_URL no definida. Asegúrate de que backend/.env existe.',
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
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
