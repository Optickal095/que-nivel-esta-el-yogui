# ¿Qué nivel está el Yogui?

Sitio que muestra en todo momento el nivel, el equipo, las estadísticas y la última conexión de **Dr Yogui**, un personaje de *World of Warcraft: Forever*.

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
| API (NestJS) | Render, plan gratis | `render.yaml` (Blueprint). Los secretos se cargan en el panel de Render. |
| Base de datos | Neon (Postgres) | `DATABASE_URL` en Render, con la conexión directa (no la *pooled*). Las migraciones corren en el build con `prisma migrate deploy`. |
| Despertador | GitHub Actions | `.github/workflows/keep-alive.yml` llama a la API cada 10 min para que Render no la duerma y siga registrando niveles. |
| CI | GitHub Actions | `.github/workflows/ci.yml`: lint, tests y build de la API y la web. |

La API acepta peticiones del navegador solo desde `WEB_ORIGIN` (CORS).

## Arquitectura

Clean Architecture: las dependencias apuntan hacia adentro (presentación → aplicación → dominio; la infraestructura implementa los puertos de aplicación).

### API (`api/src`)

| Capa | Carpeta | Contenido |
|---|---|---|
| Dominio | `domain/` | `CharacterProfile`, `LevelEvent`, `Presence`. Reglas puras: `resolvePresence` (online / offline / desconocido, con vencimiento de 10 min del dato en vivo), `shouldRecordLevel` (los niveles solo suben), `levelSince` (desde cuándo está en el nivel actual; es exacto solo si se vio el nivel anterior), `buildOverview`. |
| Aplicación | `application/` | Puertos (`ports.ts`) y casos de uso: `GetCharacterOverview` (caché de 10 min sobre Blizzard, conserva el último dato bueno si la API falla y comparte una sola consulta entre visitas simultáneas), `GetLevelHistory`, `RecordLiveUpdate`. |
| Infraestructura | `infrastructure/` | `BlizzardApiClient` (OAuth *client credentials* con token en caché), `mapBlizzardCharacter` (JSON de Blizzard → dominio, función pura), `BlizzardCharacterProvider`, `PrismaCharacterStore`, `SystemClock`. |
| Presentación | `presentation/` | `CharacterController` (`GET /api/character`, `GET /api/character/history`), `LiveController` (`POST /api/live`), `LiveTokenGuard`, DTOs. |
| Composición | `character.module.ts` | Une cada puerto con su adaptador y arma los casos de uso con *factories*. Los casos de uso no conocen NestJS. |

**Puertos → adaptadores**

| Puerto | Adaptador | Para qué |
|---|---|---|
| `CharacterProfileProvider` | `BlizzardCharacterProvider` | Perfil, equipo, estadísticas, imagen, profesiones, reputaciones, misiones, JcJ e íconos. |
| `ProfileSnapshotStore` | `PrismaCharacterStore` | Último perfil bueno (caché y respaldo). |
| `LevelHistoryStore` | `PrismaCharacterStore` | Cada subida de nivel observada, de la API o en vivo. |
| `LiveSignalStore` | `PrismaCharacterStore` | Última señal del bridge (fase 2). |
| `Clock` | `SystemClock` | Hora actual, reemplazable en los tests. |

### Web (`web/src/app`)

| Capa | Carpeta | Contenido |
|---|---|---|
| Dominio | `core/domain/` | Modelo de la vista y reglas puras de presentación: `timeAgo`, `presenceText`, colores de calidad y de clase, orden de slots, geometría del gráfico de nivel. |
| Aplicación | `core/application/` | Puerto `CharacterGateway` (`InjectionToken`) y `CharacterFacade` (signals, refresco cada 60 s). |
| Infraestructura | `core/infrastructure/` | `HttpCharacterGateway`: `HttpClient` contra `/api` y conversión de fechas ISO. |
| UI | `ui/` | Componentes que solo muestran datos (`hero`, `presence-badge`, `equipment`, `stats`, `progress`, `level-history`). Ninguno hace HTTP. |

### Patrones

- **Ports & Adapters / Repository:** `PrismaCharacterStore` implementa tres puertos chicos (segregación de interfaces).
- **Adapter:** `BlizzardCharacterProvider` + `mapBlizzardCharacter` aíslan el JSON sin documentar de Blizzard; si la API cambia, se toca solo ese archivo.
- **Cache-aside:** `GetCharacterOverview` sirve lo guardado y refresca cuando tiene más de 10 minutos.
- **Facade:** `CharacterFacade` expone el estado de la página como signals.

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
- "Datos curiosos" sale de `/achievements/statistics`, filtrado por ID de estadística (`FUN_STAT_IDS` en el mapper). Los IDs son iguales en todos los idiomas.
