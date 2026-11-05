# Migraciones de base de datos

El backend **no modifica el schema al arrancar** (`startCommand: node dist/src/main`).
Los cambios de schema se aplican con migraciones versionadas en
`backend/prisma/migrations/`, como un paso separado y siempre después de un backup.

No usar `prisma db push` contra producción ni contra QA compartido.

## Scripts (`backend/`)

| Script | Qué hace | ¿Escribe en la BD? |
|---|---|---|
| `npm run db:drift` | Compara la BD de `DATABASE_URL` con `schema.prisma`. Sale con código 0 si coinciden y 2 si hay diferencias (las imprime). | No |
| `npm run db:migrate:status` | Lista las migraciones aplicadas y pendientes. | No |
| `npm run db:migrate:deploy` | Aplica las migraciones pendientes. | **Sí** |

## 1. Puesta en marcha (una sola vez por base existente)

Las bases creadas antes de este cambio se construyeron con `db push` y no tienen el historial
de migraciones. La migración `20261027000000_baseline` representa el schema completo y hay que
**marcarla como aplicada** (no ejecutarla) en esas bases.

Lo ejecuta el responsable de la base, con el `DATABASE_URL` de la base correspondiente:

1. **Backup.** Crear una rama de respaldo en Neon (o `pg_dump`) y anotar su nombre y la hora.
2. **Verificar que la base coincide con el schema:**
   ```bash
   npm run db:drift
   ```
   - Código 0 / sin salida → continuar.
   - Código 2 → **detenerse**. Guardar la salida y revisarla con el equipo antes de seguir;
     el baseline solo debe marcarse en una base que coincide con el schema.
3. **Marcar el baseline:**
   ```bash
   npx prisma migrate resolve --applied 20261027000000_baseline
   ```
4. **Comprobar:**
   ```bash
   npm run db:migrate:status   # "Database schema is up to date!"
   ```
   Si la base ya tenía registradas las migraciones anteriores al baseline, antes del paso 3
   `db:migrate:status` sale con código 1 y las lista como presentes en la base pero no en el
   repo. Es esperado: después del paso 3 queda al día y no se vuelven a aplicar.
5. **Render:** confirmar que el *Start Command* del servicio es `node dist/src/main`.
   Si el servicio no se sincroniza desde `render.yaml` (Blueprint), cambiarlo a mano en
   *Settings → Build & Deploy*.

Una base nueva y vacía no necesita el paso 3: `npm run db:migrate:deploy` crea todo.

## 2. Cambiar el schema

1. Editar `backend/prisma/schema.prisma`.
2. Generar la migración contra una base **local o desechable**:
   ```bash
   npx prisma migrate dev --name descripcion_corta
   ```
3. Revisar el SQL generado. Preferir cambios compatibles con la versión anterior del código
   (agregar columnas opcionales / con default; borrar o renombrar en una segunda migración).
4. Commit de `schema.prisma` + la carpeta de la migración en el mismo PR.
   `src/prisma/migrations.aud04.spec.ts` falla si una tabla o enum del schema no tiene migración.

## 3. Aplicar en producción

1. Backup (rama de respaldo en Neon).
2. `npm run db:migrate:status` → revisar que las pendientes son las esperadas.
3. `npm run db:migrate:deploy`.
4. `npm run db:drift` → debe salir con código 0.
5. Desplegar el backend.

Si la migración elimina o renombra columnas, aplicar primero el código que ya no las usa.

## 4. Revertir

Prisma no revierte migraciones. Para volver atrás:

- **Problema solo de código:** *Rollback* del deploy en Render (el schema nuevo debe ser
  compatible con el código anterior; ver punto 2.3).
- **Problema de datos o schema:** restaurar desde la rama de respaldo de Neon
  (ver `DATABASE_BACKUP.md`) y marcar la migración como revertida:
  `npx prisma migrate resolve --rolled-back <nombre_migracion>`.

## Notas

- `preDeployCommand` de Render (planes pagos) puede ejecutar `npm run db:migrate:deploy`
  automáticamente, pero solo conviene activarlo cuando el backup previo esté automatizado.
- Las migraciones anteriores al baseline (`20260410000000_init`, `20260930000000_add_gym_location`,
  `20261025000000_payment_class_service`) quedaron en el historial de git; estaban incompletas
  respecto del schema y fueron reemplazadas por el baseline.
