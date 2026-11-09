# ¿Qué nivel está el Yogui?

Sitio que muestra en todo momento el nivel, las muertes, el equipo, las estadísticas y la última conexión de **Dr Yogui**, un personaje de *World of Warcraft: Forever*. Los visitantes pueden dejar comentarios.

- **Fase 1 (hecha):** datos de la API de perfiles de Blizzard para WoW Forever, guardados en Postgres para tener historial de nivel y respaldo.
- **Fase 2 (pendiente):** modo en vivo. Un addon en el PC de Eduardo ve al Yogui en la lista de amigos y un *bridge* envía nivel y conexión a `POST /api/live`.

## Stack

Angular 20 (`web/`) · NestJS 11 (`api/`) · Prisma 6 + PostgreSQL · API de Blizzard (namespace `profile-forever-us`, sin documentar).

## Puesta en marcha

```bash
npm run install:all
cp api/.env.example api/.env      # completar BLIZZARD_CLIENT_ID / SECRET (develop.battle.net)
npm run db:dev                    # Postgres local con `prisma dev` (sin Docker); copiar la URL TCP a DATABASE_URL
npm run db:migrate
npm run dev                       # API en :3000, web en :4200 (proxy /api → :3000)
```

> En local, `DATABASE_URL` debe terminar en `&connection_limit=1&pgbouncer=true`: el Postgres de `prisma dev` tiene una sola sesión y no tolera *prepared statements* compartidos.

En local, si existe `web/dist`, NestJS también sirve el Angular compilado en http://localhost:3000.

## Despliegue

| Pieza | Dónde | Cómo |
|---|---|---|
| Web (Angular) | GitHub Pages: `https://optickal095.github.io/que-nivel-esta-el-yogui/` | `.github/workflows/pages.yml` compila con `--base-href` y `--define NG_API_BASE_URL` (variable del repo `API_BASE_URL`). |
| API (NestJS) | Render, plan gratis | `render.yaml` (Blueprint). Los secretos se cargan en el panel de Render; `LIVE_TOKEN` y `ADMIN_TOKEN` los genera Render. |
| Base de datos | Neon (Postgres) | `DATABASE_URL` en Render, con la conexión directa (no la *pooled*). Las migraciones corren en el build con `prisma migrate deploy`. |
| Despertador | GitHub Actions | `.github/workflows/keep-alive.yml` llama a la API cada 10 min para que Render no la duerma y siga registrando niveles. |
| CI | GitHub Actions | `.github/workflows/ci.yml`: lint, tests y build de la API y la web. |

La API acepta peticiones del navegador solo desde `WEB_ORIGIN` (CORS).

## Arquitectura

Clean Architecture: las dependencias apuntan hacia adentro (presentación → aplicación → dominio; la infraestructura implementa los puertos de aplicación).

### API (`api/src`)

| Capa | Carpeta | Contenido |
|---|---|---|
| Dominio | `domain/` | `CharacterProfile`, `LevelEvent`, `Presence`, `Comment`. Reglas puras: `resolvePresence` (online / offline / desconocido, con vencimiento de 10 min del dato en vivo), `shouldRecordLevel` (los niveles solo suben), `levelSince` (desde cuándo está en el nivel actual; es exacto solo si se vio el nivel anterior), `deathsAtLevel` (muertes en el nivel actual = total − muertes guardadas al registrar el nivel), `validateComment` y `canCommentAgain` (30 s entre comentarios del mismo visitante), `buildOverview`. |
| Aplicación | `application/` | Puertos (`ports.ts`) y casos de uso: `GetCharacterOverview` (caché de 2 min sobre Blizzard, conserva el último dato bueno si la API falla y comparte una sola consulta entre visitas simultáneas), `GetLevelHistory`, `RecordLiveUpdate`, `ListComments`, `PostComment`, `DeleteComment`. |
| Infraestructura | `infrastructure/` | `BlizzardApiClient` (OAuth *client credentials* con token en caché), `mapBlizzardCharacter` (JSON de Blizzard → dominio, función pura), `BlizzardCharacterProvider`, `PrismaCharacterStore`, `PrismaCommentStore`, `SystemClock`. |
| Presentación | `presentation/` | `CharacterController` (`GET /api/character`, `GET /api/character/history`), `LiveController` (`POST /api/live`), `CommentsController` (`GET`/`POST /api/comments`; `DELETE /api/comments/:id` y `GET /api/comments/moderation` con `ADMIN_TOKEN`), `LiveTokenGuard`, `AdminTokenGuard`, DTOs. |
| Composición | `shared.module.ts`, `character.module.ts`, `comments.module.ts` | `SharedModule` da la config, la conexión a Postgres y el reloj. Cada módulo de feature une sus puertos con sus adaptadores y arma los casos de uso con *factories*. Los casos de uso no conocen NestJS. |

**Puertos → adaptadores**

| Puerto | Adaptador | Para qué |
|---|---|---|
| `CharacterProfileProvider` | `BlizzardCharacterProvider` | Perfil, equipo, estadísticas, imagen, profesiones, reputaciones, misiones, JcJ e íconos. |
| `ProfileSnapshotStore` | `PrismaCharacterStore` | Último perfil bueno (caché y respaldo). |
| `LevelHistoryStore` | `PrismaCharacterStore` | Cada subida de nivel observada, de la API o en vivo. |
| `LiveSignalStore` | `PrismaCharacterStore` | Última señal del bridge (fase 2). |
| `CommentStore` | `PrismaCommentStore` | Comentarios. Guarda un hash de la IP (nunca la IP) para el límite de frecuencia. |
| `Clock` | `SystemClock` | Hora actual, reemplazable en los tests. |

### Web (`web/src/app`)

| Capa | Carpeta | Contenido |
|---|---|---|
| Dominio | `core/domain/` | Modelo de la vista y reglas puras de presentación: `timeAgo`, `presenceText`, colores de calidad y de clase, orden de slots, geometría del gráfico de nivel. |
| Aplicación | `core/application/` | Puertos `CharacterGateway`, `CommentsGateway` y `ModerationKeyStore` (`InjectionToken`). `CharacterFacade` y `CommentsFacade` (signals, refresco cada 60 s). |
| Infraestructura | `core/infrastructure/` | `HttpCharacterGateway` y `HttpCommentsGateway` (`HttpClient` contra `/api`, fechas ISO, errores traducidos a mensajes para el visitante), `LocalStorageModerationKeyStore`. |
| UI | `ui/` | Componentes que solo muestran datos y emiten eventos (`hero`, `presence-badge`, `equipment`, `stats`, `progress`, `fun-stats`, `level-history`, `comments`). Ninguno hace HTTP. |

### Patrones

- **Ports & Adapters / Repository:** `PrismaCharacterStore` implementa tres puertos chicos (segregación de interfaces).
- **Adapter:** `BlizzardCharacterProvider` + `mapBlizzardCharacter` aíslan el JSON sin documentar de Blizzard; si la API cambia, se toca solo ese archivo.
- **Cache-aside:** `GetCharacterOverview` sirve lo guardado y refresca cuando tiene más de 2 minutos (Blizzard actualiza el perfil 1 a 2 min después de que el personaje cierra sesión).
- **Facade:** `CharacterFacade` y `CommentsFacade` exponen el estado de la página como signals.

## Comentarios

- Cualquiera comenta con un nombre libre (o queda "Anónimo"), sin cuentas. Máximo 40 caracteres de nombre y 500 de mensaje.
- **Anti-spam:** 30 s entre comentarios del mismo visitante (por hash de IP; Render va detrás de un proxy, por eso `trust proxy`) y un campo trampa (*honeypot*) invisible que solo llenan los bots.
- **Moderación:** el botón "Moderar" está oculto para los visitantes; aparece al abrir el sitio con `?moderar` (por ejemplo `https://optickal095.github.io/que-nivel-esta-el-yogui/?moderar`). Pide la clave (`ADMIN_TOKEN`, generada por Render; se ve en el panel del servicio → *Environment*). Con la clave aparecen los botones "Borrar". El navegador recuerda la clave en `localStorage`.

## Versiones

Cada publicación lleva un tag `vX.Y.Z` y un *release* en GitHub con sus notas. La versión está en los tres `package.json`.

## Tests

```bash
npm test     # API: unitarios + e2e (Jest, con dobles de los puertos) · Web: Karma + ChromeHeadless
```

- **Dominio y casos de uso:** tests sin red ni base de datos (`api/test/doubles.ts`).
- **Mapper de Blizzard:** probado contra respuestas reales guardadas en `api/test/fixtures/blizzard` (capturadas con `npm run spike`).
- **E2E:** la app Nest completa con el proveedor y la base reemplazados por dobles.

## Limitaciones conocidas de la API de WoW Forever

- No tiene documentación y puede cambiar sin aviso.
- El personaje aparece recién desde nivel 10 y después de cerrar sesión.
- El perfil se actualiza al cerrar sesión. Para ver el nivel en vivo existe la fase 2.
- La imagen del personaje (`character-media`) puede tardar horas en generarse; mientras tanto la web muestra las iniciales.
- **No expone el `/played`.** "Lleva X en nivel N" es tiempo de reloj desde que se registró la subida, no tiempo jugado. Para el nivel en que empezó el registro se muestra "al menos". El `/played` real solo se puede leer desde el cliente del propio jugador (`RequestTimePlayed`).
- "Datos curiosos" sale de `/achievements/statistics`, filtrado por ID de estadística (`FUN_STAT_IDS` en el mapper). Los IDs son iguales en todos los idiomas. Las muertes (`DEATHS_STAT_ID` = 60) se muestran aparte, arriba.
- **Muertes por nivel:** Blizzard solo da el total y lo actualiza al cerrar sesión. Las muertes "en nivel N" se cuentan desde que el sitio registró ese nivel, así que no incluyen las de la misma sesión en que subió.
