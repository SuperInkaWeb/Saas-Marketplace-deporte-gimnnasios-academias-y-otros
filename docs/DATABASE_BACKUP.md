# 🗄️ Base de Datos — Backup y Restauración

> Instrucciones para crear copias de seguridad de la base de datos PostgreSQL (Neon) y restaurarlas.

---

## Información de la Base de Datos

| Campo | Valor |
|---|---|
| **Motor** | PostgreSQL 15 |
| **Proveedor** | Neon Cloud |
| **Proyecto** | mute-cloud-66184395 |
| **Base de datos** | neondb |
| **Schema** | public |

---

## 1. Generar Backup (Dump SQL)

### Opción A — desde línea de comandos (recomendado)

```bash
# Exportar toda la base de datos a un archivo SQL
pg_dump "postgresql://neondb_owner:PASSWORD@ep-tiny-cell-amwm2qa6.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require" \
  --no-password \
  --format=plain \
  --no-owner \
  --no-acl \
  --file=backup_sportnexus_$(date +%Y%m%d_%H%M%S).sql

# Solo el schema (estructura sin datos)
pg_dump "postgresql://..." \
  --schema-only \
  --file=schema_sportnexus.sql

# Solo los datos (sin estructura)
pg_dump "postgresql://..." \
  --data-only \
  --file=data_sportnexus.sql
```

### Opción B — desde Neon Console
1. Ve a [console.neon.tech](https://console.neon.tech)
2. Proyecto → tu base de datos
3. **"Backups"** → el plan Free incluye backups automáticos de 7 días
4. Para exportar manualmente: usa la **Neon CLI**

```bash
# Instalar Neon CLI
npm install -g neonctl

# Autenticarse
neonctl auth

# Exportar
neonctl databases dump --project-id mute-cloud-66184395 --name neondb > backup.sql
```

### Opción C — Script automatizado desde Windows

Guarda este script como `backup.ps1` en la raíz del proyecto:

```powershell
# backup.ps1
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$filename = "backup_sportnexus_$timestamp.sql"
$env:PGPASSWORD = "<PASSWORD_DEL_ROL_NEON>"

pg_dump `
  --host=ep-tiny-cell-amwm2qa6.c-5.us-east-1.aws.neon.tech `
  --port=5432 `
  --username=neondb_owner `
  --dbname=neondb `
  --no-password `
  --format=plain `
  --no-owner `
  --no-acl `
  --file=$filename

Write-Host "✅ Backup guardado: $filename"
```

Ejecutar:
```powershell
.\backup.ps1
```

---

## 2. Restaurar la Base de Datos

### Restaurar en Neon (misma BD)
```bash
# ADVERTENCIA: Esto sobreescribe los datos existentes
psql "postgresql://neondb_owner:PASSWORD@ep-tiny-cell-amwm2qa6.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require" \
  --file=backup_sportnexus_20260427.sql
```

### Restaurar en una nueva BD (Neon o local)
```bash
# 1. Crear la base de datos de destino (solo si es nueva)
createdb -h localhost -U postgres sportnexus_restore

# 2. Restaurar el dump
psql -h localhost -U postgres sportnexus_restore < backup_sportnexus_20260427.sql

# 3. Actualizar DATABASE_URL en .env con la nueva BD
# 4. Ejecutar: npx prisma generate
```

### Restaurar usando Prisma (solo schema)
Si solo necesitas recrear las tablas (sin datos):
```bash
# Desde el directorio backend/
npx prisma migrate deploy
```

---

## 3. Script de Backup Automático del Schema

El schema completo en formato Prisma se encuentra en:
```
backend/prisma/schema.prisma
```

Para regenerar todas las tablas desde cero en cualquier BD PostgreSQL:
```bash
cd backend
# Configura DATABASE_URL en .env con la nueva BD
npx prisma migrate deploy # Crea todas las tablas
npx prisma generate       # Genera el cliente TypeScript
```

---

## 4. Tablas del Sistema

El sistema tiene las siguientes tablas en producción:

```sql
-- Usuarios y autenticación
users
refresh_tokens

-- Negocios
gyms
trainer_profiles
gym_trainer_assignments

-- Clases y reservas
classes
reservations
wearable_metrics

-- Membresías
membership_plans
user_memberships

-- Marketplace
products
orders
order_items

-- Servicios profesionales
professional_services
professional_bookings

-- Eventos
events

-- Marketing
marketing_campaigns

-- Pagos y facturas
payments
invoices

-- Notificaciones
notifications

-- Recomendaciones IA
recommendation_results (si existe)

-- Nuevas tablas (Sprint Final):
wearable_connections    -- Tokens OAuth2 de Fitbit
crm_notes              -- Notas CRM por miembro
vendor_applications    -- Solicitudes de proveedores
sponsors               -- Patrocinadores
sponsorship_deals      -- Contratos de patrocinio
```

---

## 5. Verificar Integridad de la Base de Datos

```bash
# Contar registros de tablas principales
psql "postgresql://..." -c "
SELECT 
  (SELECT COUNT(*) FROM users) as usuarios,
  (SELECT COUNT(*) FROM gyms) as gimnasios,
  (SELECT COUNT(*) FROM classes) as clases,
  (SELECT COUNT(*) FROM orders) as ordenes,
  (SELECT COUNT(*) FROM user_memberships) as membresias;
"
```

---

## 6. Neon Backups Automáticos

Neon incluye backups automáticos en todos los planes:

| Plan | Retención de Backups |
|---|---|
| Free | 7 días (point-in-time recovery) |
| Pro | 30 días |
| Business | 60 días |

Para restaurar a un punto en el tiempo:
1. Ve a Neon Console → **"Branches"**
2. Click en **"Restore"**
3. Selecciona la fecha/hora deseada
4. Neon crea una branch de restauración

---

## 📁 Archivos de Backup Recomendados

Mantén los siguientes archivos actualizados:

| Archivo | Contenido | Frecuencia |
|---|---|---|
| `schema_sportnexus.sql` | Solo estructura de tablas | En cada sprint |
| `backup_sportnexus_YYYYMMDD.sql` | Datos completos | Semanal |
| `backend/prisma/schema.prisma` | Schema Prisma | En cada cambio |
