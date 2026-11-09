# ¿Qué nivel está el Yogui? — guía para Claude

Sitio que sigue al personaje de WoW Forever **Dr Yogui** (nombre `Dr`, apellido `Yogui`, slug `dr-yogui`, región US). Monorepo: `api/` (NestJS 11 + Prisma 6 + Postgres) y `web/` (Angular 20). La arquitectura completa está en el README.

## Reglas

- **Clean Architecture:** `domain/` y `application/` son TypeScript plano, sin decoradores de Nest, sin Prisma y sin `fetch`. Los casos de uso se construyen con factories en `api/src/character.module.ts`.
- **Puertos nuevos:** se definen en `api/src/application/ports.ts` con su token `Symbol` y se enlazan en el módulo de su feature (`character.module.ts`, `comments.module.ts`). Lo compartido (config, Prisma, reloj) vive en `shared.module.ts`.
- **Web:** los componentes de `web/src/app/ui/` no inyectan servicios; reciben datos por `input()` y emiten con `output()`. El acceso a la API va por `CHARACTER_GATEWAY` → `HttpCharacterGateway` y `COMMENTS_GATEWAY` → `HttpCommentsGateway`.
- **API de Blizzard:** está sin documentar. Todo el conocimiento de su JSON vive en `api/src/infrastructure/blizzard/` (`blizzard-types.ts` + mapper). Si cambia, se actualizan los fixtures con `npm run spike` (deja las respuestas en `scripts/out/`, que está en el .gitignore) y se copian a `api/test/fixtures/blizzard/`.
- **Niveles:** solo suben. `shouldRecordLevel` ignora niveles menores o repetidos.
- **Última conexión:** sale de `lastLoginAt` del perfil de Blizzard. La API no informa si el personaje está conectado ahora.
- **Comentarios:** nunca se guarda ni se devuelve la IP; solo su hash (`clientKey`), que no sale de `PrismaCommentStore`. Borrar exige `ADMIN_TOKEN`.
- **Migraciones en local:** `prisma migrate dev` falla con `prisma dev` (la base `template1` contamina la *shadow database*). Genera el SQL con `prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --script --shadow-database-url <URL con /postgres>` y aplícalo con `prisma migrate deploy`. Ojo: `migrate diff` con esa *shadow database* puede borrar la tabla `_prisma_migrations` local; si `migrate deploy` responde P3005, marca las migraciones ya aplicadas con `prisma migrate resolve --applied <nombre>` y vuelve a correr `deploy`.
- **Versiones:** cada publicación sube la versión en los tres `package.json` y crea tag + release `vX.Y.Z`.
- **Secretos:** van en `api/.env` (en el .gitignore). Nunca se imprimen ni se commitean.

## Comandos

- `npm run dev`: API en :3000 + web en :4200.
- `npm test`: tests de la API (unitarios y e2e) y de la web.
- `cd api && npm run lint`: ESLint + Prettier (con `--fix`).
- `npm run db:dev`: Postgres local (`prisma dev`, sin Docker). La URL local necesita `connection_limit=1&pgbouncer=true`.
