import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sanitizeHTML } from '../lib/security';
import QuizPlayer from './QuizPlayer';
import Button from './Button';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Target,
  Layers,
  Award,
  CheckCircle2,
  FileText,
  FileDown,
  Youtube,
  Globe,
  Download,
  Maximize2,
  Minimize2,
  Sparkles,
  Check,
  Copy,
  ChevronRight,
  X,
  Play,
  Lightbulb,
  ExternalLink,
  Code,
  GraduationCap
} from 'lucide-react';

export default function OvaViewer({
  ova,
  modulo,
  onClose,
  onQuizComplete
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [copiedCodeIndex, setCopiedCodeIndex] = useState(null);
  const [completedSteps, setCompletedSteps] = useState(new Set([0]));

  // Derivar pasos de contenido a partir del OVA
  const getSteps = () => {
    if (!ova) return [];

    let evaluacion = null;
    const rawEval = ova.evaluacion || ova.actividad_final;
    if (rawEval) {
      if (typeof rawEval === 'object' && Array.isArray(rawEval.preguntas) && rawEval.preguntas.length > 0) {
        evaluacion = rawEval;
      } else if (typeof rawEval === 'string') {
        try {
          const parsed = JSON.parse(rawEval);
          if (parsed && Array.isArray(parsed.preguntas) && parsed.preguntas.length > 0) {
            evaluacion = parsed;
          }
        } catch {
          // Formato heredado o texto plano
        }
      }
    }

    const steps = [
      {
        id: 'intro',
        titulo: 'Introducción y Objetivos',
        subtitulo: 'Marco Conceptual',
        tipo: 'intro',
        content: {
          titulo: ova.titulo,
          objetivo: ova.objetivo,
          introduccion: ova.introduccion,
          imagen: ova.imagen_portada,
          descripcion: ova.descripcion
        }
      },
      ...(ova.contenido || []).map((sec, idx) => ({
        id: `sec-${idx}`,
        titulo: sec.titulo || `Sección ${idx + 1}`,
        subtitulo: `Capítulo 0${idx + 1}`,
        tipo: 'section',
        content: sec
      })),
      {
        id: 'final',
        titulo: 'Evaluación y Recursos',
        subtitulo: 'Cierre del Módulo',
        tipo: 'final',
        content: {
          actividad: ova.actividad_final,
          recursos: ova.recursos,
          evaluacion: evaluacion
        }
      }
    ];

    return steps;
  };

  const steps = getSteps();
  const currentStep = steps[activeStep] || steps[0];
  const progressPercentage = Math.round(((activeStep + 1) / steps.length) * 100);

  // Marcar pasos como completados a medida que el usuario avanza
  const handleStepChange = (newStep) => {
    if (newStep >= 0 && newStep < steps.length) {
      setActiveStep(newStep);
      setCompletedSteps(prev => new Set([...prev, newStep]));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCopyCode = (codeText, idx) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeIndex(idx);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  const formatYoutubeUrl = (url) => {
    if (!url) return '';
    let embedUrl = url;
    if (embedUrl.includes('youtube.com/watch?v=')) {
      embedUrl = embedUrl.replace('watch?v=', 'embed/');
    } else if (embedUrl.includes('youtu.be/')) {
      embedUrl = embedUrl.replace('youtu.be/', 'youtube.com/embed/');
    }
    return embedUrl;
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-200">
      
      {/* ══════════════════════════════════════════════════════════ */}
      {/* BARRA SUPERIOR ACADÉMICA / NAVEGACIÓN PRINCIPAL          */}
      {/* ══════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-card-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Lado izquierdo: Botón volver + Identificador */}
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-foreground transition-colors cursor-pointer shrink-0"
              title="Volver a los módulos"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/50 text-[#15326C] dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/40">
                  {modulo?.nombre || 'Línea de Aprendizaje'}
                </span>
                <span className="text-[11px] text-foreground/40 hidden sm:inline">· OVA Interactivo</span>
              </div>
              <h2 className="text-sm font-bold text-foreground truncate max-w-xs sm:max-w-md md:max-w-lg">
                {ova.titulo}
              </h2>
            </div>
          </div>

          {/* Lado derecho: Progreso + Acciones */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Medidor de Progreso */}
            <div className="hidden md:flex flex-col items-end gap-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground/70">
                <span>Paso {activeStep + 1} de {steps.length}</span>
                <span className="font-bold text-[#15326C] dark:text-blue-400 font-mono">{progressPercentage}%</span>
              </div>
              <div className="w-32 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#15326C] dark:bg-blue-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Modo Enfoque / Pantalla Completa */}
            <button
              type="button"
              onClick={() => setIsFocusMode(!isFocusMode)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer hidden lg:flex items-center gap-1.5 text-xs font-semibold ${
                isFocusMode
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-[#15326C] dark:text-blue-300 border-blue-200 dark:border-blue-800'
                  : 'bg-card hover:bg-slate-100 dark:hover:bg-slate-800 text-foreground/70 border-card-border'
              }`}
              title={isFocusMode ? 'Mostrar temario lateral' : 'Ocultar temario lateral (Modo Lectura)'}
            >
              {isFocusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span className="text-[11px]">{isFocusMode ? 'Modo Normal' : 'Modo Enfoque'}</span>
            </button>

            {/* Botón Salir */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
              title="Cerrar lección"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Barra de progreso sutil en borde inferior */}
        <div className="h-0.5 bg-slate-200 dark:bg-slate-800 w-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#15326C] to-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* CUERPO PRINCIPAL (TEMARIO LATERAL + LIENZO DE LECTURA)   */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
        
        {/* ─── TEMARIO LATERAL DE CÁTEDRA ─── */}
        {!isFocusMode && (
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24 space-y-4">
              
              {/* Tarjeta de Índice */}
              <div className="p-5 rounded-2xl bg-card border border-card-border shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-card-border">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-[#15326C] dark:text-blue-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Temario de Cátedra
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-foreground/40 font-mono">
                    {steps.length} Partes
                  </span>
                </div>

                <nav className="space-y-1.5">
                  {steps.map((step, idx) => {
                    const isActive = activeStep === idx;
                    const isCompleted = completedSteps.has(idx);

                    return (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => handleStepChange(idx)}
                        className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 cursor-pointer group ${
                          isActive
                            ? 'bg-[#15326C] text-white shadow-sm'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-foreground/80'
                        }`}
                      >
                        {/* Indicador de Número / Estado */}
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : isCompleted
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-foreground/40'
                        }`}>
                          {isCompleted && !isActive ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <span>{idx + 1}</span>
                          )}
                        </div>

                        {/* Texto del Paso */}
                        <div className="min-w-0 flex-1">
                          <p className={`text-[9px] font-bold uppercase tracking-wider truncate ${
                            isActive ? 'text-blue-200' : 'text-foreground/40'
                          }`}>
                            {step.subtitulo}
                          </p>
                          <p className={`text-xs font-bold truncate leading-tight ${
                            isActive ? 'text-white' : 'text-foreground'
                          }`}>
                            {step.titulo}
                          </p>
                        </div>

                        {isActive && (
                          <ChevronRight className="w-3.5 h-3.5 text-white/80 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Tarjeta de Soporte Académico */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-foreground/70 space-y-2">
                <div className="flex items-center gap-2 font-bold text-foreground text-xs">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  <span>Sugerencia de Estudio</span>
                </div>
                <p className="text-[11px] leading-relaxed text-foreground/60">
                  Completa la lectura y actividades de cada sección antes de presentar la evaluación interactiva final.
                </p>
              </div>

            </div>
          </aside>
        )}

        {/* ─── LIENZO CENTRAL DE LECTURA Y APRENDIZAJE ─── */}
        <main className={`flex-1 min-w-0 transition-all duration-300 ${isFocusMode ? 'max-w-4xl mx-auto' : ''}`}>
          <div className="bg-card border border-card-border rounded-3xl p-6 sm:p-10 shadow-sm min-h-[600px] flex flex-col justify-between">
            
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep?.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="space-y-8"
              >
                {/* ══════════════════════════════════════════ */}
                {/* TIPO: INTRODUCCIÓN Y MARCO CONCEPTUAL     */}
                {/* ══════════════════════════════════════════ */}
                {currentStep.tipo === 'intro' && (
                  <div className="space-y-8">
                    {/* Hero Banner de Cátedra */}
                    <div className="relative rounded-2xl overflow-hidden aspect-[21/9] min-h-[220px] bg-slate-900 flex items-end p-6 sm:p-8 shadow-md">
                      <img
                        src={currentStep.content.imagen || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200'}
                        alt={currentStep.content.titulo}
                        className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0B1528] via-[#0B1528]/60 to-transparent" />
                      
                      <div className="relative z-10 space-y-2 max-w-2xl">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider">
                            Módulo de Inicio
                          </span>
                          <span className="text-white/60 text-xs font-medium">
                            {steps.length - 2} lecciones interactivas
                          </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                          {currentStep.content.titulo}
                        </h1>
                      </div>
                    </div>

                    {/* Resumen & Descripción */}
                    {currentStep.content.descripcion && (
                      <p className="text-base sm:text-lg text-foreground/80 leading-relaxed font-medium">
                        {currentStep.content.descripcion}
                      </p>
                    )}

                    {/* Tarjetas de Objetivos y Contexto */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* 1. Objetivo Pedagógico */}
                      <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-3">
                        <div className="flex items-center gap-2.5 text-[#15326C] dark:text-blue-400">
                          <div className="p-2 rounded-lg bg-blue-100/70 dark:bg-blue-900/40">
                            <Target className="w-4 h-4" />
                          </div>
                          <h4 className="text-xs font-bold uppercase tracking-wider">
                            Objetivo de Aprendizaje
                          </h4>
                        </div>
                        <p className="text-sm text-foreground/85 leading-relaxed">
                          {currentStep.content.objetivo || 'Desarrollar competencias conceptuales y prácticas en esta área de especialidad.'}
                        </p>
                      </div>

                      {/* 2. Contextualización */}
                      <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-3">
                        <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400">
                          <div className="p-2 rounded-lg bg-indigo-100/70 dark:bg-indigo-900/40">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <h4 className="text-xs font-bold uppercase tracking-wider">
                            Marco Introductorio
                          </h4>
                        </div>
                        <div
                          className="text-sm text-foreground/75 leading-relaxed prose dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: sanitizeHTML(currentStep.content.introduccion || '<p>Bienvenido al Objeto Virtual de Aprendizaje. Avanza a la siguiente sección para comenzar con los contenidos de cátedra.</p>')
                          }}
                        />
                      </div>
                    </div>

                    {/* Botón de Inicio Rápido */}
                    <div className="pt-4 flex justify-end">
                      <Button
                        onClick={() => handleStepChange(1)}
                        className="gap-2 px-6 py-3 bg-[#15326C] hover:bg-[#1E40AF] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm cursor-pointer"
                      >
                        <span>Comenzar Lección 1</span>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* ══════════════════════════════════════════ */}
                {/* TIPO: SECCIÓN DINÁMICA DE CÁTEDRA          */}
                {/* ══════════════════════════════════════════ */}
                {currentStep.tipo === 'section' && (
                  <div className="space-y-8">
                    {/* Encabezado del Capítulo */}
                    <div className="pb-5 border-b border-card-border flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/50 text-[#15326C] dark:text-blue-400 border border-blue-200/50">
                            {currentStep.subtitulo}
                          </span>
                          <span className="text-xs text-foreground/40 font-medium">Contenido Temático</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                          {currentStep.titulo}
                        </h2>
                      </div>
                      <div className="text-3xl sm:text-4xl font-extrabold text-slate-200 dark:text-slate-800 font-mono select-none">
                        0{activeStep}
                      </div>
                    </div>

                    {/* Video de Cátedra (si existe) */}
                    {currentStep.content.video_url && (
                      <div className="space-y-2">
                        <div className="aspect-video rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-md">
                          <iframe
                            src={formatYoutubeUrl(currentStep.content.video_url)}
                            className="w-full h-full"
                            frameBorder="0"
                            allowFullScreen
                            title="Video de Cátedra"
                          />
                        </div>
                        <p className="text-[11px] text-foreground/50 text-center">
                          Material audiovisual complementario de la lección
                        </p>
                      </div>
                    )}

                    {/* Imagen de Apoyo (si existe) */}
                    {currentStep.content.imagen_url && (
                      <div className="space-y-2">
                        <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-center max-h-[480px]">
                          <img
                            src={currentStep.content.imagen_url}
                            alt={currentStep.titulo}
                            className="w-full h-full object-contain max-h-[480px]"
                          />
                        </div>
                      </div>
                    )}

                    {/* Nota Destacada (si el tipo es nota) */}
                    {currentStep.content.tipo === 'nota' && (
                      <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-2 shadow-sm">
                        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
                          <Lightbulb className="w-4 h-4" />
                          <span>Nota de Cátedra</span>
                        </div>
                        <div
                          className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: sanitizeHTML(currentStep.content.contenido) }}
                        />
                      </div>
                    )}

                    {/* Bloque de Código Interactivo (si el tipo es código) */}
                    {currentStep.content.tipo === 'codigo' && currentStep.content.codigo && (
                      <div className="rounded-2xl bg-[#0B1528] border border-slate-800 overflow-hidden shadow-md">
                        <div className="flex items-center justify-between px-5 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs">
                          <div className="flex items-center gap-2">
                            <Code className="w-3.5 h-3.5 text-blue-400" />
                            <span className="font-mono text-slate-300 font-semibold uppercase">
                              {currentStep.content.lenguaje || 'Código'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(currentStep.content.codigo, activeStep)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            {copiedCodeIndex === activeStep ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copiar</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="p-5 text-xs sm:text-sm text-slate-200 font-mono overflow-x-auto leading-relaxed">
                          <code>{currentStep.content.codigo}</code>
                        </pre>
                      </div>
                    )}

                    {/* Texto Académico Principal */}
                    {currentStep.content.contenido && currentStep.content.tipo !== 'nota' && (
                      <div className="prose dark:prose-invert max-w-none text-foreground/85 text-base sm:text-lg leading-relaxed space-y-4">
                        <div
                          dangerouslySetInnerHTML={{
                            __html: sanitizeHTML(
                              currentStep.content.contenido.includes('<')
                                ? currentStep.content.contenido
                                : currentStep.content.contenido.replace(/\n/g, '<br/>')
                            )
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* ══════════════════════════════════════════ */}
                {/* TIPO: EVALUACIÓN FINAL / CIERRE DE CURSO  */}
                {/* ══════════════════════════════════════════ */}
                {currentStep.tipo === 'final' && (
                  <div className="space-y-8">
                    {currentStep.content.evaluacion ? (
                      <div className="space-y-6">
                        <div className="pb-4 border-b border-card-border flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200/50">
                                Evaluación Final
                              </span>
                              <span className="text-xs text-foreground/40">Comprobación de Conocimientos</span>
                            </div>
                            <h2 className="text-2xl font-black text-foreground mt-1">
                              Quiz Interactivo de Evaluación
                            </h2>
                          </div>
                        </div>

                        <QuizPlayer
                          evaluacion={currentStep.content.evaluacion}
                          recursos={currentStep.content.recursos}
                          onComplete={onQuizComplete}
                        />
                      </div>
                    ) : (
                      <div className="p-8 sm:p-12 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center space-y-6">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
                          <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <div className="space-y-2 max-w-lg mx-auto">
                          <h3 className="text-2xl font-extrabold text-foreground">
                            ¡Felicitaciones! Has concluido las lecciones
                          </h3>
                          <p className="text-sm text-foreground/65 leading-relaxed">
                            {currentStep.content.actividad || 'Has revisado con éxito todos los contenidos teóricos y prácticos de este Objeto Virtual de Aprendizaje.'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Material Complementario al Cierre */}
                    {currentStep.content.recursos && (
                      <div className="pt-6 border-t border-card-border space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/60 flex items-center gap-2">
                          <FileDown className="w-4 h-4 text-[#15326C] dark:text-blue-400" />
                          <span>Materiales y Documentos Complementarios</span>
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {/* 1. PDF */}
                          {currentStep.content.recursos.pdf_url && (
                            <div
                              onClick={() => window.open(currentStep.content.recursos.pdf_url, '_blank')}
                              className="p-4 rounded-2xl border border-card-border hover:border-[#15326C] bg-card hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-all flex items-center gap-3.5 shadow-sm group"
                            >
                              <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 shrink-0 group-hover:scale-105 transition-transform">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <h5 className="text-xs font-bold text-foreground truncate">Guía Técnica en PDF</h5>
                                <p className="text-[10px] text-foreground/50">Documentación descargable</p>
                              </div>
                            </div>
                          )}

                          {/* 2. YouTube */}
                          {currentStep.content.recursos.youtube_url && (
                            <div
                              onClick={() => window.open(currentStep.content.recursos.youtube_url, '_blank')}
                              className="p-4 rounded-2xl border border-card-border hover:border-red-500/50 bg-card hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-all flex items-center gap-3.5 shadow-sm group"
                            >
                              <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 shrink-0 group-hover:scale-105 transition-transform">
                                <Youtube className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <h5 className="text-xs font-bold text-foreground truncate">Clase Audiovisual</h5>
                                <p className="text-[10px] text-foreground/50">Video explicativo en YouTube</p>
                              </div>
                            </div>
                          )}

                          {/* 3. Enlace Externo */}
                          {currentStep.content.recursos.link_externo && (
                            <div
                              onClick={() => window.open(currentStep.content.recursos.link_externo, '_blank')}
                              className="p-4 rounded-2xl border border-card-border hover:border-blue-500/50 bg-card hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-all flex items-center gap-3.5 shadow-sm group"
                            >
                              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 shrink-0 group-hover:scale-105 transition-transform">
                                <Globe className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <h5 className="text-xs font-bold text-foreground truncate">Repositorio Web</h5>
                                <p className="text-[10px] text-foreground/50">Recurso externo vinculado</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* ══════════════════════════════════════════════════════════ */}
            {/* BARRA INFERIOR DE NAVEGACIÓN ENTRE CAPÍTULOS              */}
            {/* ══════════════════════════════════════════════════════════ */}
            <div className="pt-8 mt-10 border-t border-card-border flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Botón Anterior */}
              <button
                type="button"
                onClick={() => handleStepChange(activeStep - 1)}
                disabled={activeStep === 0}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-foreground/80 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              {/* Indicador central de pasos */}
              <div className="flex items-center gap-2">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleStepChange(i)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      i === activeStep
                        ? 'w-8 bg-[#15326C] dark:bg-blue-500'
                        : completedSteps.has(i)
                        ? 'w-2 bg-emerald-500'
                        : 'w-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300'
                    }`}
                    title={`Ir al paso ${i + 1}`}
                  />
                ))}
              </div>

              {/* Botón Siguiente / Concluir */}
              {activeStep < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={() => handleStepChange(activeStep + 1)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#15326C] hover:bg-[#1E40AF] text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  <span>Siguiente Lección</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Concluir Lección</span>
                </button>
              )}
            </div>

          </div>
        </main>

      </div>
    </div>
  );
}
