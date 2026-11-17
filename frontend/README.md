# 💻 Hercix Frontend — Aplicación Cliente (React)

Este es el frontend oficial de **Hercix**, la interfaz de usuario para atletas, entrenadores, dueños de gimnasios y administradores. Está construido sobre **React**, **Vite**, **TypeScript** y estilizado con **TailwindCSS** y **Framer Motion**.

---

## 🛠️ Stack Tecnológico

- **Librería Core**: React (v18)
- **Compilador/Bundle**: Vite (v5)
- **Lenguaje**: TypeScript
- **Estilos**: TailwindCSS (v3) + Glassmorphism personalizado
- **Animaciones**: Framer Motion
- **Iconografía**: Lucide React
- **Cliente HTTP**: Axios
- **Router**: React Router DOM (v6)

---

## 📋 Requisitos Previos

Asegúrate de tener instalado:
- **Node.js** (versión 20 o superior)
- **npm** (versión 10 o superior)

---

## ⚙️ Instalación y Configuración Local

1. **Instalar Dependencias**:
   ```bash
   npm install
   ```

2. **Configurar Variables de Entorno**:
   Copia el archivo de ejemplo y edítalo con la URL de tu API del backend:
   ```bash
   cp .env.example .env
   ```
   Por defecto para desarrollo local:
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```

---

## 🚀 Ejecución de la Aplicación

```bash
# Servidor de Desarrollo local (HMR)
npm run dev

# Construir para Producción (Genera la carpeta /dist)
npm run build

# Previsualizar la compilación de producción localmente
npm run preview
```

La aplicación se iniciará en `http://localhost:5173`.

---

## 🔗 Despliegue en Producción (Vercel)

El frontend está optimizado para su despliegue en **Vercel**:
1. Crea un nuevo proyecto en Vercel.
2. Conecta el repositorio de GitHub.
3. Configura el directorio raíz a `frontend`.
4. El framework preset se detectará automáticamente como `Vite`.
5. Configura la variable de entorno `VITE_API_URL` apuntando a tu backend de producción (ej. `https://<TU-BACKEND>.onrender.com/api`).
6. Haz clic en **Deploy**.
