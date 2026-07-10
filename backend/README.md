# StockMaster PRO — Backend (NestJS)

Backend multi-tenant con arquitectura hexagonal, RLS (Row Level Security), autenticación JWT propia y sistema de licencias.

## Variables de Entorno (.env)

```env
DATABASE_URL=postgresql://postgres:password@host:5432/postgres
AUTH_DATABASE_URL=postgresql://postgres:password@host:5432/postgres  # Opcional, misma URL si el rol evita RLS
JWT_SECRET=tu-secreto-jwt
LICENSE_JWT_SECRET=tu-secreto-licencias
FRONTEND_URL=http://localhost:5174
ADMIN_EMAIL=admin@stockmaster.com
ADMIN_PASSWORD=Admin123!
ADMIN_NAME=Administrador
ADMIN_TENANT=StockMaster PRO
```

> **IMPORTANTE**: La app usa su propio JWT (NestJS + Passport), **no** Supabase Auth.
> Los usuarios se guardan en la tabla `public.users`, no en Authentication → Users.

## Migraciones

```bash
# En producción SOLO usar:
npx prisma migrate deploy

# Prohibido en producción:
#   prisma migrate reset    # Borra TODOS los datos
#   prisma db push --force-reset  # Borra TODOS los datos

# Para desarrollo:
npx prisma db push         # Sincroniza schema sin migraciones
```

## RLS (Row Level Security)

Las políticas RLS están en `prisma/rls.sql`. Ejecutar en Supabase SQL Editor después de migrar:

```bash
# En desarrollo local con psql:
psql $DATABASE_URL -f prisma/rls.sql
```

El `RLSInterceptor` configura `app.tenant_id` automáticamente en cada request autenticado.
Las rutas públicas (login, register) tienen políticas que permiten SELECT sin tenant context.

## Re-crear Admin

```bash
# Si la tabla users quedó vacía (ej. tras reset de BD):
npx ts-node scripts/reset-admin.ts
```

Esto crea el usuario admin con `isPlatformAdmin: true` (super-admin de plataforma).

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
