const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Paleta de Colores Institucional
const COLOR_PRIMARY = '#1E3A8A';       // Azul Institucional Principal
const COLOR_SECONDARY = '#1D4ED8';     // Azul Claro de Acento
const COLOR_TEXT = '#0F172A';          // Texto Oscuro Principal
const COLOR_MUTED = '#475569';         // Texto Secundario / Gris
const COLOR_LIGHT_BG = '#F8FAFC';      // Fondo de Cajas y Llamadas
const COLOR_BORDER = '#CBD5E1';        // Bordes de Tablas y Separadores
const COLOR_AMBER = '#D97706';         // Advertencias / Alertas
const COLOR_EMERALD = '#059669';       // Éxito / Estado Aprobado

// Clase auxiliar para construir PDF extensos y estructurados
class ProfessionalPdfBuilder {
  constructor(outputPath, docTitle, docCategory) {
    this.docTitle = docTitle;
    this.docCategory = docCategory;
    this.outputPath = outputPath;
    this.doc = new PDFDocument({
      size: 'A4',
      margin: 45,
      bufferPages: true
    });
    this.stream = fs.createWriteStream(outputPath);
    this.doc.pipe(this.stream);

    this.initCoverPage();
  }

  initCoverPage() {
    const doc = this.doc;
    
    // Encabezado Visual Superior de la Portada
    doc.rect(0, 0, doc.page.width, 210).fill(COLOR_PRIMARY);

    doc.fillColor('#FFFFFF')
       .font('Helvetica-Bold')
       .fontSize(22)
       .text('SEMILLERO DE INVESTIGACIÓN SISINFO', 45, 45, { align: 'center' });

    doc.fontSize(12)
       .font('Helvetica')
       .text('FACULTAD DE INGENIERÍA DE SISTEMAS E INFORMÁTICA — UNIPAZ', 45, 78, { align: 'center' });

    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('#93C5FD')
       .text(this.docTitle.toUpperCase(), 45, 115, { align: 'center' });

    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#E2E8F0')
       .text(this.docCategory, 45, 155, { align: 'center' });

    doc.fontSize(8)
       .fillColor('#BFDBFE')
       .text('Documento Oficial de Evaluación de Software — Repositorio GitHub: danielpose1996-stack/ingsisinfo', 45, 185, { align: 'center' });

    doc.moveDown(6);
    this.addHorizontalDivider();
  }

  checkPageBreak(neededSpace = 60) {
    if (this.doc.y + neededSpace > this.doc.page.height - 50) {
      this.doc.addPage();
      this.doc.y = 50;
    }
  }

  addChapterTitle(number, title) {
    this.checkPageBreak(80);
    this.doc.moveDown(1.5);
    const y = this.doc.y;
    
    this.doc.rect(45, y, this.doc.page.width - 90, 26).fill(COLOR_PRIMARY);
    this.doc.fillColor('#FFFFFF')
       .font('Helvetica-Bold')
       .fontSize(12)
       .text(`CAPÍTULO ${number}: ${title.toUpperCase()}`, 55, y + 7);
    
    this.doc.moveDown(1.2);
  }

  addSectionHeader(title) {
    this.checkPageBreak(50);
    this.doc.moveDown(1);
    const y = this.doc.y;
    
    this.doc.rect(45, y, 4, 18).fill(COLOR_SECONDARY);
    this.doc.fillColor(COLOR_PRIMARY)
       .font('Helvetica-Bold')
       .fontSize(12)
       .text(title, 55, y + 2);
    
    this.doc.moveDown(0.8);
  }

  addSubSectionHeader(title) {
    this.checkPageBreak(40);
    this.doc.moveDown(0.8);
    this.doc.fillColor(COLOR_SECONDARY)
       .font('Helvetica-Bold')
       .fontSize(10.5)
       .text(title);
    this.doc.moveDown(0.4);
  }

  addParagraph(text) {
    this.checkPageBreak(30);
    this.doc.fillColor(COLOR_TEXT)
       .font('Helvetica')
       .fontSize(9)
       .text(text, { align: 'justify', lineGap: 3 });
    this.doc.moveDown(0.4);
  }

  addBullet(boldTitle, description) {
    this.checkPageBreak(25);
    this.doc.fillColor(COLOR_SECONDARY).font('Helvetica-Bold').fontSize(9).text('▪ ', { continued: true });
    this.doc.fillColor(COLOR_TEXT).font('Helvetica-Bold').text(boldTitle + ': ', { continued: true });
    this.doc.font('Helvetica').text(description, { align: 'justify', lineGap: 2 });
    this.doc.moveDown(0.3);
  }

  addNumberedStep(stepNum, title, description) {
    this.checkPageBreak(30);
    this.doc.fillColor(COLOR_PRIMARY).font('Helvetica-Bold').fontSize(9).text(`Paso ${stepNum}. `, { continued: true });
    this.doc.fillColor(COLOR_TEXT).font('Helvetica-Bold').text(title + ' — ', { continued: true });
    this.doc.font('Helvetica').text(description, { align: 'justify', lineGap: 2 });
    this.doc.moveDown(0.35);
  }

  addCallout(title, text, type = 'info') {
    this.checkPageBreak(55);
    this.doc.moveDown(0.5);
    const y = this.doc.y;
    const width = this.doc.page.width - 90;
    
    const bgColor = type === 'warning' ? '#FEF3C7' : (type === 'security' ? '#ECFDF5' : '#EFF6FF');
    const borderColor = type === 'warning' ? COLOR_AMBER : (type === 'security' ? COLOR_EMERALD : COLOR_PRIMARY);

    this.doc.rect(45, y, width, 44).fillAndStroke(bgColor, borderColor);
    
    this.doc.fillColor(borderColor)
       .font('Helvetica-Bold')
       .fontSize(8.5)
       .text(title.toUpperCase(), 55, y + 6);

    this.doc.fillColor(COLOR_TEXT)
       .font('Helvetica-Oblique')
       .fontSize(8)
       .text(text, 55, y + 20, { width: width - 20, align: 'justify' });

    this.doc.moveDown(1.5);
  }

  addTable(headers, rows) {
    this.checkPageBreak(60 + (rows.length * 20));
    this.doc.moveDown(0.5);
    const startY = this.doc.y;
    const tableWidth = this.doc.page.width - 90;
    const colWidth = tableWidth / headers.length;

    // Encabezado de Tabla
    this.doc.rect(45, startY, tableWidth, 20).fill(COLOR_PRIMARY);
    this.doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8.5);
    headers.forEach((header, i) => {
      this.doc.text(header, 45 + (i * colWidth) + 5, startY + 5, { width: colWidth - 10, align: 'left' });
    });

    let currentY = startY + 20;

    // Filas de Tabla
    rows.forEach((row, rowIndex) => {
      const rowBg = rowIndex % 2 === 0 ? '#FFFFFF' : COLOR_LIGHT_BG;
      this.doc.rect(45, currentY, tableWidth, 20).fillAndStroke(rowBg, COLOR_BORDER);
      this.doc.fillColor(COLOR_TEXT).font('Helvetica').fontSize(8);

      row.forEach((cell, colIndex) => {
        this.doc.text(String(cell), 45 + (colIndex * colWidth) + 5, currentY + 5, { width: colWidth - 10, align: 'left' });
      });

      currentY += 20;
    });

    this.doc.y = currentY + 10;
  }

  addCodeBlock(title, codeString) {
    const lines = codeString.split('\n');
    const blockHeight = (lines.length * 12) + 20;
    this.checkPageBreak(blockHeight + 30);
    this.doc.moveDown(0.5);

    const y = this.doc.y;
    const width = this.doc.page.width - 90;

    this.doc.rect(45, y, width, 18).fill('#1E293B');
    this.doc.fillColor('#94A3B8').font('Helvetica-Bold').fontSize(7.5).text(title, 55, y + 4);

    this.doc.rect(45, y + 18, width, blockHeight - 18).fill('#0F172A');
    this.doc.fillColor('#38BDF8').font('Courier').fontSize(7.5);

    lines.forEach((line, idx) => {
      this.doc.text(line, 55, y + 24 + (idx * 12));
    });

    this.doc.y = y + blockHeight + 10;
  }

  addHorizontalDivider() {
    this.doc.moveTo(45, this.doc.y).lineTo(this.doc.page.width - 45, this.doc.y).strokeColor(COLOR_BORDER).stroke();
    this.doc.moveDown(0.5);
  }

  async build() {
    const range = this.doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      this.doc.switchToPage(i);

      // Encabezado Superior (a partir de la página 2)
      if (i > 0) {
        this.doc.fillColor(COLOR_MUTED)
           .fontSize(7.5)
           .font('Helvetica-Bold')
           .text(`SEMILLERO DE INVESTIGACIÓN SISINFO — ${this.docTitle.toUpperCase()}`, 45, 20, { align: 'left' });
        this.doc.moveTo(45, 30).lineTo(this.doc.page.width - 45, 30).strokeColor(COLOR_BORDER).stroke();
      }

      // Pie de Página Institucional
      this.doc.moveTo(45, this.doc.page.height - 35).lineTo(this.doc.page.width - 45, this.doc.page.height - 35).strokeColor(COLOR_BORDER).stroke();
      this.doc.fillColor(COLOR_MUTED)
         .fontSize(8)
         .font('Helvetica')
         .text(`Página ${i + 1} de ${range.count}`, 45, this.doc.page.height - 25, { align: 'right' });
      this.doc.text('Documento Formal de Auditoría y Manual Operativo — Todos los Derechos Reservados SISINFO', 45, this.doc.page.height - 25, { align: 'left' });
    }

    this.doc.end();
    return new Promise((resolve) => this.stream.on('finish', resolve));
  }
}

// ============================================================================
// GENERACIÓN 1: MANUAL DE USUARIO COMPLETO Y EXHAUSTIVO
// ============================================================================
async function generateExhaustiveUserManual() {
  const pdf = new ProfessionalPdfBuilder(
    path.join(__dirname, '../Manual_de_Usuario_SisInfo.pdf'),
    'Manual de Usuario y Guía Operativa Completa',
    'Documento Formal para Entidades Evaluadoras, Auditoría y Usuarios del Sistema (Versión 1.0)'
  );

  // Ficha del Documento
  pdf.addSectionHeader('FICHA TÉCNICA Y CONTROL DEL DOCUMENTO');
  pdf.addTable(
    ['Propiedad / Atributo', 'Especificación Formal'],
    [
      ['Nombre del Sistema', 'Plataforma Web Semillero SISINFO & Aula Virtual'],
      ['Entidad Propietaria', 'Semillero de Investigación SISINFO — UNIPAZ'],
      ['Propósito', 'Manual de Usuario Integral Desglosado por Roles de Acceso'],
      ['Versión del Software', '1.0.0 (Release para Evaluación Institucional)'],
      ['Tipos de Autenticación', 'JWT Supabase Auth con Control RLS en PostgreSQL'],
      ['Módulos Incluidos', 'Proyectos, Convocatorias, Aula Virtual, OVA Builder, Quiz Builder']
    ]
  );

  // CAPÍTULO 1
  pdf.addChapterTitle(1, 'Visión General y Estructura del Sistema');
  pdf.addParagraph('La Plataforma Web del Semillero de Investigación SISINFO es un ecosistema tecnológico integral diseñado para automatizar la gestión administrativa, metodológica y pedagógica de proyectos de investigación formativa.');
  pdf.addParagraph('El sistema centraliza las interacciones entre los administradores de investigación, docentes tutores, estudiantes semilleristas y la comunidad académica general mediante 4 niveles de permisos independientes:');
  
  pdf.addBullet('1. Rol Administrador', 'Acceso al panel de control maestro. Responsable de la gestión de usuarios, asignación de roles, configuración de convocatorias, administración de módulos del Aula Virtual, auditoría de métricas y publicación de noticias institucionales.');
  pdf.addBullet('2. Rol Docente / Investigador', 'Responsable del acompañamiento técnico y metodología de proyectos asignados a su línea de investigación, revisión de entregas documentales, emisión de observaciones, aprobación de proyectos y autoría de OVAs/Quizzes.');
  pdf.addBullet('3. Rol Estudiante / Semillerista', 'Responsable de la postulación de propuestas de investigación, adjunción de avances en formato Word (.docx), respuesta a observaciones de los docentes y realización de cursos/quizzes en el Aula Virtual.');
  pdf.addBullet('4. Rol Usuario Público / Visitante', 'Acceso libre a la vitrina institucional del semillero, consulta del repositorio de proyectos finalizados, agenda de eventos, noticias recientes y portal de ingreso al sistema.');

  // CAPÍTULO 2: ADMINISTRADOR
  pdf.addChapterTitle(2, 'Guía Operativa Detallada para el Rol: Administrador');
  pdf.addParagraph('El Administrador es la máxima autoridad dentro del sistema y cuenta con permisos globales sobre la base de datos.');

  pdf.addSectionHeader('2.1 Acceso y Autenticación del Administrador');
  pdf.addNumberedStep(1, 'Acceso al Portal', 'Diríjase a la página principal del sistema o al pie de página institucional.');
  pdf.addNumberedStep(2, 'Puerta de Acceso Discreta', 'En el pie de página, haga doble clic sobre el icono de escudo institucional para activar la pasarela segura.');
  pdf.addNumberedStep(3, 'Ingreso de Credenciales', 'Introduzca el correo administrativo autorizado (ej: admin.rueda@unipaz.edu.co) y su contraseña maestra.');

  pdf.addSectionHeader('2.2 Gestión de Usuarios y Matriz de Roles');
  pdf.addParagraph('Desde la pestaña "Usuarios" del Panel de Administración, el administrador puede realizar las siguientes operaciones:');
  pdf.addNumberedStep(1, 'Registro de Nuevo Usuario', 'Presione el botón "+ Crear Usuario" en la barra superior de acciones.');
  pdf.addNumberedStep(2, 'Diligenciamiento de Formulario', 'Ingrese el correo institucional (validado bajo la sintaxis oficial), nombres, apellidos, contraseña y seleccione el rol deseado: "estudiante", "docente" o "admin".');
  pdf.addNumberedStep(3, 'Asignación Institucional', 'Para estudiantes, seleccione la Carrera y Semestre. Para docentes, seleccione la Línea de Investigación de su especialidad.');
  pdf.addNumberedStep(4, 'Edición de Perfiles', 'Localice al usuario en la tabla interactiva y presione el botón de edición para actualizar sus datos o cambiar su rol.');
  pdf.addNumberedStep(5, 'Eliminación y Revocación', 'Haga clic en el icono de eliminación para revocar el acceso de un usuario. Esta acción elimina su perfil y desvincula sus sesiones activas.');

  pdf.addCallout('Seguridad en la Asignación de Roles', 'Por políticas RLS en PostgreSQL, las solicitudes directas de asignación de rol desde el cliente son ignoradas si no provienen de la Edge Function oficial con clave de rol de servicio.', 'security');

  pdf.addSectionHeader('2.3 Administración del Aula Virtual y Módulos');
  pdf.addParagraph('El Administrador configura la estructura del Aula Virtual del Semillero:');
  pdf.addBullet('Estructuración de Módulos', 'Crea y edita los módulos educativos correspondientes a las líneas de investigación (Ingeniería de Software, Robótica, Inteligencia Artificial, Redes y Telemática, Seguridad Informática).');
  pdf.addBullet('Supervisión de OVAs', 'Revisa el catálogo de Objetos Virtuales de Aprendizaje creados por los docentes y modifica su visibilidad entre "Borrador" y "Publicado".');
  pdf.addBullet('Matriz de Resultados', 'Consulta el seguimiento en tiempo real de los quizzes resueltos por los estudiantes, incluyendo calificaciones y porcentaje de acierto.');

  pdf.addSectionHeader('2.4 Gestión de Contenido Público (Noticias y Eventos)');
  pdf.addParagraph('En la pestaña "Inicio", el administrador gestiona la información divulgada a la comunidad:');
  pdf.addBullet('Noticias del Semillero', 'Publica artículos con imágenes de portada, títulos y contenido sobre logros o investigaciones del semillero.');
  pdf.addBullet('Eventos Académicos', 'Agenda ponencias, congresos y fechas límite de entregas de convocatorias.');
  pdf.addBullet('Galería Multimedia', 'Sube imágenes de actividades y semilleristas a la galería del portal.');

  // CAPÍTULO 3: DOCENTE
  pdf.addChapterTitle(3, 'Guía Operativa Detallada para el Rol: Docente / Investigador');
  pdf.addParagraph('El Docente tutor acompaña el desarrollo técnico de los proyectos y crea contenido didáctico en el Aula Virtual.');

  pdf.addSectionHeader('3.1 Evaluación y Seguimiento de Proyectos');
  pdf.addParagraph('Al ingresar al Panel de Docente, se presentan las pestañas "En Revisión", "Historial" y "Aula Virtual":');
  pdf.addNumberedStep(1, 'Consulta de Proyectos Asignados', 'En "En Revisión", el docente visualiza los proyectos pertenecientes a su línea de investigación.');
  pdf.addNumberedStep(2, 'Descarga de Documentos', 'Presione el botón "Doc" en la tarjeta del proyecto para descargar el archivo Microsoft Word (.docx) cargado por el estudiante.');
  pdf.addNumberedStep(3, 'Adición de Observaciones', 'Presione el botón "Obs" para abrir el modal de retroalimentación. Escriba las observaciones técnicas detalladas y presione "Enviar Revisión". El estudiante recibirá una notificación inmediata.');
  pdf.addNumberedStep(4, 'Transición de Fases', 'Utilice el selector de fases para hacer avanzar el proyecto entre: "Propuesta", "Desarrollo" y "Aplicación".');
  pdf.addNumberedStep(5, 'Aprobación Final', 'Cuando un proyecto alcance la fase de "Aplicación" y cumpla todos los requerimientos, el docente presiona "Aprobar", adjunta el documento avalado firmado y marca el proyecto como COMPLETADO.');

  pdf.addSectionHeader('3.2 Constructor de Objetos Virtuales de Aprendizaje (OVA Builder)');
  pdf.addParagraph('Desde la pestaña "Aula Virtual", el docente presiona "Crear OVA" para abrir el editor avanzado:');
  pdf.addBullet('Datos Generales', 'Define el título del OVA, la descripción corta y la imagen de portada.');
  pdf.addBullet('Información Pedagógica', 'Establece los objetivos de aprendizaje y la introducción conceptual del OVA.');
  pdf.addBullet('Constructor de Secciones', 'Añade bloques dinámicos de contenido utilizando el editor TipTap con soporte para texto enriquecido, títulos H2/H3, negrita, cursiva, listas, citas, bloques de código, imágenes redimensionables y tablas.');
  pdf.addBullet('Recursos Didácticos', 'Enlaza documentos PDF, videos interactivos de YouTube o enlaces a simuladores externos.');
  pdf.addBullet('Autoguardado Automático', 'El editor sincroniza automáticamente el avance en el navegador para evitar pérdida de información.');

  pdf.addSectionHeader('3.3 Constructor de Quizzes e Instrumentos de Evaluación');
  pdf.addParagraph('Al final del OVA, el docente puede estructurar una evaluación interactiva utilizando el "Quiz Builder":');
  pdf.addBullet('Preguntas de Opción Múltiple', 'Define la pregunta, múltiples opciones y marca la opción correcta.');
  pdf.addBullet('Preguntas de Verdadero / Falso', 'Establece la afirmación y selecciona el valor de verdad esperado.');
  pdf.addBullet('Completar Código', 'Escribe una plantilla de código sustituyendo variables o comandos con tres guiones bajos (___) para que el estudiante los llene.');

  // CAPÍTULO 4: ESTUDIANTE
  pdf.addChapterTitle(4, 'Guía Operativa Detallada para el Rol: Estudiante / Semillerista');
  pdf.addParagraph('El Estudiante utiliza la plataforma para inscribir su proyecto, recibir asesoría y formarse en el Aula Virtual.');

  pdf.addSectionHeader('4.1 Radicación de Proyectos de Investigación');
  pdf.addNumberedStep(1, 'Acceso al Panel', 'Inicie sesión con sus credenciales de estudiante para ver su panel de control.');
  pdf.addNumberedStep(2, 'Formulario de Registro', 'Presione "Nuevo Proyecto" y complete el nombre de la propuesta, la línea de investigación y el docente asesor.');
  pdf.addNumberedStep(3, 'Carga del Documento', 'Adjunte el archivo del proyecto en formato .docx (máximo 20MB) y presione "Registrar Proyecto".');

  pdf.addSectionHeader('4.2 Flujo de Correcciones y Control de Versiones');
  pdf.addNumberedStep(1, 'Recepción de Observaciones', 'Consulte el icono de notificaciones en la barra superior para saber si el docente realizó observaciones.');
  pdf.addNumberedStep(2, 'Subida de Corrección', 'Abra el proyecto, presione "Enviar Corrección", adjunte la versión corregida del documento Word e incluya una nota de cambio.');
  pdf.addNumberedStep(3, 'Historial de Versiones', 'Verifique el historial cronológico para comparar las entregas anteriores y las respuestas del tutor.');

  pdf.addSectionHeader('4.3 Formación en el Aula Virtual');
  pdf.addParagraph('En la sección "Módulos", el estudiante navega por las lecciones OVA de su especialidad, estudia los bloques interactivos y responde el Quiz Final para obtener su retroalimentación inmediata.');

  // CAPÍTULO 5: USUARIO PÚBLICO
  pdf.addChapterTitle(5, 'Guía Operativa para Usuarios Públicos / Visitantes');
  pdf.addParagraph('El usuario visitante puede explorar la vitrina del semillero sin necesidad de registro:');
  pdf.addBullet('Portal Principal', 'Visualiza la misión, visión, noticias de actualidad y eventos académicos.');
  pdf.addBullet('Repositorio Institucional', 'Filtra y consulta los proyectos terminados del semillero, con opción de descargar la documentación autorizada.');
  pdf.addBullet('Información de Contacto', 'Envía inquietudes directas al semillero a través del formulario de contacto.');

  // CAPÍTULO 6: PREGUNTAS FRECUENTES
  pdf.addChapterTitle(6, 'Preguntas Frecuentes (FAQ) y Solución de Problemas');
  pdf.addBullet('¿Por qué recibo un error al subir un documento?', 'Asegúrese de que el archivo esté en formato Microsoft Word (.doc o .docx) y no supere los 20MB.');
  pdf.addBullet('¿Qué pasa si olvido mi contraseña?', 'Contacte al Administrador del Semillero para restablecer sus credenciales desde el panel de gestión de usuarios.');
  pdf.addBullet('¿Los quizzes tienen límite de intentos?', 'Depende de la configuración dada por el docente tutor en el módulo correspondiente.');

  await pdf.build();
  console.log('✅ Manual de Usuario Exhaustivo generado exitosamente.');
}

// ============================================================================
// GENERACIÓN 2: DOCUMENTACIÓN TÉCNICA COMPLETA Y EXHAUSTIVA
// ============================================================================
async function generateExhaustiveTechnicalDoc() {
  const pdf = new ProfessionalPdfBuilder(
    path.join(__dirname, '../Documentacion_Tecnica_SisInfo.pdf'),
    'Documentación Técnica y de Arquitectura de Software',
    'Especificación para Evaluadores de Código, Arquitectos y Auditoría de Seguridad (Versión 1.0)'
  );

  // Ficha Técnica
  pdf.addSectionHeader('FICHA TÉCNICA DEL REPOSITORIO GITHUB');
  pdf.addTable(
    ['Parámetro Técnico', 'Detalle de Configuración'],
    [
      ['Repositorio de GitHub', 'danielpose1996-stack/ingsisinfo'],
      ['Rama Principal', 'main'],
      ['Framework Frontend', 'React 19.2.4 + Vite 6.1.1'],
      ['Estilos & CSS', 'Tailwind CSS v4 + PostCSS + Framer Motion'],
      ['Base de Datos & Backend', 'Supabase PostgreSQL + Row Level Security (RLS)'],
      ['Linter & Calidad', 'ESLint 9 con reglas de React Hooks y Refresh']
    ]
  );

  // SECCIÓN 1: ARQUITECTURA
  pdf.addChapterTitle(1, 'Arquitectura Global del Sistema');
  pdf.addParagraph('SISINFO adopta una arquitectura de Aplicación de Página Única (SPA - Single Page Application) basada en React 19, desacoplada de un Backend como Servicio (BaaS) operado sobre Supabase.');
  pdf.addParagraph('El flujo de datos sigue el patrón de unidireccionalidad de React con persistencia reactiva en tiempo real:');
  
  pdf.addCodeBlock('Flujo de Datos y Capa de Autenticación', 
`[ Navegador Cliente / React 19 ]
       │
       ▼ (Estado Global & Tokens JWT)
 [ AuthContext.jsx ] ──► (Validación de Roles y Permisos)
       │
       ▼ (Abstracción de Servicios API)
 [ src/lib/supabase.js ]
       │
       ▼ (Consultas Parametrizadas HTTPS / PostgREST)
 [ Supabase Engine ]
       ├──► PostgreSQL Database (Políticas RLS en Tablas)
       ├──► Storage Buckets (documentos-proyectos & archivos-ova)
       └──► Edge Functions (create-user con service_role)`
  );

  // SECCIÓN 2: BASE DE DATOS Y RLS
  pdf.addChapterTitle(2, 'Modelo Relacional de Base de Datos y Políticas RLS');
  pdf.addParagraph('La seguridad y aislamiento de los datos se implementa directamente en la capa de persistencia mediante Políticas de Seguridad a Nivel de Fila (RLS) en PostgreSQL.');

  pdf.addSectionHeader('2.1 Tablas del Sistema y Esquema Relacional');
  pdf.addTable(
    ['Nombre de Tabla', 'Clave Primaria / Foránea', 'Propósito en el Sistema'],
    [
      ['public.perfiles', 'id (PK -> auth.users.id)', 'Información de perfil, nombre, rol y carrera/línea.'],
      ['public.proyectos', 'id (PK UUID), estudiante_id, docente_id', 'Propuestas de investigación y estado de avance.'],
      ['public.versiones_proyecto', 'id (PK UUID), proyecto_id (FK)', 'Historial de entregables .docx subidos.'],
      ['public.observaciones', 'id (PK UUID), proyecto_id (FK)', 'Retroalimentaciones emitidas por los docentes.'],
      ['public.notificaciones', 'id (PK UUID), usuario_id (FK)', 'Alertas del sistema enviadas a usuarios.'],
      ['public.modulos', 'id (PK UUID)', 'Módulos educativos del Aula Virtual.'],
      ['public.ovas', 'id (PK UUID), modulo_id (FK)', 'Objetos Virtuales de Aprendizaje con contenido JSONB.'],
      ['public.seguimiento_ovas', 'id (PK UUID), ova_id (FK), usuario_id', 'Registro de resultados de quizzes presentados.']
    ]
  );

  pdf.addSectionHeader('2.2 Definición de Políticas RLS (Security Policies)');
  pdf.addParagraph('A continuación se resumen las políticas SQL configuradas en la migración `supabase/migrations/secure_rls_policies.sql`:');

  pdf.addCodeBlock('Extracto de Políticas RLS en PostgreSQL',
`-- Lectura pública de perfiles autenticados
CREATE POLICY "Permitir lectura de perfiles a usuarios autenticados"
ON public.perfiles FOR SELECT
TO authenticated USING (true);

-- Restricción estricta de actualización de perfiles (Evita escalamiento de rol)
CREATE POLICY "Permitir actualización de perfil propio sin cambiar rol"
ON public.perfiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = id)
WITH CHECK (
  (auth.uid() = user_id OR auth.uid() = id) AND
  rol = (SELECT rol FROM public.perfiles WHERE id = auth.uid())
);`
  );

  pdf.addCallout('Protección contra Escalamiento de Privilegios', 'El trigger de la base de datos e instrucciones WITH CHECK impiden que un estudiante o docente modifique su propio campo "rol" a "admin" enviando cargas maliciosas desde la consola del navegador.', 'security');

  // SECCIÓN 3: ESTRUCTURA DEL CÓDIGO
  pdf.addChapterTitle(3, 'Estructura de Directorios y Módulos de Código');
  pdf.addParagraph('El repositorio se organiza con una división clara de responsabilidades:');

  pdf.addTable(
    ['Ruta de Archivo', 'Tipo de Componente', 'Responsabilidad Técnica'],
    [
      ['src/App.jsx', 'Router Principal', 'Definición de rutas públicas y protegidas con ProtectedRoute.'],
      ['src/context/AuthContext.jsx', 'Contexto Global', 'Gestión de sesión Supabase Auth, perfil activo y permisos isAdmin.'],
      ['src/lib/supabase.js', 'Capa de Datos', 'Encapsulamiento de clientes Supabase, funciones CRUD y Storage.'],
      ['src/lib/security.js', 'Seguridad', 'Sanitización de cadenas HTML/texto mediante DOMPurify.'],
      ['src/components/RichTextEditor.jsx', 'Editor UI', 'Integración TipTap con soporte de tablas e imágenes redimensionables.'],
      ['src/components/QuizBuilder.jsx', 'Constructor UI', 'Editor interactivode quizzes multimodales con dnd-kit.'],
      ['src/components/QuizPlayer.jsx', 'Reproductor UI', 'Ejecución y calificación automatizada de quizzes para estudiantes.']
    ]
  );

  // SECCIÓN 4: ALMACENAMIENTO Y FUNCIONES EDGE
  pdf.addChapterTitle(4, 'Integración con Supabase Storage y Edge Functions');
  pdf.addSectionHeader('4.1 Almacenamiento de Archivos (Buckets)');
  pdf.addBullet('documentos-proyectos', 'Bucket privado de almacenamiento para archivos de propuestas y entregas finales (.docx). Los enlaces de descarga se generan mediante URLs firmadas con vencimiento temporal para garantizar la privacidad.');
  pdf.addBullet('archivos-ova', 'Bucket público optimizado para imágenes de portadas, recursos didácticos y contenido estático de los OVAs.');

  pdf.addSectionHeader('4.2 Edge Function `create-user`');
  pdf.addParagraph('La creación de usuarios con roles elevados o provisión administrativa se realiza a través de la Edge Function desplegada en Deno:');
  pdf.addCodeBlock('Estructura de la Edge Function create-user',
`import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') // Clave privada aislada en el servidor
  );
  // 1. Crea usuario en auth.users
  // 2. Inserta registro con rol verificado en public.perfiles
});`
  );

  // SECCIÓN 5: AUDITORÍA DE SEGURIDAD
  pdf.addChapterTitle(5, 'Auditoría de Seguridad y Cumplimiento OWASP');
  pdf.addParagraph('Se ha verificado la conformidad del proyecto frente a los estándares de seguridad web OWASP:');
  pdf.addBullet('Prevención XSS', 'Sanitización estricta de todo HTML renderizado en OVAs y vistas mediante DOMPurify.');
  pdf.addBullet('Prevención Inyección SQL', 'Todas las consultas a PostgreSQL se ejecutan mediante peticiones HTTP parametrizadas gestionadas por la librería oficial `@supabase/supabase-js`.');
  pdf.addBullet('Verificación de Secreto Cero', 'Se auditó el código completo confirmando que ninguna clave maastrá (`SUPABASE_SERVICE_ROLE_KEY`) ni contraseña real permanezca expuesta en el repositorio rastreado por Git.');

  // SECCIÓN 6: COMPILACIÓN Y DESPLIEGUE
  pdf.addChapterTitle(6, 'Guía de Compilación y Despliegue en Producción');
  pdf.addParagraph('Pasos para compilar y desplegar la aplicación en cualquier servidor o plataforma Cloud (Vercel, Netlify):');
  pdf.addNumberedStep(1, 'Instalación de Dependencias', 'npm install');
  pdf.addNumberedStep(2, 'Compilación de Producción', 'npm run build (Genera bundle optimizado en directorio /dist).');
  pdf.addNumberedStep(3, 'Configuración Vercel', 'El archivo vercel.json incluye la regla de reescritura `{"source": "/(.*)", "destination": "/index.html"}` para dar soporte completo a las rutas del cliente.');

  await pdf.build();
  console.log('✅ Documentación Técnica Exhaustiva generada exitosamente.');
}

async function run() {
  console.log('🚀 Iniciando generación de PDFs completos y detallados...');
  await generateExhaustiveUserManual();
  await generateExhaustiveTechnicalDoc();
  console.log('🎉 Ambos PDFs fueron generados exitosamente en la raíz del proyecto.');
}

run();
