import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Youtube,
  FileText,
  Award,
  Clock,
  FileDown,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  Video,
  ListPlus,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { extractYouTubeId, getYouTubeEmbedUrl } from '../lib/youtube';
import RichTextEditor from './RichTextEditor';
import QuizBuilder from './QuizBuilder';
import Button from './Button';
import { toast } from 'react-hot-toast';

export default function CourseStructureEditor({ courseData, onChange, onFileUpload, uploadingFiles = {} }) {
  // Garantizar que la estructura de secciones exista siempre
  const secciones = courseData?.secciones || [];
  const quizFinal = courseData?.quiz_final || { activo: false, preguntas: [] };

  const [expandedSections, setExpandedSections] = useState({ 0: true });
  const [activeQuizTarget, setActiveQuizTarget] = useState(null); // { type: 'section'|'lesson'|'final', sectionIndex, lessonIndex }

  const toggleSectionExpand = (index) => {
    setExpandedSections(prev => ({ ...prev, [index]: !prev[index] }));
  };

  // ─── Manejo de Secciones ───
  const handleAddSection = () => {
    const newSection = {
      id: `sec-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      titulo: `Sección ${secciones.length + 1}: `,
      descripcion: '',
      orden: secciones.length,
      lecciones: [
        {
          id: `lec-${Date.now()}-1`,
          titulo: 'Lección 1: Introducción',
          descripcion: '',
          video_url: '',
          duracion: '10 min',
          notas: '',
          recursos: [],
          quiz: { activo: false, preguntas: [] }
        }
      ],
      quiz: { activo: false, preguntas: [] }
    };

    const updated = [...secciones, newSection];
    onChange({ ...courseData, secciones: updated });
    setExpandedSections(prev => ({ ...prev, [secciones.length]: true }));
    toast.success('Nueva sección agregada');
  };

  const handleUpdateSection = (sectionIndex, field, value) => {
    const updated = [...secciones];
    updated[sectionIndex] = { ...updated[sectionIndex], [field]: value };
    onChange({ ...courseData, secciones: updated });
  };

  const handleDeleteSection = (sectionIndex) => {
    if (secciones.length <= 1) {
      toast.error('El curso debe tener al menos una sección');
      return;
    }
    const updated = secciones.filter((_, i) => i !== sectionIndex);
    onChange({ ...courseData, secciones: updated });
    toast.success('Sección eliminada');
  };

  const handleMoveSection = (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= secciones.length) return;

    const updated = [...secciones];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    onChange({ ...courseData, secciones: updated });
  };

  // ─── Manejo de Lecciones ───
  const handleAddLesson = (sectionIndex) => {
    const currentLessons = secciones[sectionIndex]?.lecciones || [];
    const newLesson = {
      id: `lec-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      titulo: `Lección ${currentLessons.length + 1}: `,
      descripcion: '',
      video_url: '',
      duracion: '15 min',
      notas: '',
      recursos: [],
      quiz: { activo: false, preguntas: [] }
    };

    const updated = [...secciones];
    updated[sectionIndex] = {
      ...updated[sectionIndex],
      lecciones: [...currentLessons, newLesson]
    };
    onChange({ ...courseData, secciones: updated });
    toast.success('Lección agregada');
  };

  const handleUpdateLesson = (sectionIndex, lessonIndex, field, value) => {
    const updated = [...secciones];
    const currentLessons = [...(updated[sectionIndex].lecciones || [])];
    currentLessons[lessonIndex] = {
      ...currentLessons[lessonIndex],
      [field]: value
    };
    updated[sectionIndex] = {
      ...updated[sectionIndex],
      lecciones: currentLessons
    };
    onChange({ ...courseData, secciones: updated });
  };

  const handleDeleteLesson = (sectionIndex, lessonIndex) => {
    const currentLessons = secciones[sectionIndex]?.lecciones || [];
    if (currentLessons.length <= 1) {
      toast.error('La sección debe tener al menos una lección');
      return;
    }
    const updated = [...secciones];
    updated[sectionIndex] = {
      ...updated[sectionIndex],
      lecciones: currentLessons.filter((_, i) => i !== lessonIndex)
    };
    onChange({ ...courseData, secciones: updated });
    toast.success('Lección eliminada');
  };

  const handleMoveLesson = (sectionIndex, lessonIndex, direction) => {
    const currentLessons = [...(secciones[sectionIndex]?.lecciones || [])];
    const targetIndex = direction === 'up' ? lessonIndex - 1 : lessonIndex + 1;
    if (targetIndex < 0 || targetIndex >= currentLessons.length) return;

    const temp = currentLessons[lessonIndex];
    currentLessons[lessonIndex] = currentLessons[targetIndex];
    currentLessons[targetIndex] = temp;

    const updated = [...secciones];
    updated[sectionIndex] = {
      ...updated[sectionIndex],
      lecciones: currentLessons
    };
    onChange({ ...courseData, secciones: updated });
  };

  // ─── Manejo de Recursos en Lección ───
  const handleAddResource = (sectionIndex, lessonIndex) => {
    const currentLessons = [...secciones[sectionIndex].lecciones];
    const lesson = currentLessons[lessonIndex];
    const currentRecursos = lesson.recursos || [];
    
    lesson.recursos = [
      ...currentRecursos,
      { nombre: '', url: '', tipo: 'enlace' }
    ];
    handleUpdateLesson(sectionIndex, lessonIndex, 'recursos', lesson.recursos);
  };

  const handleUpdateResource = (sectionIndex, lessonIndex, resIndex, field, value) => {
    const currentLessons = [...secciones[sectionIndex].lecciones];
    const lesson = currentLessons[lessonIndex];
    const recursos = [...(lesson.recursos || [])];
    recursos[resIndex] = { ...recursos[resIndex], [field]: value };
    handleUpdateLesson(sectionIndex, lessonIndex, 'recursos', recursos);
  };

  const handleDeleteResource = (sectionIndex, lessonIndex, resIndex) => {
    const currentLessons = [...secciones[sectionIndex].lecciones];
    const lesson = currentLessons[lessonIndex];
    const recursos = (lesson.recursos || []).filter((_, i) => i !== resIndex);
    handleUpdateLesson(sectionIndex, lessonIndex, 'recursos', recursos);
  };

  // ─── Conteo General del Curso ───
  const totalLecciones = secciones.reduce((acc, s) => acc + (s.lecciones?.length || 0), 0);
  const totalQuizzes = secciones.reduce((acc, s) => {
    const quizSec = s.quiz?.activo && s.quiz?.preguntas?.length > 0 ? 1 : 0;
    const quizLec = (s.lecciones || []).filter(l => l.quiz?.activo && l.quiz?.preguntas?.length > 0).length;
    return acc + quizSec + quizLec;
  }, 0) + (quizFinal.activo && quizFinal.preguntas?.length > 0 ? 1 : 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ─── Encabezado Institucional del Curso (Tema Claro) ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/50 text-[#10346E] dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
              <Video className="w-3.5 h-3.5" />
              <span>Estructura del Curso Modular</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Organizador de Secciones y Lecciones
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              Estructura las unidades temáticas del curso, vincula las lecciones con videos de YouTube, añade apuntes teóricos y asigna evaluaciones formativas.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-700/80 shrink-0">
            <div className="text-center px-3 border-r border-slate-200 dark:border-slate-700">
              <span className="block text-xl font-black text-slate-900 dark:text-white font-mono">{secciones.length}</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Secciones</span>
            </div>
            <div className="text-center px-3 border-r border-slate-200 dark:border-slate-700">
              <span className="block text-xl font-black text-[#10346E] dark:text-blue-400 font-mono">{totalLecciones}</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Lecciones</span>
            </div>
            <div className="text-center px-3">
              <span className="block text-xl font-black text-amber-600 dark:text-amber-400 font-mono">{totalQuizzes}</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Quizzes</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Listado de Secciones ─── */}
      <div className="space-y-5">
        {secciones.map((seccion, sIdx) => {
          const isExpanded = expandedSections[sIdx] !== false;
          const lecciones = seccion.lecciones || [];
          const hasSectionQuiz = seccion.quiz?.activo && (seccion.quiz?.preguntas?.length || 0) > 0;

          return (
            <div
              key={seccion.id || sIdx}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs transition-all duration-200"
            >
              {/* Cabecera de la Sección */}
              <div className="p-5 sm:p-6 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <button
                    type="button"
                    onClick={() => toggleSectionExpand(sIdx)}
                    className="p-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer transition-colors"
                    title={isExpanded ? 'Colapsar sección' : 'Expandir sección'}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  <div className="w-8 h-8 rounded-xl bg-[#10346E] text-white font-bold text-xs flex items-center justify-center shrink-0 font-mono shadow-xs">
                    {sIdx + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={seccion.titulo}
                      onChange={(e) => handleUpdateSection(sIdx, 'titulo', e.target.value)}
                      placeholder="Título de la Sección (ej: Unidad 1: Fundamentos)..."
                      className="w-full bg-transparent font-black text-sm sm:text-base text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none border-b border-transparent focus:border-[#10346E] pb-0.5 transition-colors"
                    />
                    <input
                      type="text"
                      value={seccion.descripcion || ''}
                      onChange={(e) => handleUpdateSection(sIdx, 'descripcion', e.target.value)}
                      placeholder="Descripción u objetivo breve de la sección (opcional)..."
                      className="w-full bg-transparent text-xs text-slate-500 placeholder:text-slate-400 focus:outline-none mt-1"
                    />
                  </div>
                </div>

                {/* Controles de la Sección */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      disabled={sIdx === 0}
                      onClick={() => handleMoveSection(sIdx, 'up')}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
                      title="Mover sección arriba"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={sIdx === secciones.length - 1}
                      onClick={() => handleMoveSection(sIdx, 'down')}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
                      title="Mover sección abajo"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Botón Quiz de Sección */}
                  <button
                    type="button"
                    onClick={() => setActiveQuizTarget({ type: 'section', sectionIndex: sIdx })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                      hasSectionQuiz
                        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    <span>{hasSectionQuiz ? `Quiz de Sección (${seccion.quiz.preguntas.length})` : '+ Quiz de Sección'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteSection(sIdx)}
                    className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 border border-transparent hover:border-red-200 dark:hover:border-red-900/50 transition-colors cursor-pointer"
                    title="Eliminar esta sección"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Contenido Expandible de la Sección */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="p-5 sm:p-6 space-y-5"
                  >
                    {/* Lecciones de la Sección */}
                    <div className="space-y-4">
                      {lecciones.map((leccion, lIdx) => {
                        const videoId = extractYouTubeId(leccion.video_url);
                        const embedUrl = getYouTubeEmbedUrl(leccion.video_url);
                        const hasLessonQuiz = leccion.quiz?.activo && (leccion.quiz?.preguntas?.length || 0) > 0;

                        return (
                          <div
                            key={leccion.id || lIdx}
                            className="p-5 sm:p-6 rounded-2xl bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 hover:border-[#10346E]/40 transition-all"
                          >
                            {/* Cabecera de la Lección */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                              <div className="flex items-center gap-2.5 flex-1">
                                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#10346E] dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                                  <Video className="w-4 h-4" />
                                </div>
                                <input
                                  type="text"
                                  value={leccion.titulo}
                                  onChange={(e) => handleUpdateLesson(sIdx, lIdx, 'titulo', e.target.value)}
                                  placeholder="Título de la lección..."
                                  className="w-full bg-transparent font-bold text-sm text-slate-900 dark:text-white focus:outline-none"
                                />
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-center">
                                {/* Duración Estimada */}
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  <input
                                    type="text"
                                    value={leccion.duracion || ''}
                                    onChange={(e) => handleUpdateLesson(sIdx, lIdx, 'duracion', e.target.value)}
                                    placeholder="10 min"
                                    className="w-16 bg-transparent text-center focus:outline-none font-bold"
                                  />
                                </div>

                                {/* Ordenar Lección */}
                                <div className="flex items-center gap-0.5 bg-white dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
                                  <button
                                    type="button"
                                    disabled={lIdx === 0}
                                    onClick={() => handleMoveLesson(sIdx, lIdx, 'up')}
                                    className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                                    title="Mover lección arriba"
                                  >
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={lIdx === lecciones.length - 1}
                                    onClick={() => handleMoveLesson(sIdx, lIdx, 'down')}
                                    className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                                    title="Mover lección abajo"
                                  >
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteLesson(sIdx, lIdx)}
                                  className="p-1.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                                  title="Eliminar lección"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Campo de Video de YouTube con Previsualización */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                              <div className="lg:col-span-7 space-y-3">
                                <div className="space-y-1">
                                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                                    <Youtube className="w-4 h-4 text-red-600" />
                                    <span>Enlace o Iframe de YouTube *</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={leccion.video_url || ''}
                                    onChange={(e) => handleUpdateLesson(sIdx, lIdx, 'video_url', e.target.value)}
                                    placeholder="https://www.youtube.com/watch?v=... o https://youtu.be/..."
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 dark:text-slate-100 focus:border-[#10346E] focus:outline-none transition-colors shadow-2xs"
                                  />
                                  <span className="text-[10px] text-slate-500 block">
                                    Pega la URL de YouTube o el bloque &lt;iframe&gt;. El sistema procesará el reproductor automáticamente.
                                  </span>
                                </div>

                                <div className="space-y-1">
                                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                                    Descripción o Resumen de la Lección
                                  </label>
                                  <textarea
                                    value={leccion.descripcion || ''}
                                    onChange={(e) => handleUpdateLesson(sIdx, lIdx, 'descripcion', e.target.value)}
                                    placeholder="Explica qué competencias o conceptos se explican en este video..."
                                    rows={2}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 focus:border-[#10346E] focus:outline-none resize-none leading-relaxed shadow-2xs"
                                  />
                                </div>

                                {/* Botones de Quiz y Recursos de la Lección */}
                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setActiveQuizTarget({ type: 'lesson', sectionIndex: sIdx, lessonIndex: lIdx })}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                                      hasLessonQuiz
                                        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900'
                                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                                    }`}
                                  >
                                    <Award className="w-3.5 h-3.5 text-amber-600" />
                                    <span>{hasLessonQuiz ? `Quiz de Lección (${leccion.quiz.preguntas.length})` : '+ Quiz en esta lección'}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleAddResource(sIdx, lIdx)}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <FileDown className="w-3.5 h-3.5 text-[#10346E] dark:text-blue-400" />
                                    <span>+ Material / Descarga</span>
                                  </button>
                                </div>

                                {/* Listado de Recursos Descargables */}
                                {(leccion.recursos || []).length > 0 && (
                                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 mt-2 shadow-2xs">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                      Recursos Descargables ({leccion.recursos.length}):
                                    </span>
                                    {leccion.recursos.map((rec, rIdx) => (
                                      <div key={rIdx} className="flex items-center gap-2">
                                        <input
                                          type="text"
                                          placeholder="Nombre del recurso (ej: Guía de Ejercicios PDF)..."
                                          value={rec.nombre}
                                          onChange={(e) => handleUpdateResource(sIdx, lIdx, rIdx, 'nombre', e.target.value)}
                                          className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                                        />
                                        <input
                                          type="text"
                                          placeholder="URL de descarga..."
                                          value={rec.url}
                                          onChange={(e) => handleUpdateResource(sIdx, lIdx, rIdx, 'url', e.target.value)}
                                          className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteResource(sIdx, lIdx, rIdx)}
                                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                                          title="Eliminar recurso"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Previsualización del Reproductor de Video */}
                              <div className="lg:col-span-5">
                                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black aspect-video relative flex items-center justify-center shadow-md">
                                  {videoId ? (
                                    <iframe
                                      src={embedUrl}
                                      title={leccion.titulo}
                                      className="w-full h-full border-0"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                      referrerPolicy="strict-origin-when-cross-origin"
                                      allowFullScreen
                                    />
                                  ) : (
                                    <div className="flex flex-col items-center justify-center text-center p-6 text-slate-400">
                                      <Youtube className="w-10 h-10 mb-2 opacity-30 text-slate-500" />
                                      <span className="text-xs font-bold text-slate-300">Previsualización de Video</span>
                                      <span className="text-[11px] text-slate-500 mt-1">Ingresa el enlace de YouTube a la izquierda</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Apuntes y Contenido Enriquecido de la Lección */}
                            <div className="pt-2">
                              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                                Apuntes y Contenido de Apoyo (Texto Enriquecido)
                              </label>
                              <RichTextEditor
                                content={leccion.notas || ''}
                                onChange={(html) => handleUpdateLesson(sIdx, lIdx, 'notas', html)}
                                placeholder="Escribe notas teóricas, diagramas o explicaciones complementarias para esta lección..."
                                minHeight="120px"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Botón Agregar Lección a esta Sección */}
                    <button
                      type="button"
                      onClick={() => handleAddLesson(sIdx)}
                      className="w-full py-3 border border-dashed border-slate-300 dark:border-slate-700 hover:border-[#10346E] dark:hover:border-blue-500 rounded-2xl text-xs font-bold text-[#10346E] dark:text-blue-400 bg-white dark:bg-slate-900/60 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Agregar otra Lección a esta Sección</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* ─── Botón Agregar Nueva Sección ─── */}
      <button
        type="button"
        onClick={handleAddSection}
        className="w-full py-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#10346E] dark:hover:border-blue-500 text-xs sm:text-sm font-bold text-[#10346E] dark:text-blue-400 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
      >
        <ListPlus className="w-5 h-5" />
        <span>Agregar Nueva Sección al Curso</span>
      </button>

      {/* ─── Evaluación / Quiz Final del Curso ─── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/50">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Examen Final del Curso (Opcional)</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Evaluación integral de acreditación que abarca todas las secciones del curso.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveQuizTarget({ type: 'final' })}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
              quizFinal.activo && (quizFinal.preguntas?.length || 0) > 0
                ? 'bg-[#10346E] text-white border-[#10346E] shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
            }`}
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>
              {quizFinal.activo && (quizFinal.preguntas?.length || 0) > 0
                ? `Configurar Examen Final (${quizFinal.preguntas.length} preguntas)`
                : '+ Configurar Examen Final'}
            </span>
          </button>
        </div>

        {quizFinal.activo && (quizFinal.preguntas?.length || 0) > 0 && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-xs text-slate-800 dark:text-slate-200 font-bold">
                Examen final activo con {quizFinal.preguntas.length} preguntas configuradas (Nota mínima de aprobación: {quizFinal.nota_minima || 60}%).
              </span>
            </div>
            <button
              type="button"
              onClick={() => onChange({ ...courseData, quiz_final: { activo: false, preguntas: [] } })}
              className="text-xs text-red-500 hover:text-red-700 font-bold cursor-pointer transition-colors"
            >
              Desactivar
            </button>
          </div>
        )}
      </div>

      {/* ─── Modal de Configuración de Quizzes (Sección / Lección / Final) ─── */}
      <AnimatePresence>
        {activeQuizTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
            >
              {/* Header del Modal */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/50">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {activeQuizTarget.type === 'final'
                        ? 'Examen Final del Curso'
                        : activeQuizTarget.type === 'section'
                        ? `Quiz de la Sección ${activeQuizTarget.sectionIndex + 1}`
                        : `Quiz de la Lección ${activeQuizTarget.lessonIndex + 1}`}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Configuración de preguntas y criterios de aprobación</p>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => setActiveQuizTarget(null)}
                  className="bg-[#10346E] hover:bg-[#18458F] text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Guardar y Cerrar
                </Button>
              </div>

              {/* Cuerpo del QuizBuilder */}
              <div className="p-6">
                {activeQuizTarget.type === 'final' ? (
                  <QuizBuilder
                    evaluacion={quizFinal}
                    onChange={(newQuiz) => onChange({ ...courseData, quiz_final: { ...newQuiz, activo: true } })}
                  />
                ) : activeQuizTarget.type === 'section' ? (
                  <QuizBuilder
                    evaluacion={secciones[activeQuizTarget.sectionIndex]?.quiz || {}}
                    onChange={(newQuiz) => {
                      const updated = [...secciones];
                      updated[activeQuizTarget.sectionIndex].quiz = { ...newQuiz, activo: true };
                      onChange({ ...courseData, secciones: updated });
                    }}
                  />
                ) : (
                  <QuizBuilder
                    evaluacion={secciones[activeQuizTarget.sectionIndex]?.lecciones[activeQuizTarget.lessonIndex]?.quiz || {}}
                    onChange={(newQuiz) => {
                      const updated = [...secciones];
                      updated[activeQuizTarget.sectionIndex].lecciones[activeQuizTarget.lessonIndex].quiz = {
                        ...newQuiz,
                        activo: true
                      };
                      onChange({ ...courseData, secciones: updated });
                    }}
                  />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
