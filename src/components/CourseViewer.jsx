import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
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
  RotateCcw,
  Sparkles,
  Trophy,
  Layers,
  Video,
  FileText,
  AlertCircle,
  Menu,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { extractYouTubeId, getYouTubeEmbedUrl } from '../lib/youtube';
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

  // Construir lista secuencial de elementos del curso (Lecciones, Quizzes de sección y Examen final)
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

  // Estado de navegación
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('notas'); // 'notas' | 'recursos' | 'quiz'
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [expandedSections, setExpandedSections] = useState({ 0: true });
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);

  // Estado de progreso guardado (Lecciones completadas y puntajes de quizzes)
  const storageKey = `sisinfo_course_${ova?.id}_${user?.id || 'guest'}`;
  const [progressState, setProgressState] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignorar error de parseo
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

    // Verificar si todos los elementos requeridos están completados
    const allRequiredFinished = flatItems.length > 0 && flatItems.every(it => updatedState.completedItems[it.id]);
    if (allRequiredFinished && !updatedState.courseCompleted) {
      updatedState.courseCompleted = true;
      setShowCelebrationModal(true);
      toast.success('🎓 ¡Felicitaciones! Has completado el curso con éxito.');
    }

    setProgressState(updatedState);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedState));
    } catch {
      // Ignorar error de storage
    }

    // Registrar en base de datos si el usuario está autenticado
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

  // Auto-expandir la sección correspondiente al elemento activo
  useEffect(() => {
    if (currentItem?.sectionIndex !== undefined) {
      setExpandedSections(prev => ({ ...prev, [currentItem.sectionIndex]: true }));
    }
  }, [currentItem]);

  // Manejador para marcar lección actual como completada y avanzar
  const handleMarkAsCompletedAndNext = () => {
    if (!currentItem) return;
    const newCompleted = { [currentItem.id]: true };
    updateProgress(newCompleted);

    if (currentIndex < flatItems.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  // Manejador de culminación de Quiz
  const handleQuizFinished = (result) => {
    if (!currentItem) return;
    const score = result.percentage || 0;
    const isApproved = score >= (currentItem.data?.nota_minima || 60);

    const newCompleted = { [currentItem.id]: isApproved || true };
    const newScores = { [currentItem.id]: score };
    updateProgress(newCompleted, newScores);

    toast.success(`Evaluación completada: ${score}%`, { icon: isApproved ? '🏆' : '📝' });
  };

  // Métricas de progreso
  const totalItemsCount = flatItems.length;
  const completedItemsCount = flatItems.filter(it => progressState.completedItems[it.id]).length;
  const progressPercent = totalItemsCount > 0 ? Math.round((completedItemsCount / totalItemsCount) * 100) : 0;
  const isCourseCompleted = progressState.courseCompleted || (totalItemsCount > 0 && completedItemsCount === totalItemsCount);

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0E17] text-white flex flex-col overflow-hidden font-sans select-none animate-in fade-in duration-200">
      {/* ═══════════════════════════════════════ */}
      {/* 1. BARRA SUPERIOR INSTITUCIONAL (TOPBAR) */}
      {/* ═══════════════════════════════════════ */}
      <header className="h-16 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 z-30">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Cerrar curso"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[10px] font-bold uppercase tracking-wider">
                {modulo?.nombre || 'Curso en Video'}
              </span>
              {isCourseCompleted && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase tracking-wider animate-pulse">
                  <Sparkles className="w-3 h-3" />
                  <span>Curso completado</span>
                </span>
              )}
            </div>
            <h1 className="text-xs sm:text-sm font-bold text-white truncate max-w-md sm:max-w-xl">
              {ova?.titulo}
            </h1>
          </div>
        </div>

        {/* Indicador de Progreso Global y Botones */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 text-xs font-bold font-mono">
              <span className="text-slate-400">{completedItemsCount}/{totalItemsCount}</span>
              <span className="text-blue-400">{progressPercent}%</span>
            </div>
            <div className="w-32 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
            <button
              type="button"
              onClick={() => setIsTheaterMode(!isTheaterMode)}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer hidden md:flex"
              title={isTheaterMode ? 'Salir de modo cine' : 'Modo cine ampliado'}
            >
              {isTheaterMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer flex lg:hidden"
              title="Temario del curso"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════ */}
      {/* 2. ÁREA DE APRENDIZAJE Y TEMARIO        */}
      {/* ═══════════════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ─── ESCENARIO PRINCIPAL (VIDEO / QUIZ) ─── */}
        <main className={`flex-1 overflow-y-auto flex flex-col bg-[#070A11] transition-all duration-300 ${isTheaterMode ? 'p-0' : ''}`}>
          {currentItem?.type === 'lesson' ? (
            <div className="flex-1 flex flex-col">
              {/* Contenedor del Reproductor de Video de YouTube */}
              <div className="w-full bg-black flex justify-center items-center shadow-2xl relative">
                <div className={`w-full ${isTheaterMode ? 'max-w-7xl' : 'max-w-5xl'} transition-all duration-300`}>
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
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
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-6 text-center">
                        <Video className="w-12 h-12 mb-2 opacity-30" />
                        <p className="text-sm font-bold">Video en preparación</p>
                        <p className="text-xs text-slate-600 mt-1">El docente no ha vinculado el enlace de YouTube todavía.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Barra de Acciones y Navegación de la Lección */}
              <div className="bg-[#0F172A] border-b border-slate-800/80 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                      {currentItem.sectionTitle}
                    </span>
                    {progressState.completedItems[currentItem.id] && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        Completada
                      </span>
                    )}
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                    {currentItem.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors flex items-center gap-1 text-xs font-bold"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Anterior</span>
                  </button>

                  <Button
                    onClick={handleMarkAsCompletedAndNext}
                    className={`gap-1.5 text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer shadow-sm ${
                      progressState.completedItems[currentItem.id]
                        ? 'bg-slate-800 hover:bg-slate-700 text-white'
                        : 'bg-[#10346E] hover:bg-[#1E40AF] text-white'
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

              {/* Pestañas de Contenido Inferior (Apuntes, Recursos, Quizzes) */}
              <div className="max-w-5xl w-full mx-auto p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('notas')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      activeTab === 'notas'
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Apuntes de la Lección</span>
                  </button>

                  {(currentItem.data?.recursos || []).length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('recursos')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                        activeTab === 'recursos'
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>Materiales ({currentItem.data.recursos.length})</span>
                    </button>
                  )}
                </div>

                {/* Contenido de la pestaña activa */}
                {activeTab === 'notas' && (
                  <div className="space-y-4">
                    {currentItem.data?.descripcion && (
                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                        {currentItem.data.descripcion}
                      </p>
                    )}
                    {currentItem.data?.notas ? (
                      <div
                        className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed font-sans"
                        dangerouslySetInnerHTML={{ __html: sanitizeHTML(currentItem.data.notas) }}
                      />
                    ) : (
                      <p className="text-xs text-slate-500 italic">No hay notas complementarias adjuntas para esta lección.</p>
                    )}
                  </div>
                )}

                {activeTab === 'recursos' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(currentItem.data?.recursos || []).map((rec, rIdx) => (
                      <a
                        key={rIdx}
                        href={rec.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition-all flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                            <FileDown className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                              {rec.nombre || 'Recurso Descargable'}
                            </p>
                            <span className="text-[10px] text-slate-500 font-mono truncate block max-w-xs">{rec.url}</span>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Vista de Quiz (Sección, Lección o Final) */
            <div className="max-w-4xl w-full mx-auto p-6 sm:p-8 space-y-6">
              <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                      {currentItem?.sectionTitle}
                    </span>
                    <h2 className="text-lg sm:text-xl font-black text-white">
                      {currentItem?.title}
                    </h2>
                  </div>
                </div>

                {/* Reproductor interactivo de Quiz */}
                <QuizPlayer
                  evaluacion={currentItem?.data || {}}
                  onComplete={handleQuizFinished}
                />
              </div>
            </div>
          )}
        </main>

        {/* ─── BARRA LATERAL DEL TEMARIO (SYLLABUS SIDEBAR) ─── */}
        <aside
          className={`w-80 sm:w-96 bg-[#0B111E] border-l border-slate-800/80 flex flex-col shrink-0 transition-all duration-300 z-20 ${
            isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0 hidden lg:flex'
          }`}
        >
          {/* Encabezado del Temario */}
          <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#10346E] text-white">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Temario del Curso</h3>
                <p className="text-[11px] text-slate-400">{secciones.length} secciones · {flatItems.length} contenidos</p>
              </div>
            </div>
          </div>

          {/* Lista de Secciones y Lecciones */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {secciones.map((sec, sIdx) => {
              const isSecExpanded = expandedSections[sIdx] !== false;
              const secLessons = sec.lecciones || [];
              const completedCountInSec = secLessons.filter(l => progressState.completedItems[l.id]).length;

              return (
                <div key={sec.id || sIdx} className="rounded-2xl border border-slate-800/80 bg-slate-900/40 overflow-hidden">
                  {/* Título de la Sección */}
                  <button
                    type="button"
                    onClick={() => setExpandedSections(prev => ({ ...prev, [sIdx]: !prev[sIdx] }))}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <div className="space-y-0.5 pr-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Sección {sIdx + 1}
                      </span>
                      <h4 className="text-xs font-bold text-white leading-tight">
                        {sec.titulo}
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        {completedCountInSec}/{secLessons.length} lecciones
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
                        className="border-t border-slate-800/80 divide-y divide-slate-800/40"
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
                                  ? 'bg-[#10346E] text-white'
                                  : 'hover:bg-slate-800/60 text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {isDone ? (
                                  <CheckCircle2 className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-300' : 'text-emerald-400'}`} />
                                ) : (
                                  <Circle className="w-4 h-4 text-slate-600 shrink-0" />
                                )}
                                <div className="min-w-0">
                                  <p className={`text-xs font-semibold truncate ${isActive ? 'text-white font-bold' : 'text-slate-300'}`}>
                                    {lec.titulo}
                                  </p>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                    <Clock className="w-2.5 h-2.5" />
                                    <span>{lec.duracion || '10 min'}</span>
                                  </div>
                                </div>
                              </div>

                              <Play className={`w-3 h-3 shrink-0 ${isActive ? 'text-white' : 'text-slate-600'}`} />
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
                                  ? 'bg-amber-600 text-white'
                                  : 'hover:bg-slate-800/60 text-amber-300/90'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <Award className="w-4 h-4 shrink-0 text-amber-400" />
                                <div className="min-w-0">
                                  <p className="text-xs font-bold truncate">Quiz: {sec.titulo}</p>
                                  {score !== undefined && (
                                    <span className="text-[10px] font-mono text-emerald-300">Puntaje: {score}%</span>
                                  )}
                                </div>
                              </div>
                              {isQuizDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                            </button>
                          );
                        })()}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* Examen Final al final de la barra lateral si existe */}
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
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Trophy className="w-5 h-5 shrink-0 text-amber-400" />
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider">Examen Final</p>
                      <p className="text-[10px] opacity-80">Evaluación certificatoria del curso</p>
                      {finalScore !== undefined && (
                        <span className="text-[10px] font-mono font-bold block mt-0.5">Nota: {finalScore}%</span>
                      )}
                    </div>
                  </div>
                  {isFinalDone && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                </button>
              );
            })()}
          </div>
        </aside>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* 3. MODAL CELEBRATORIO DE CURSO COMPLETADO */}
      {/* ═══════════════════════════════════════ */}
      <AnimatePresence>
        {showCelebrationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0F172A] border border-slate-700 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl relative"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-emerald-400 mx-auto flex items-center justify-center shadow-lg animate-bounce">
                <Trophy className="w-10 h-10 text-slate-950" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                  ¡Meta Cumplida!
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Has completado el curso
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Has recorrido exitosamente todas las secciones y lecciones de <strong className="text-white">{ova?.titulo}</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-200">Acceso permanente de repaso:</p>
                <p>Tu estado de <strong className="text-emerald-400">"Curso completado"</strong> se mantendrá guardado. Puedes volver a ingresar cuando quieras para repasar videos o realizar quizzes.</p>
              </div>

              <Button
                onClick={() => setShowCelebrationModal(false)}
                className="w-full py-3 bg-[#10346E] hover:bg-[#18458F] text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
              >
                Continuar Repasando
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
