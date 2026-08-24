import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  X,
  Play,
  CheckCircle2,
  Circle,
  Award,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Clock,
  BookOpen,
  FileDown,
  ExternalLink,
  Layers,
  Video,
  FileText,
  Menu,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getYouTubeEmbedUrl } from '../lib/youtube';
import { sanitizeHTML } from '../lib/security';
import QuizPlayer from './QuizPlayer';
import Button from './Button';
import { useAuth } from '../context/AuthContext';
import { registrarResultadoOva } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export default function CourseViewer({ ova, modulo, onClose, onProgressUpdate }) {
  const { user } = useAuth();

  // Parsear estructura de contenido
  const rawContenido = ova?.contenido;
  const courseData = useMemo(() => {
    if (!rawContenido) return { secciones: [], quiz_final: { activo: false, preguntas: [] } };
    if (typeof rawContenido === 'object') {
      if (Array.isArray(rawContenido)) return { secciones: rawContenido, quiz_final: { activo: false, preguntas: [] } };
      return rawContenido;
    }
    try {
      const parsed = JSON.parse(rawContenido);
      if (Array.isArray(parsed)) return { secciones: parsed, quiz_final: { activo: false, preguntas: [] } };
      return parsed;
    } catch {
      return { secciones: [], quiz_final: { activo: false, preguntas: [] } };
    }
  }, [rawContenido]);

  const secciones = courseData.secciones || [];
  const quizFinal = courseData.quiz_final || { activo: false, preguntas: [] };

  // Construir lista secuencial de contenidos (Lecciones, Quizzes de sección y Examen final)
  const flatItems = useMemo(() => {
    const items = [];
    secciones.forEach((sec, sIdx) => {
      (sec.lecciones || []).forEach((lec, lIdx) => {
        items.push({
          type: 'lesson',
          id: lec.id || `s${sIdx}-l${lIdx}`,
          title: lec.titulo || `Lección ${lIdx + 1}`,
          sectionTitle: sec.titulo || `Sección ${sIdx + 1}`,
          sectionIndex: sIdx,
          lessonIndex: lIdx,
          data: lec
        });

        // Si la lección tiene quiz independiente
        if (lec.quiz?.activo && (lec.quiz?.preguntas?.length || 0) > 0) {
          items.push({
            type: 'lesson_quiz',
            id: `quiz-lec-${lec.id || `${sIdx}-${lIdx}`}`,
            title: lec.quiz.titulo || `Quiz: ${lec.titulo}`,
            sectionTitle: sec.titulo || `Sección ${sIdx + 1}`,
            sectionIndex: sIdx,
            lessonIndex: lIdx,
            data: lec.quiz
          });
        }
      });

      // Si la sección tiene quiz al final
      if (sec.quiz?.activo && (sec.quiz?.preguntas?.length || 0) > 0) {
        items.push({
          type: 'section_quiz',
          id: `quiz-sec-${sec.id || sIdx}`,
          title: sec.quiz.titulo || `Quiz de ${sec.titulo}`,
          sectionTitle: sec.titulo || `Sección ${sIdx + 1}`,
          sectionIndex: sIdx,
          data: sec.quiz
        });
      }
    });

    // Si el curso tiene examen final
    if (quizFinal.activo && (quizFinal.preguntas?.length || 0) > 0) {
      items.push({
        type: 'final_quiz',
        id: 'quiz-final-course',
        title: quizFinal.titulo || 'Examen Final del Curso',
        sectionTitle: 'Evaluación Integral',
        data: quizFinal
      });
    }

    return items;
  }, [secciones, quizFinal]);

  // Estado de navegación y UI
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('notas'); // 'notas' | 'recursos' | 'quiz'
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [expandedSections, setExpandedSections] = useState({ 0: true });
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);

  // Estado de progreso guardado
  const storageKey = `sisinfo_course_${ova?.id}_${user?.id || 'guest'}`;
  const [progressState, setProgressState] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignorar error de lectura
    }
    return {
      completedItems: {},
      quizScores: {},
      courseCompleted: false
    };
  });

  // Guardar progreso en localStorage y Supabase cuando cambia
  const updateProgress = useCallback(async (newCompleted, newScores = {}) => {
    const updatedState = {
      completedItems: { ...progressState.completedItems, ...newCompleted },
      quizScores: { ...progressState.quizScores, ...newScores },
      courseCompleted: progressState.courseCompleted
    };

    const allRequiredFinished = flatItems.length > 0 && flatItems.every(it => updatedState.completedItems[it.id]);
    if (allRequiredFinished && !updatedState.courseCompleted) {
      updatedState.courseCompleted = true;
      setShowCelebrationModal(true);
      toast.success('Has completado todos los contenidos del curso con éxito.');
    }

    setProgressState(updatedState);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedState));
    } catch {
      // Ignorar error de storage
    }

    if (user?.id && ova?.id) {
      try {
        const scores = Object.values(updatedState.quizScores);
        const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 100;
        await registrarResultadoOva(user.id, ova.id, avgScore, updatedState.courseCompleted || allRequiredFinished);
        onProgressUpdate?.();
      } catch (err) {
        console.error('Error al registrar resultado en Supabase:', err);
      }
    }
  }, [flatItems, ova?.id, user?.id, storageKey, progressState, onProgressUpdate]);

  const currentItem = flatItems[currentIndex] || flatItems[0];

  useEffect(() => {
    if (currentItem?.sectionIndex !== undefined) {
      setExpandedSections(prev => ({ ...prev, [currentItem.sectionIndex]: true }));
    }
  }, [currentItem]);

  const handleMarkAsCompletedAndNext = () => {
    if (!currentItem) return;
    const newCompleted = { [currentItem.id]: true };
    updateProgress(newCompleted);

    if (currentIndex < flatItems.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleQuizFinished = (result) => {
    if (!currentItem) return;
    const score = result.percentage || 0;
    const isApproved = score >= (currentItem.data?.nota_minima || 60);

    const newCompleted = { [currentItem.id]: isApproved || true };
    const newScores = { [currentItem.id]: score };
    updateProgress(newCompleted, newScores);

    toast.success(`Evaluación finalizada con ${score}% de calificación`);
  };

  const totalItemsCount = flatItems.length;
  const completedItemsCount = flatItems.filter(it => progressState.completedItems[it.id]).length;
  const progressPercent = totalItemsCount > 0 ? Math.round((completedItemsCount / totalItemsCount) * 100) : 0;
  const isCourseCompleted = progressState.courseCompleted || (totalItemsCount > 0 && completedItemsCount === totalItemsCount);

  return (
    <div className="fixed inset-0 z-50 bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col overflow-hidden font-sans select-none animate-in fade-in duration-200">
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 1. BARRA SUPERIOR INSTITUCIONAL Y ACADÉMICA (CLARA/LIMPIA)  */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 z-30 shadow-xs">
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
            title="Volver a la línea de aprendizaje"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Volver</span>
          </button>

          <div className="min-w-0 flex items-center gap-3">
            <span className="hidden md:inline-flex px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-[#10346E] dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/50 text-[10px] font-bold uppercase tracking-wider shrink-0">
              {modulo?.nombre || 'Línea de Formación'}
            </span>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate max-w-sm sm:max-w-lg">
                  {ova?.titulo}
                </h1>
                {isCourseCompleted && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Completado</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Indicador de Avance y Controles */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="text-slate-500 dark:text-slate-400 text-[11px] font-mono">
                {completedItemsCount} de {totalItemsCount} completadas
              </span>
              <span className="text-[#10346E] dark:text-blue-400 font-bold font-mono">
                {progressPercent}%
              </span>
            </div>
            <div className="w-36 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700">
              <div
                className="h-full bg-[#10346E] dark:bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-800 pl-3">
            <button
              type="button"
              onClick={() => setIsTheaterMode(!isTheaterMode)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer hidden md:flex"
              title={isTheaterMode ? 'Vista normal' : 'Modo ampliado'}
            >
              {isTheaterMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer flex lg:hidden"
              title="Temario del curso"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 2. CONTENEDOR PRINCIPAL: ESCENARIO DE CLASE Y TEMARIO       */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ─── ESCENARIO DE CONTENIDO (VIDEO / APUNTES / QUIZ) ─── */}
        <main className="flex-1 overflow-y-auto flex flex-col bg-[#F8FAFC] dark:bg-slate-950 transition-all duration-300">
          {currentItem?.type === 'lesson' ? (
            <div className="flex-1 flex flex-col">
              {/* Contenedor del Reproductor de Video */}
              <div className="w-full bg-slate-900 dark:bg-black py-4 sm:py-6 px-4 flex justify-center items-center shadow-inner">
                <div className={`w-full ${isTheaterMode ? 'max-w-7xl' : 'max-w-5xl'} transition-all duration-300`}>
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-lg border border-slate-800">
                    {currentItem.data?.video_url ? (
                      <iframe
                        src={getYouTubeEmbedUrl(currentItem.data?.video_url, { autoplay: 0 })}
                        title={currentItem.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                        <Video className="w-10 h-10 mb-2 opacity-40 text-slate-500" />
                        <p className="text-xs font-bold text-slate-300">Video no configurado</p>
                        <p className="text-[11px] text-slate-500 mt-1">El docente no ha vinculado el enlace de YouTube para esta lección.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Barra de Título y Navegación de la Lección */}
              <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 sm:px-10 py-5">
                <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-[#10346E] dark:text-blue-400 uppercase tracking-wider font-mono">
                        {currentItem.sectionTitle}
                      </span>
                      {progressState.completedItems[currentItem.id] && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Completada</span>
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                      {currentItem.title}
                    </h2>
                  </div>

                  {/* Botones de Navegación */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      disabled={currentIndex === 0}
                      onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors flex items-center gap-1 text-xs font-bold"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Anterior</span>
                    </button>

                    <Button
                      onClick={handleMarkAsCompletedAndNext}
                      className={`gap-1.5 text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer shadow-xs ${
                        progressState.completedItems[currentItem.id]
                          ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200'
                          : 'bg-[#10346E] hover:bg-[#18458F] text-white'
                      }`}
                    >
                      {progressState.completedItems[currentItem.id] ? (
                        <>
                          <span>Continuar</span>
                          <ChevronRight className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Marcar como completada</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Contenido Inferior (Apuntes y Materiales) */}
              <div className="max-w-5xl w-full mx-auto p-6 sm:p-10 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('notas')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      activeTab === 'notas'
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-[#10346E] dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/50'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Apuntes de la Lección</span>
                  </button>

                  {(currentItem.data?.recursos || []).length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('recursos')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                        activeTab === 'recursos'
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-[#10346E] dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/50'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>Materiales ({currentItem.data.recursos.length})</span>
                    </button>
                  )}
                </div>

                {/* Tab: Apuntes */}
                {activeTab === 'notas' && (
                  <div className="space-y-4">
                    {currentItem.data?.descripcion && (
                      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {currentItem.data.descripcion}
                      </div>
                    )}
                    {currentItem.data?.notas ? (
                      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                        <div
                          className="prose prose-slate dark:prose-invert prose-sm max-w-none text-slate-700 dark:text-slate-300 leading-relaxed font-sans"
                          dangerouslySetInnerHTML={{ __html: sanitizeHTML(currentItem.data.notas) }}
                        />
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                        No hay apuntes adicionales registrados para esta lección.
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Recursos Descargables */}
                {activeTab === 'recursos' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(currentItem.data?.recursos || []).map((rec, rIdx) => (
                      <a
                        key={rIdx}
                        href={rec.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#10346E]/40 transition-all flex items-center justify-between gap-3 group shadow-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#10346E] dark:text-blue-400">
                            <FileDown className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#10346E] dark:group-hover:text-blue-400 transition-colors">
                              {rec.nombre || 'Material Descargable'}
                            </p>
                            <span className="text-[10px] text-slate-400 font-mono truncate block max-w-xs">{rec.url}</span>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-[#10346E] transition-colors" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Vista de Quiz (Sección, Lección o Final) */
            <div className="max-w-4xl w-full mx-auto p-6 sm:p-10 space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 space-y-6 shadow-sm">
                <div className="flex items-center gap-3.5 pb-5 border-b border-slate-100 dark:border-slate-800">
                  <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/50">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-[#10346E] dark:text-blue-400 uppercase tracking-wider font-mono">
                      {currentItem?.sectionTitle}
                    </span>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                      {currentItem?.title}
                    </h2>
                  </div>
                </div>

                <QuizPlayer
                  evaluacion={currentItem?.data || {}}
                  onComplete={handleQuizFinished}
                />
              </div>
            </div>
          )}
        </main>

        {/* ─── BARRA LATERAL DEL TEMARIO (CLARA Y ESTRUCTURADA) ─── */}
        <aside
          className={`w-80 sm:w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 transition-all duration-300 z-20 ${
            isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0 hidden lg:flex'
          }`}
        >
          {/* Encabezado del Temario */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#10346E] text-white">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Temario del Curso
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {secciones.length} secciones · {flatItems.length} contenidos
                </p>
              </div>
            </div>
          </div>

          {/* Lista de Secciones y Lecciones */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-white dark:bg-slate-900">
            {secciones.map((sec, sIdx) => {
              const isSecExpanded = expandedSections[sIdx] !== false;
              const secLessons = sec.lecciones || [];
              const completedCountInSec = secLessons.filter(l => progressState.completedItems[l.id]).length;

              return (
                <div key={sec.id || sIdx} className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50/40 dark:bg-slate-900/60">
                  {/* Título de la Sección */}
                  <button
                    type="button"
                    onClick={() => setExpandedSections(prev => ({ ...prev, [sIdx]: !prev[sIdx] }))}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                  >
                    <div className="space-y-0.5 pr-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                        Sección {sIdx + 1}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                        {sec.titulo}
                      </h4>
                      <span className="text-[10px] text-slate-500 font-medium block">
                        {completedCountInSec} de {secLessons.length} lecciones
                      </span>
                    </div>
                    {isSecExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>

                  {/* Lecciones de la Sección */}
                  <AnimatePresence>
                    {isSecExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900"
                      >
                        {secLessons.map((lec, lIdx) => {
                          const flatIdx = flatItems.findIndex(it => it.type === 'lesson' && it.id === (lec.id || `s${sIdx}-l${lIdx}`));
                          const isActive = currentIndex === flatIdx;
                          const isDone = progressState.completedItems[lec.id || `s${sIdx}-l${lIdx}`];

                          return (
                            <button
                              key={lec.id || lIdx}
                              type="button"
                              onClick={() => {
                                if (flatIdx !== -1) setCurrentIndex(flatIdx);
                              }}
                              className={`w-full p-3.5 pl-5 flex items-center justify-between gap-3 text-left transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-blue-50/90 dark:bg-blue-950/60 border-l-4 border-[#10346E] text-[#10346E] dark:text-blue-300 font-bold'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {isDone ? (
                                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                  <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                                )}
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold truncate leading-tight">
                                    {lec.titulo}
                                  </p>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                    <Clock className="w-2.5 h-2.5" />
                                    <span>{lec.duracion || '10 min'}</span>
                                  </div>
                                </div>
                              </div>

                              <Play className={`w-3 h-3 shrink-0 ${isActive ? 'text-[#10346E] dark:text-blue-400' : 'text-slate-300 dark:text-slate-600'}`} />
                            </button>
                          );
                        })}

                        {/* Quiz de Sección si existe */}
                        {sec.quiz?.activo && (sec.quiz?.preguntas?.length || 0) > 0 && (() => {
                          const quizIdx = flatItems.findIndex(it => it.type === 'section_quiz' && it.sectionIndex === sIdx);
                          const isQuizActive = currentIndex === quizIdx;
                          const isQuizDone = progressState.completedItems[`quiz-sec-${sec.id || sIdx}`];
                          const score = progressState.quizScores[`quiz-sec-${sec.id || sIdx}`];

                          return (
                            <button
                              type="button"
                              onClick={() => {
                                if (quizIdx !== -1) setCurrentIndex(quizIdx);
                              }}
                              className={`w-full p-3.5 pl-5 flex items-center justify-between gap-3 text-left transition-all cursor-pointer ${
                                isQuizActive
                                  ? 'bg-amber-50 dark:bg-amber-950/60 border-l-4 border-amber-600 text-amber-900 dark:text-amber-200 font-bold'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <Award className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                <div className="min-w-0">
                                  <p className="text-xs font-bold truncate">Quiz: {sec.titulo}</p>
                                  {score !== undefined && (
                                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                      Nota: {score}%
                                    </span>
                                  )}
                                </div>
                              </div>
                              {isQuizDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                            </button>
                          );
                        })()}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* Examen Final */}
            {quizFinal.activo && (quizFinal.preguntas?.length || 0) > 0 && (() => {
              const finalIdx = flatItems.findIndex(it => it.type === 'final_quiz');
              const isFinalActive = currentIndex === finalIdx;
              const isFinalDone = progressState.completedItems['quiz-final-course'];
              const finalScore = progressState.quizScores['quiz-final-course'];

              return (
                <button
                  type="button"
                  onClick={() => {
                    if (finalIdx !== -1) setCurrentIndex(finalIdx);
                  }}
                  className={`w-full p-4 rounded-2xl border flex items-center justify-between gap-3 text-left transition-all cursor-pointer ${
                    isFinalActive
                      ? 'bg-amber-500 text-white border-amber-600 font-bold shadow-xs'
                      : 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 hover:bg-amber-100/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider">Examen Final</p>
                      <p className="text-[10px] opacity-80">Evaluación integral del curso</p>
                      {finalScore !== undefined && (
                        <span className="text-[10px] font-mono font-bold block mt-0.5">Nota: {finalScore}%</span>
                      )}
                    </div>
                  </div>
                  {isFinalDone && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                </button>
              );
            })()}
          </div>
        </aside>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 3. MODAL INSTITUCIONAL DE CURSO COMPLETADO                  */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showCelebrationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-5 shadow-xl relative"
            >
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900 mx-auto flex items-center justify-center text-[#10346E] dark:text-blue-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#10346E] dark:text-blue-400 block">
                  Acreditación de Aprendizaje
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Curso Completado
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Has finalizado todas las secciones y lecciones de <strong className="text-slate-900 dark:text-white">{ova?.titulo}</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <p className="font-bold text-slate-800 dark:text-slate-200">Acceso permanente:</p>
                <p>El estado de curso completado se ha registrado en tu historial. Puedes volver a ingresar en cualquier momento para repasar contenidos y evaluaciones.</p>
              </div>

              <Button
                onClick={() => setShowCelebrationModal(false)}
                className="w-full py-3 bg-[#10346E] hover:bg-[#18458F] text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
              >
                Continuar
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
