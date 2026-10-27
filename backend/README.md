# 🚀 Hercix Backend — API REST (NestJS)

Este es el backend oficial de **Hercix**, una plataforma SaaS y Marketplace deportivo multi-tenant. Está construido con **NestJS**, **TypeScript**, **PostgreSQL** y **Prisma ORM**.

---

## 🛠️ Stack Tecnológico

- **Framework**: NestJS (v10) con Node.js (v20)
- **Lenguaje**: TypeScript (v5)
- **Base de Datos**: PostgreSQL (Neon Cloud)
- **ORM**: Prisma (v6)
- **Autenticación**: JWT (Access & Refresh Tokens)
- **Servicios de Terceros**: 
  - **Resend** (Emails transaccionales y de marketing)
  - **Google Gemini API** (IA de recomendaciones y chat de salud)
  - **Fitbit API** (OAuth2 para sincronización de wearables)
  - **Pay-Me** (Procesador de pagos)

---

## 📋 Requisitos Previos

Asegúrate de tener instalado:
- **Node.js** (versión 20 o superior)
- **npm** (versión 10 o superior)
- **PostgreSQL** (local o cuenta en Neon Cloud)

---

## ⚙️ Instalación y Configuración Local

1. **Instalar Dependencias**:
   ```bash
   npm install
   ```

2. **Configurar Variables de Entorno**:
   Copia el archivo de ejemplo y edítalo con tus credenciales:
   ```bash
   cp .env.example .env
   ```
   *Nota: Consulta `docs/SERVICES.md` en la raíz del proyecto para obtener detalles sobre cómo conseguir las claves de API (Resend, Gemini, Fitbit, etc.).*

3. **Configurar la Base de Datos con Prisma**:
   Genera el cliente de Prisma y aplica las tablas a la base de datos:
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

4. **Ejecutar Datos de Semilla (Seed - Opcional)**:
   Puedes precargar usuarios, gimnasios y clases de prueba ejecutando:
   ```bash
   npm run seed
   ```

---

## 🚀 Ejecución del Servidor

```bash
# Modo Desarrollo (con recarga automática)
npm run start:dev

# Construir para Producción
npm run build

# Ejecutar en Producción
npm run start:prod
```

El servidor local se iniciará en `http://localhost:3000/api`.

---

## 📖 Documentación de la API (Swagger)

Cuando el servidor esté corriendo, puedes acceder a la documentación interactiva de Swagger en:
`http://localhost:3000/api/docs`

---

## 🔗 Despliegue en Producción (Render)

El backend está configurado para desplegarse fácilmente en **Render**:
1. Crea un **Web Service** en Render.
2. Conecta tu repositorio.
3. Configura el directorio raíz a `backend`.
4. Define los comandos:
   - **Build Command**: `npm install --include=dev && npx prisma generate && npm run build`
   - **Start Command**: `node dist/src/main` (las migraciones se aplican aparte: ver `docs/MIGRACIONES.md`)
5. Agrega las variables de entorno en el panel de Render.
