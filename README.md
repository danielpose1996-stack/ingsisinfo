# Semillero SISINFO — Plataforma Institucional & Aula Virtual

Plataforma web académica integral desarrollada para el **Semillero de Investigación SISINFO** de la **Facultad de Ingeniería de Sistemas e Informática — UNIPAZ**. El sistema centraliza la difusión institucional, convocatorias de investigación, eventos, noticias y un moderno ecosistema de **Aula Virtual** con Objetos Virtuales de Aprendizaje (OVAs) interactivos.

---

## 🌟 Características Principales

### 🎓 1. Aula Virtual & Ecosistema de OVAs
* **Visor Académico Inmersivo:** Entorno de aprendizaje a pantalla completa con navegación lateral estructurada por capítulos/bloques, modo de lectura y barra de progreso.
* **Editor de Lecciones Interactivas (TipTap):** Soporte para texto enriquecido, tablas, bloques de código formateados y control fluido de imágenes (arrastre interactivo desde las esquinas, presets del `25%`, `50%`, `75%`, `100%` y alineación).
* **Evaluaciones Automatizadas (Quizzes):** Constructor y reproductor de cuestionarios con temporizador, ponderación de puntajes, preguntas de opción múltiple, verdadero/falso, completar código y respuestas cortas.
* **Reproductor Sandbox HTML/Zip:** Alojamiento y renderizado aislado para lecciones didácticas interactivas empaquetadas en HTML/SCORM/Web.

### 📢 2. Convocatorias & Vinculación de Semilleristas
* Publicación dinámica de convocatorias con fechas límite, requisitos y cupos.
* Formulario de postulación en línea para estudiantes con carga de hoja de vida y datos académicos.
* Panel administrativo para revisión, filtrado y aprobación/rechazo de postulaciones.

### 📰 3. Noticias & Eventos Institucionales
* Gestor de publicaciones, logros de investigación, ponencias y talleres.
* Calendario y agenda de eventos académicos con control de publicación (`Borrador` / `Publicado`).

### 🎭 4. Simulación de Roles en Tiempo Real (Administrador)
* Barra ejecutiva flotante que permite a los Administradores simular y auditar la experiencia de usuario exacta de un **Docente** o **Estudiante** de manera instantánea y segura.

### 🔒 5. Seguridad & Control de Acceso
* Autenticación granular mediante **Supabase Auth** y **Row Level Security (RLS)** en PostgreSQL.
* Sanitización contra vulnerabilidades XSS mediante **DOMPurify** en todo el contenido HTML renderizado.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
| :--- | :--- |
| **Frontend** | [React 19](https://react.dev/), [Vite](https://vitejs.dev/), [Tailwind CSS v4](https://tailwindcss.com/) |
| **Animaciones & UI** | [Framer Motion](https://www.framer.com/motion/), [Lucide React](https://lucide.dev/), [SweetAlert2](https://sweetalert2.github.io/) |
| **Editor de Contenido** | [TipTap Editor](https://tiptap.dev/) con extensiones personalizadas |
| **Backend & Base de Datos** | [Supabase](https://supabase.com/) (PostgreSQL, Storage Buckets, Auth, RLS) |
| **Despliegue** | [Vercel](https://vercel.com/) (CI/CD continuo conectado a GitHub) |

---

## 📁 Estructura del Proyecto

```text
paginasemillero/
├── public/                 # Recursos públicos y estáticos (logos, favicon)
├── src/
│   ├── assets/             # Recursos visuales y gráficos
│   ├── components/         # Componentes UI (OvaViewer, RichTextEditor, QuizPlayer, Navbar, etc.)
│   ├── context/            # Contextos de React (AuthContext, ThemeContext)
│   ├── hooks/              # Hooks personalizados
│   ├── layouts/            # Plantillas de diseño estructural (MainLayout)
│   ├── lib/                # Configuración de clientes y utilidades (supabase.js, security.js)
│   ├── pages/              # Vistas principales (Home, Modulos, AdminDashboard, OvaEditor, etc.)
│   ├── App.jsx             # Enrutamiento principal y protección de rutas
│   ├── index.css           # Tokens de diseño global y estilos del editor
│   └── main.jsx            # Punto de entrada de la aplicación
├── supabase/
│   └── migrations/         # Esquemas SQL, tablas y políticas RLS
├── .env.example            # Plantilla de variables de entorno requeridas
├── package.json            # Dependencias del proyecto
└── vite.config.js          # Configuración del empaquetador Vite
```

---

## ⚙️ Configuración del Entorno Local

### 1. Requisitos Previos
* **Node.js**: Versión `>= 20.0.0`
* **npm**: Versión `>= 10.0.0`

### 2. Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto basándote en `.env.example`:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima-publica
```

### 3. Instalación de Dependencias

```bash
npm install
```

### 4. Servidor de Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

### 5. Compilación para Producción

```bash
npm run build
```

---

## 🚀 Despliegue en Producción (Vercel)

1. Conecta el repositorio de GitHub a tu cuenta en [Vercel](https://vercel.com).
2. Configura las variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en la configuración del proyecto en Vercel.
3. El comando de compilación es `npm run build` y el directorio de salida es `dist`.

---

## 📜 Propiedad Académica

Desarrollado para el **Semillero de Investigación SISINFO** — **Instituto Universitario de la Paz (UNIPAZ)**.
