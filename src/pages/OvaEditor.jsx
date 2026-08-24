import React, { useState, useRef, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import ContentBlock from '../components/ContentBlock';
import RichTextEditor from '../components/RichTextEditor';
import QuizBuilder from '../components/QuizBuilder';
import CourseStructureEditor from '../components/CourseStructureEditor';
import Button from '../components/Button';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  Save,
  Plus,
  Image as ImageIcon,
  Trash2,
  BookOpen,
  FileDown,
  Youtube,
  Globe,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  Layers,
  FileText,
  Award,
  Loader2,
  FileCode,
  Video
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OvaEditor({
  ovaForm,
  setOvaForm,
  editingOva,
  onSave,
  onCancel,
  onFileUpload,
  uploadingFiles = {},
  hasDraft,
  draftData,
  onRecoverDraft,
  onDiscardDraft,
}) {
  const [activeSection, setActiveSection] = useState(null);
  const sectionRefs = useRef({});
  const [isSaving, setIsSaving] = useState(false);

  // Generar IDs únicos para las secciones si no cuentan con uno en modo manual
  useEffect(() => {
    if (ovaForm.tipo === 'manual' && Array.isArray(ovaForm.contenido)) {
      const needsIds = ovaForm.contenido?.some((s, i) => !s._id);
      if (needsIds) {
        setOvaForm({
          ...ovaForm,
          contenido: ovaForm.contenido.map((s, i) => ({
            ...s,
            _id: s._id || `section-${Date.now()}-${i}`,
          })),
        });
      }
    }
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id && Array.isArray(ovaForm.contenido)) {
      const oldIndex = ovaForm.contenido.findIndex(s => s._id === active.id);
      const newIndex = ovaForm.contenido.findIndex(s => s._id === over.id);
      const newContenido = arrayMove(ovaForm.contenido, oldIndex, newIndex);
      setOvaForm({ ...ovaForm, contenido: newContenido });
    }
  };

  const handleAddSection = () => {
    const newSection = {
      _id: `section-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      titulo: '',
      contenido: '',
      recurso_url: '',
      tipo: 'texto',
    };
    setOvaForm({
      ...ovaForm,
      contenido: [...(Array.isArray(ovaForm.contenido) ? ovaForm.contenido : []), newSection],
    });
    setTimeout(() => {
      const el = document.getElementById(`section-${ovaForm.contenido?.length || 0}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleUpdateSection = (index, updatedSection) => {
    const newContenido = [...(Array.isArray(ovaForm.contenido) ? ovaForm.contenido : [])];
    newContenido[index] = updatedSection;
    setOvaForm({ ...ovaForm, contenido: newContenido });
  };

  const handleRemoveSection = (index) => {
    if (!Array.isArray(ovaForm.contenido) || ovaForm.contenido.length <= 1) {
      toast.error('El OVA debe tener al menos una sección de contenido.');
      return;
    }
    const newContenido = [...ovaForm.contenido];
    newContenido.splice(index, 1);
    setOvaForm({ ...ovaForm, contenido: newContenido });
  };

  const scrollToSection = (id) => {
    setActiveSection(id);
    const element = sectionRefs.current[id] || document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave();
    } finally {
      setIsSaving(false);
    }
  };

  const isHtml = ovaForm.tipo === 'html';
  const isCurso = ovaForm.tipo === 'curso';

  const courseSections = isCurso
    ? (ovaForm.contenido?.secciones || (Array.isArray(ovaForm.contenido) ? ovaForm.contenido : []))
    : [];

  const sidebarSections = isHtml
    ? [
        { id: 'datos-generales', label: 'Datos Generales', icon: FileText },
        { id: 'paquete-html', label: 'Paquete Web HTML5', icon: FileCode },
      ]
    : isCurso
    ? [
        { id: 'datos-generales', label: 'Datos Generales', icon: FileText },
        { id: 'estructura-curso', label: `Estructura (${courseSections.length} secciones)`, icon: Video },
      ]
    : [
        { id: 'datos-generales', label: 'Datos Generales', icon: FileText },
        { id: 'introduccion', label: 'Introducción', icon: BookOpen },
        { id: 'secciones', label: `Secciones (${Array.isArray(ovaForm.contenido) ? ovaForm.contenido.length : 0})`, icon: Layers },
        { id: 'recursos', label: 'Material de Apoyo', icon: FileDown },
        { id: 'evaluacion', label: 'Evaluación Quiz', icon: Award },
      ];

  const handleTypeChange = (newType) => {
    let newContenido = ovaForm.contenido;
    if (newType === 'curso') {
      if (!newContenido?.secciones && (!Array.isArray(newContenido) || newContenido.length === 0 || !newContenido[0]?.lecciones)) {
        newContenido = {
          secciones: [
            {
              id: `sec-${Date.now()}-1`,
              titulo: 'Sección 1: Introducción y Fundamentos',
              descripcion: 'Módulo inicial del curso',
              orden: 0,
              lecciones: [
                {
                  id: `lec-${Date.now()}-1`,
                  titulo: 'Lección 1: Bienvenida al Curso',
                  descripcion: '',
                  video_url: '',
                  duracion: '10 min',
                  notas: '',
                  recursos: [],
                  quiz: { activo: false, preguntas: [] }
                }
              ],
              quiz: { activo: false, preguntas: [] }
            }
          ],
          quiz_final: { activo: false, preguntas: [] }
        };
      }
    } else if (newType === 'manual') {
      if (!Array.isArray(newContenido) || newContenido[0]?.lecciones) {
        newContenido = [{ _id: `section-${Date.now()}-0`, titulo: '', contenido: '', recurso_url: '', tipo: 'texto' }];
      }
    }
    setOvaForm({ ...ovaForm, tipo: newType, contenido: newContenido });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[80vh]">
      {/* ═══════════════════════════════════════ */}
      {/* BARRA LATERAL - Panel de Control        */}
      {/* ═══════════════════════════════════════ */}
      <aside className="hidden lg:block w-72 shrink-0">
        <div className="sticky top-20 space-y-5">
          {/* Navegación de Regreso y Encabezado */}
          <div className="p-4 rounded-2xl bg-card border border-card-border shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onCancel}
                title="Volver a la lista de OVAs"
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-foreground/70 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {editingOva ? (isCurso ? 'Editar Curso' : 'Editar OVA') : (isCurso ? 'Nuevo Curso' : 'Nuevo OVA')}
                </h3>
                <p className="text-[11px] text-foreground/50">Constructor de Contenido</p>
              </div>
            </div>

            {/* Alternador de Estado (Borrador / Publicado) */}
            <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-card-border flex gap-1">
              <button
                type="button"
                onClick={() => setOvaForm({ ...ovaForm, estado: 'borrador' })}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  ovaForm.estado === 'borrador'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Borrador</span>
              </button>
              <button
                type="button"
                onClick={() => setOvaForm({ ...ovaForm, estado: 'publicado' })}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  ovaForm.estado === 'publicado'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Publicado</span>
              </button>
            </div>
          </div>

          {/* Índice Rápido de Secciones */}
          <div className="p-4 rounded-2xl bg-card border border-card-border shadow-sm space-y-2">
            <h4 className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider px-2">
              Secciones del Documento
            </h4>
            <nav className="space-y-1">
              {sidebarSections.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollToSection(item.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-foreground/70 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all text-left cursor-pointer group"
                  >
                    <Icon className="w-4 h-4 text-foreground/40 group-hover:text-[#15326C] dark:group-hover:text-blue-400 transition-colors" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Botón Guardar Principal */}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full gap-2 py-3 bg-[#15326C] hover:bg-[#1E40AF] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm cursor-pointer transition-all active:scale-98"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isCurso ? 'Guardar Curso' : 'Guardar OVA'}</span>
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* ═══════════════════════════════════════ */}
      {/* ÁREA PRINCIPAL DE TRABAJO               */}
      {/* ═══════════════════════════════════════ */}
      <main className="flex-1 space-y-6 min-w-0">
        {/* Banner de Borrador Detectado */}
        <AnimatePresence>
          {hasDraft && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-[#15326C] dark:text-blue-400">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Borrador automático disponible</h4>
                    <p className="text-[11px] text-foreground/60">
                      Existe una versión guardada en tu navegador ({new Date(draftData?.lastSaved).toLocaleTimeString()}).
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDiscardDraft}
                    className="text-xs font-medium border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                  >
                    Descartar
                  </Button>
                  <Button
                    size="sm"
                    onClick={onRecoverDraft}
                    className="text-xs font-bold bg-[#15326C] hover:bg-[#1E40AF] text-white"
                  >
                    Recuperar
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Encabezado en dispositivos móviles */}
        <div className="lg:hidden flex items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-card-border shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-foreground/70"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-bold text-foreground">
              {editingOva ? (isCurso ? 'Editar Curso' : 'Editar OVA') : (isCurso ? 'Nuevo Curso' : 'Nuevo OVA')}
            </h3>
          </div>
          <Button onClick={handleSave} disabled={isSaving} size="sm" className="gap-1.5 text-xs bg-[#15326C] text-white">
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Guardando...' : 'Guardar'}</span>
          </Button>
        </div>

        {/* ─── 1. DATOS GENERALES ─── */}
        <section id="datos-generales" className="scroll-mt-24">
          <div className="bg-card border border-card-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-card-border">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#15326C] dark:text-blue-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Datos Generales</h4>
                  <p className="text-[11px] text-foreground/50">Configuración básica e información del contenido</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Selector de Modalidad */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-semibold text-foreground/70">
                  Modalidad de Contenido *
                </label>
                <select
                  value={ovaForm.tipo || 'manual'}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-xs font-semibold text-foreground focus:border-[#15326C] dark:focus:border-blue-500 outline-none transition-colors cursor-pointer"
                >
                  <option value="manual">📘 Constructor Interactivo (Texto, Multimedia y Quizzes)</option>
                  <option value="curso">🎓 Curso Estructurado (Secciones, Lecciones en Video de YouTube y Quizzes)</option>
                  <option value="html">🌐 Paquete Web HTML5 (Archivo interactivo .html empaquetado)</option>
                </select>
              </div>

              {/* Título */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-semibold text-foreground/70">
                  {isCurso ? 'Título del Curso *' : 'Título del OVA *'}
                </label>
                <input
                  type="text"
                  placeholder={isCurso ? "Ej: Curso Completo de Redes de Computadoras y Enrutamiento" : "Ej: Fundamentos de Robótica Móvil y Sensores"}
                  value={ovaForm.titulo || ''}
                  onChange={(e) => setOvaForm({ ...ovaForm, titulo: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-sm font-bold text-foreground focus:border-[#15326C] dark:focus:border-blue-500 outline-none transition-colors"
                />
              </div>

              {/* Objetivo Pedagógico (si no es html) */}
              {!isHtml && (
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-semibold text-foreground/70">
                    Objetivo Pedagógico {isCurso ? '(Opcional)' : '*'}
                  </label>
                  <textarea
                    placeholder="Describe las competencias y aprendizajes que el estudiante adquirirá al finalizar..."
                    value={ovaForm.objetivo || ''}
                    onChange={(e) => setOvaForm({ ...ovaForm, objetivo: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-xs text-foreground focus:border-[#15326C] dark:focus:border-blue-500 outline-none transition-colors h-20 resize-none leading-relaxed"
                  />
                </div>
              )}

              {/* Imagen de Portada */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-semibold text-foreground/70">
                  Imagen de Portada (Opcional)
                </label>
                {uploadingFiles?.['portada'] ? (
                  <div className="flex flex-col items-center justify-center gap-2 w-full h-32 rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20">
                    <Loader2 className="w-6 h-6 text-[#15326C] dark:text-blue-400 animate-spin" />
                    <span className="text-xs text-[#15326C] dark:text-blue-300 font-semibold">
                      Subiendo imagen de portada...
                    </span>
                  </div>
                ) : ovaForm.imagen_portada ? (
                  <div className="relative group rounded-2xl overflow-hidden border border-card-border max-h-56 bg-slate-900 flex items-center justify-center">
                    <img src={ovaForm.imagen_portada} className="w-full h-full object-cover max-h-56" alt="Portada" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setOvaForm({ ...ovaForm, imagen_portada: '' })}
                        className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Eliminar imagen</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2.5 w-full h-28 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-[#15326C] dark:hover:border-blue-500/50 bg-slate-50/50 dark:bg-slate-900/30 cursor-pointer transition-all group">
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/50 text-slate-400 group-hover:text-[#15326C] dark:group-hover:text-blue-400 transition-colors">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <span className="block text-xs font-semibold text-foreground/70 group-hover:text-foreground transition-colors">
                        Haz clic para seleccionar una fotografía
                      </span>
                      <span className="block text-[10px] text-foreground/40">Formatos recomendados: JPG, PNG o WebP</span>
                    </div>
                    <input type="file" accept="image/*" onChange={(e) => onFileUpload(e, 'portada')} className="hidden" />
                  </label>
                )}
              </div>

              {/* Descripción Breve */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-semibold text-foreground/70">
                  Descripción Breve
                </label>
                <input
                  type="text"
                  placeholder="Resumen ejecutivo del contenido y alcance pedagógico..."
                  value={ovaForm.descripcion || ''}
                  onChange={(e) => setOvaForm({ ...ovaForm, descripcion: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-xs text-foreground focus:border-[#15326C] dark:focus:border-blue-500 outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ─── 2. MODALIDAD CURSO: GESTOR DE SECCIONES Y VIDEOS ─── */}
        {isCurso && (
          <section id="estructura-curso" className="scroll-mt-24">
            <CourseStructureEditor
              courseData={
                typeof ovaForm.contenido === 'object' && !Array.isArray(ovaForm.contenido)
                  ? ovaForm.contenido
                  : { secciones: Array.isArray(ovaForm.contenido) ? ovaForm.contenido : [], quiz_final: { activo: false, preguntas: [] } }
              }
              onChange={(newCourseData) => setOvaForm({ ...ovaForm, contenido: newCourseData })}
              onFileUpload={onFileUpload}
              uploadingFiles={uploadingFiles}
            />
          </section>
        )}

        {/* ─── 3. MODALIDAD HTML: PAQUETE WEB ─── */}
        {isHtml && (
          <section id="paquete-html" className="scroll-mt-24">
            <div className="bg-card border border-card-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-card-border">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#15326C] dark:text-blue-400">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Paquete Web HTML5</h4>
                    <p className="text-[11px] text-foreground/50">Carga del archivo de contenido interactivo</p>
                  </div>
                </div>
              </div>

              {uploadingFiles?.['html'] ? (
                <div className="flex flex-col items-center justify-center gap-3 w-full h-40 rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20">
                  <Loader2 className="w-8 h-8 text-[#15326C] dark:text-blue-400 animate-spin" />
                  <div className="text-center">
                    <span className="block text-xs font-bold text-[#15326C] dark:text-blue-300">
                      Subiendo y procesando paquete HTML...
                    </span>
                    <span className="block text-[11px] text-foreground/50">Almacenando en servidor seguro</span>
                  </div>
                </div>
              ) : ovaForm.archivo_html_url && !ovaForm.archivo_html_url.includes('documentos-proyectos') ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50">
                      <FileCode className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-bold text-foreground">Archivo HTML activo</h5>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                          Listo para reproducir
                        </span>
                      </div>
                      <p className="text-[11px] text-foreground/50 truncate max-w-md mt-0.5">
                        El paquete está vinculado y disponible para los estudiantes.
                      </p>
                    </div>
                  </div>

                  <button 
                    type="button" 
                    onClick={() => setOvaForm({ ...ovaForm, archivo_html_url: '' })} 
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50 rounded-xl transition-colors cursor-pointer shrink-0"
                    title="Reemplazar archivo HTML"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Reemplazar Archivo</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="flex flex-col items-center justify-center gap-3 w-full h-40 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-[#15326C] dark:hover:border-blue-500/50 bg-slate-50/40 dark:bg-slate-900/20 cursor-pointer transition-all group">
                    <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-[#15326C] dark:group-hover:text-blue-400 group-hover:scale-105 transition-all">
                      <FileDown className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <span className="block text-xs font-bold text-foreground group-hover:text-[#15326C] dark:group-hover:text-blue-400 transition-colors">
                        Selecciona o arrastra tu archivo .html
                      </span>
                      <span className="block text-[11px] text-foreground/40 mt-0.5">Acepta paquetes exportados desde herramientas e-learning</span>
                    </div>
                    <input type="file" accept=".html" onChange={(e) => onFileUpload(e, 'html')} className="hidden" />
                  </label>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ─── 4. INTRODUCCIÓN (SOLO SI ES MANUAL) ─── */}
        {!isHtml && !isCurso && (
          <section id="introduccion" className="scroll-mt-24">
            <div className="bg-card border border-card-border rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
              <div className="flex items-center gap-2.5 pb-3 border-b border-card-border">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#15326C] dark:text-blue-400">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Introducción</h4>
                  <p className="text-[11px] text-foreground/50">Marco inicial y bienvenida a la lección</p>
                </div>
              </div>
              <RichTextEditor
                content={ovaForm.introduccion || ''}
                onChange={(html) => setOvaForm({ ...ovaForm, introduccion: html })}
                placeholder="Escribe el marco introductorio del OVA..."
                minHeight="140px"
              />
            </div>
          </section>
        )}

        {/* ─── 5. ESTRUCTURA DE CONTENIDO DINÁMICO (SOLO SI ES MANUAL) ─── */}
        {!isHtml && !isCurso && (
          <section id="secciones" className="scroll-mt-24 space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                  <Layers className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-foreground">
                  Secciones de Contenido ({Array.isArray(ovaForm.contenido) ? ovaForm.contenido.length : 0})
                </h4>
              </div>
              <button
                type="button"
                onClick={handleAddSection}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-[#15326C] dark:text-blue-400 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir Sección</span>
              </button>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={(Array.isArray(ovaForm.contenido) ? ovaForm.contenido : []).map(s => s._id)}
                verticalListSortingStrategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  <AnimatePresence>
                    {(Array.isArray(ovaForm.contenido) ? ovaForm.contenido : []).map((section, idx) => (
                      <motion.div
                        key={section._id}
                        id={`section-${idx}`}
                        className="scroll-mt-24"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ContentBlock
                          id={section._id}
                          index={idx}
                          section={section}
                          onUpdate={(updated) => handleUpdateSection(idx, updated)}
                          onRemove={() => handleRemoveSection(idx)}
                          onFileUpload={onFileUpload}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </SortableContext>
            </DndContext>

            {/* Botón grande para añadir sección */}
            <button
              type="button"
              onClick={handleAddSection}
              className="w-full py-5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-[#15326C] dark:hover:border-blue-500/50 text-foreground/50 hover:text-[#15326C] dark:hover:text-blue-400 transition-all flex items-center justify-center gap-2 group cursor-pointer bg-card/40"
            >
              <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold">Añadir nueva sección de contenido</span>
            </button>
          </section>
        )}

        {/* ─── 6. MATERIAL COMPLEMENTARIO (SOLO SI ES MANUAL) ─── */}
        {!isHtml && !isCurso && (
          <section id="recursos" className="scroll-mt-24">
            <div className="bg-card border border-card-border rounded-2xl p-6 sm:p-8 space-y-5 shadow-sm">
              <div className="flex items-center gap-2.5 pb-3 border-b border-card-border">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#15326C] dark:text-blue-400">
                  <FileDown className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Material de Apoyo</h4>
                  <p className="text-[11px] text-foreground/50">Recursos externos y descargables complementarios</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Guía PDF */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <label className="flex items-center gap-2 text-xs font-semibold text-foreground/80">
                    <FileText className="w-3.5 h-3.5 text-red-500" />
                    <span>Guía o Lectura PDF</span>
                  </label>
                  {uploadingFiles?.['pdf'] ? (
                    <div className="flex items-center justify-center gap-2 text-xs text-[#15326C] dark:text-blue-400 bg-blue-50/60 p-3 rounded-lg">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span className="font-semibold text-[10px]">Subiendo PDF...</span>
                    </div>
                  ) : ovaForm.recursos?.pdf_url ? (
                    <div className="flex items-center justify-between text-xs text-foreground bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="font-medium truncate max-w-[150px]">PDF cargado</span>
                      <button 
                        type="button" 
                        onClick={() => setOvaForm({ ...ovaForm, recursos: { ...ovaForm.recursos, pdf_url: '' } })} 
                        className="text-red-500 hover:text-red-600 p-1 cursor-pointer"
                        title="Eliminar PDF"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:border-[#15326C] text-foreground/60 hover:text-[#15326C] cursor-pointer transition-all text-xs font-medium bg-white/50 dark:bg-slate-800/40">
                      <Plus className="w-3 h-3" />
                      <span>Adjuntar archivo PDF</span>
                      <input type="file" accept=".pdf" onChange={(e) => onFileUpload(e, 'pdf')} className="hidden" />
                    </label>
                  )}
                </div>

                {/* 2. Video YouTube */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <label className="flex items-center gap-2 text-xs font-semibold text-foreground/80">
                    <Youtube className="w-3.5 h-3.5 text-red-600" />
                    <span>Video YouTube</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={ovaForm.recursos?.youtube_url || ''}
                    onChange={(e) => setOvaForm({ ...ovaForm, recursos: { ...ovaForm.recursos, youtube_url: e.target.value } })}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs text-foreground focus:border-[#15326C] outline-none transition-colors"
                  />
                </div>

                {/* 3. Enlace Web */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <label className="flex items-center gap-2 text-xs font-semibold text-foreground/80">
                    <Globe className="w-3.5 h-3.5 text-blue-500" />
                    <span>Enlace Web Externo</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://repositorio.edu/..."
                    value={ovaForm.recursos?.link_externo || ''}
                    onChange={(e) => setOvaForm({ ...ovaForm, recursos: { ...ovaForm.recursos, link_externo: e.target.value } })}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs text-foreground focus:border-blue-500 outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ─── 7. EVALUACIÓN FINAL QUIZ (SOLO SI ES MANUAL) ─── */}
        {!isHtml && !isCurso && (
          <section id="evaluacion" className="scroll-mt-24">
            <div className="bg-card border border-card-border rounded-2xl p-6 sm:p-8 space-y-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-card-border">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Evaluación Final (Quiz Interactivo)</h4>
                    <p className="text-[11px] text-foreground/50">Cuestionario con calificación automática para el estudiante</p>
                  </div>
                </div>
              </div>
              <QuizBuilder
                evaluacion={ovaForm.evaluacion || { instrucciones: '', preguntas: [], nota_minima: 60, tiempo_limite: 0 }}
                onChange={(evaluacion) => setOvaForm({ ...ovaForm, evaluacion })}
              />
            </div>
          </section>
        )}

        {/* Barra inferior para pantallas pequeñas */}
        <div className="lg:hidden pt-4 pb-8 flex gap-3">
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1 py-3 text-xs font-semibold"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-3 text-xs font-bold bg-[#15326C] text-white"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Guardando...' : 'Guardar'}</span>
          </Button>
        </div>
      </main>
    </div>
  );
}
