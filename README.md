# Semillero SISINFO - Plataforma de Gestión de Investigación y Aula Virtual

Sistema web integral de alta fidelidad diseñado para la administración, seguimiento y desarrollo de proyectos de investigación del **Semillero de Investigación SISINFO**, incorporando un módulo de **Aula Virtual** con Objetos Virtuales de Aprendizaje (OVAs) interactivos y evaluaciones automatizadas.

---

## 🌟 Características Principales

- **Gestión por Roles Diferenciados**:
  - **Administrador**: Control maestro del sistema, gestión de usuarios y roles, configuración de convocatorias y módulos educativos, visualización de métricas y auditoría de logs.
  - **Docente / Investigador / Director**: Panel de revisión de proyectos asignados, retroalimentación técnica con control de versiones, creación y publicación de OVAs y Quizzes interactivos.
  - **Estudiante / Semillerista**: Registro de proyectos, envío de avances documentales (.docx), gestión de observaciones, acceso a lecciones interactivas y presentación de evaluaciones.
  - **Usuario Público / Visitante**: Portal institucional, repositorio público de proyectos finalizados, noticias y eventos del semillero.
- **Aula Virtual & Constructor de OVAs**:
  - Editor interactivo TipTap con soporte para texto enriquecido, código formateado, imágenes redimensionables y tablas.
  - Generador de quizzes multimodales (opción múltiple, verdadero/falso, completar código).
  - Reproductor HTML sandbox seguro para recursos didácticos interactivos subidos en formato Zip/HTML.
- **Seguridad Robusta (Supabase RLS & Autenticación)**:
  - Políticas RLS (*Row Level Security*) en PostgreSQL para aislar los accesos por rol y evitar manipulación no autorizada.
  - Triggers SQL y Edge Functions con `service_role` para la provisión segura de credenciales.

---

## 🛠️ Stack Tecnológico

- **Frontend**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), [TipTap Editor](https://tiptap.dev/), [Lucide React Icons](https://lucide.dev/).
- **Backend & Base de Datos**: [Supabase](https://supabase.com/) (PostgreSQL, Realtime, Storage Buckets, Edge Functions).
- **Seguridad**: JWT, OWASP Sanitization (DOMPurify), Políticas de Seguridad por Filas (RLS).

---

## 📁 Estructura del Proyecto

```text
paginasemillero/
├── public/                 # Recursos estáticos (imágenes institucionales, favicon)
├── src/
│   ├── assets/             # Estilos y activos gráficos del cliente
│   ├── components/         # Componentes UI reutilizables (QuizBuilder, RichTextEditor, Navbar, Footer, etc.)
│   ├── context/            # Contextos globales de React (AuthContext, ThemeContext)
│   ├── hooks/              # Hooks personalizados (useEmailValidation, etc.)
│   ├── layouts/            # Estructuras principales de maquetación (MainLayout)
│   ├── lib/                # Servicios API y seguridad (supabase.js, security.js)
│   ├── pages/              # Páginas del sistema (AdminDashboard, StudentDashboard, TeacherDashboard, OvaEditor, etc.)
│   ├── App.jsx             # Enrutador principal de la aplicación
│   ├── index.css           # Sistema de diseño global y tokens Tailwind
│   └── main.jsx            # Punto de entrada de React
├── supabase/
│   └── migrations/         # Esquema SQL y políticas de seguridad RLS
├── scripts/                # Scripts de generación de documentación en PDF
├── .env.example            # Plantilla de variables de entorno sanitizada
└── package.json            # Dependencias del proyecto
```

---

## ⚙️ Configuración del Entorno de Desarrollo

### 1. Requisitos Previos
- **Node.js**: Versión `>= 20.0.0`
- **npm**: Versión `>= 10.0.0`

### 2. Variables de Entorno
Cree un archivo `.env` en la raíz del proyecto basándose en `.env.example`:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima-publica
```

> ⚠️ **Nota de Seguridad**: Nunca publique claves secretas como `SUPABASE_SERVICE_ROLE_KEY` en el repositorio ni en el paquete de producción.

### 3. Instalación de Dependencias

```bash
npm install
```

### 4. Ejecución en Modo Desarrollo

```bash
npm run dev
```

Acceda a `http://localhost:5173` en su navegador.

### 5. Compilación para Producción

```bash
npm run build
```

---

## 🚀 Despliegue en Vercel

1. Suba el código a su repositorio de GitHub.
2. Conecte el repositorio a su proyecto en [Vercel](https://vercel.com).
3. Configure las variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en la consola de Vercel.
4. El comando de compilación por defecto es `npm run build` y el directorio de salida es `dist`.

---

## 📜 Licencia y Propiedad

Desarrollado para el **Semillero de Investigación SISINFO**. Todos los derechos reservados.
