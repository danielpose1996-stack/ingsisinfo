import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sanitizeHTML } from '../lib/security';
import GlassCard from './GlassCard';
import Button from './Button';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  ChevronLeft,
  Award,
  Target,
  RotateCcw,
  Lightbulb,
  Trophy,
  AlertTriangle,
  Code,
  MessageSquare,
  CircleDot,
  ToggleLeft,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Scoring Logic ───
function evaluateAnswer(question, answer) {
  if (answer === null || answer === undefined || answer === '') return false;

  switch (question.tipo) {
    case 'multiple_choice':
      return answer === question.respuesta_correcta;

    case 'true_false':
      return answer === question.respuesta_correcta;

    case 'complete_code': {
      if (!Array.isArray(answer) || !Array.isArray(question.respuestas_codigo)) return false;
      return question.respuestas_codigo.every((expected, i) =>
        answer[i]?.trim().toLowerCase() === expected.trim().toLowerCase()
      );
    }

    case 'short_answer': {
      if (!answer || !Array.isArray(question.palabras_clave)) return false;
      const lowerAnswer = answer.trim().toLowerCase();
      return question.palabras_clave.some(kw =>
        lowerAnswer.includes(kw.trim().toLowerCase())
      );
    }

    default: return false;
  }
}

export default function QuizPlayer({ evaluacion, recursos, onComplete }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const timerRef = useRef(null);

  const preguntas = evaluacion?.preguntas || [];
  const totalPuntos = preguntas.reduce((sum, q) => sum + (q.puntos || 10), 0);

  // Timer
  useEffect(() => {
    if (quizStarted && evaluacion.tiempo_limite > 0 && !isSubmitted) {
      setTimeLeft(evaluacion.tiempo_limite * 60);
    }
    return () => clearInterval(timerRef.current);
  }, [quizStarted]);

  useEffect(() => {
    if (timeLeft === null || isSubmitted) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, isSubmitted]);

  const formatTime = (seconds) => {
    if (seconds === null) return '';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAnswer = useCallback((qId, value) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  }, []);

  const handleSubmit = useCallback(() => {
    setIsSubmitted(true);
    setShowResults(true);
    clearTimeout(timerRef.current);

    // Calculate once to notify parent
    const finalResults = preguntas.map(q => ({
      question: q,
      answer: answers[q._id],
      isCorrect: evaluateAnswer(q, answers[q._id]),
      puntos: q.puntos || 10,
    }));
    const finalScore = finalResults.filter(r => r.isCorrect).reduce((sum, r) => sum + r.puntos, 0);
    const finalPercentage = totalPuntos > 0 ? Math.round((finalScore / totalPuntos) * 100) : 0;
    const finalPassed = finalPercentage >= (evaluacion.nota_minima || 60);

    if (onComplete) {
      onComplete(finalScore, finalPercentage, finalPassed);
    }
  }, [preguntas, answers, totalPuntos, evaluacion.nota_minima, onComplete]);

  const handleRestart = () => {
    setAnswers({});
    setIsSubmitted(false);
    setShowResults(false);
    setCurrentQuestion(0);
    setQuizStarted(false);
    setTimeLeft(null);
  };

  const current = preguntas[currentQuestion];
  const answered = Object.keys(answers).length;
  const progress = preguntas.length > 0 ? (answered / preguntas.length) * 100 : 0;

  // Calculate results
  const results = preguntas.map(q => ({
    question: q,
    answer: answers[q._id],
    isCorrect: evaluateAnswer(q, answers[q._id]),
    puntos: q.puntos || 10,
  }));
  const score = results.filter(r => r.isCorrect).reduce((sum, r) => sum + r.puntos, 0);
  const percentage = totalPuntos > 0 ? Math.round((score / totalPuntos) * 100) : 0;
  const passed = percentage >= (evaluacion.nota_minima || 60);

  // ─── Start Screen ───
  if (!quizStarted) {
    return (
      <div className="h-full flex flex-col justify-center max-w-2xl mx-auto text-center space-y-10">
        <div className="relative">
          <div className="absolute inset-0 bg-[#1E3A8A]/20 blur-[100px] rounded-full scale-150" />
          <div className="relative space-y-6">
            <Award className="w-20 h-20 text-[#1E3A8A] mx-auto drop-shadow-[0_0_15px_rgba(5,150,105,0.5)]" />
            <h2 className="text-4xl lg:text-5xl font-black text-foreground italic uppercase tracking-tighter">
              Evaluación Final
            </h2>
            {evaluacion.instrucciones && (
              <div
                className="text-foreground/60 italic text-base max-w-xl mx-auto leading-relaxed"
                dangerouslySetInnerHTML={{ __html: sanitizeHTML(evaluacion.instrucciones) }}
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
          <GlassCard className="p-5 border-card-border text-center">
            <CircleDot className="w-5 h-5 text-[#1E3A8A] mx-auto mb-2" />
            <p className="text-2xl font-black text-foreground italic">{preguntas.length}</p>
            <p className="text-[9px] text-foreground/30 font-bold uppercase tracking-widest italic">Preguntas</p>
          </GlassCard>
          <GlassCard className="p-5 border-card-border text-center">
            <Target className="w-5 h-5 text-amber-400 mx-auto mb-2" />
            <p className="text-2xl font-black text-foreground italic">{evaluacion.nota_minima || 60}%</p>
            <p className="text-[9px] text-foreground/30 font-bold uppercase tracking-widest italic">Para Aprobar</p>
          </GlassCard>
          <GlassCard className="p-5 border-card-border text-center">
            <Clock className="w-5 h-5 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-black text-foreground italic">
              {evaluacion.tiempo_limite > 0 ? `${evaluacion.tiempo_limite}'` : '∞'}
            </p>
            <p className="text-[9px] text-foreground/30 font-bold uppercase tracking-widest italic">Minutos</p>
          </GlassCard>
        </div>

        <Button
          onClick={() => setQuizStarted(true)}
          className="mx-auto gap-3 italic uppercase tracking-widest py-4 px-12 text-sm font-black"
        >
          Comenzar Evaluación <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  // ─── Results Screen ───
  if (showResults) {
    return (
      <div className="space-y-8 max-w-3xl mx-auto pb-10">
        {/* Score Header */}
        <div className="text-center space-y-6 py-8">
          <div className="relative inline-block">
            <div className={`absolute inset-0 blur-[60px] rounded-full scale-150 ${passed ? 'bg-[#1E3A8A]/30' : 'bg-red-500/20'}`} />
            <div className="relative">
              {passed ? (
                <Trophy className="w-20 h-20 text-[#1E3A8A] mx-auto drop-shadow-[0_0_15px_rgba(5,150,105,0.5)]" />
              ) : (
                <AlertTriangle className="w-20 h-20 text-red-400 mx-auto drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
              )}
            </div>
          </div>

          <div>
            <h2 className={`text-6xl font-black italic ${passed ? 'text-[#1E3A8A]' : 'text-red-400'}`}>
              {percentage}%
            </h2>
            <p className={`text-lg font-bold italic mt-2 ${passed ? 'text-[#1E3A8A]/70' : 'text-red-400/70'}`}>
              {passed ? '¡Evaluación Aprobada!' : 'No Aprobado'}
            </p>
            <p className="text-xs text-foreground/30 italic mt-1">
              {score} / {totalPuntos} puntos • {results.filter(r => r.isCorrect).length} de {preguntas.length} correctas
            </p>
          </div>
        </div>

        {/* Question Review */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] italic">
            Revisión de Respuestas
          </h3>
          {results.map((result, idx) => (
            <GlassCard
              key={result.question._id}
              className={`p-6 border-2 space-y-3 ${
                result.isCorrect ? 'border-[#1E3A8A]/20 bg-[#1E3A8A]/[0.02]' : 'border-red-500/15 bg-red-500/[0.02]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                  result.isCorrect ? 'bg-[#1E3A8A]/20 text-[#1E3A8A]' : 'bg-red-500/15 text-red-400'
                }`}>
                  {result.isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground font-bold italic">
                    {idx + 1}. {result.question.enunciado}
                  </p>

                  {/* Show correct answer */}
                  {!result.isCorrect && (
                    <div className="mt-2 text-xs text-[#1E3A8A] italic">
                      <span className="font-bold">Respuesta correcta: </span>
                      {result.question.tipo === 'multiple_choice' && result.question.opciones?.[result.question.respuesta_correcta]}
                      {result.question.tipo === 'true_false' && (result.question.respuesta_correcta ? 'Verdadero' : 'Falso')}
                      {result.question.tipo === 'complete_code' && result.question.respuestas_codigo?.join(', ')}
                      {result.question.tipo === 'short_answer' && result.question.palabras_clave?.join(', ')}
                    </div>
                  )}

                  {/* Explanation */}
                  {result.question.explicacion && (
                    <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-card/30 border border-card-border/30">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-foreground/50 italic leading-relaxed">{result.question.explicacion}</p>
                    </div>
                  )}
                </div>

                <span className={`text-xs font-bold italic shrink-0 ${
                  result.isCorrect ? 'text-[#1E3A8A]' : 'text-foreground/20'
                }`}>
                  {result.isCorrect ? `+${result.puntos}` : '0'} pts
                </span>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Retry Button */}
        <div className="flex justify-center pt-4">
          <Button
            onClick={handleRestart}
            variant="outline"
            className="gap-2 italic uppercase tracking-widest py-3 px-8"
          >
            <RotateCcw className="w-4 h-4" /> Intentar de Nuevo
          </Button>
        </div>
      </div>
    );
  }

  // ─── Question View ───
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Progress Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-foreground/30 font-bold italic">
            Pregunta {currentQuestion + 1} de {preguntas.length}
          </span>
          <div className="flex items-center gap-4">
            {timeLeft !== null && (
              <span className={`flex items-center gap-1.5 font-mono font-bold italic ${
                timeLeft < 60 ? 'text-red-400 animate-pulse' : 'text-foreground/40'
              }`}>
                <Clock className="w-3.5 h-3.5" />
                {formatTime(timeLeft)}
              </span>
            )}
            <span className="text-foreground/20 italic">{answered}/{preguntas.length} respondidas</span>
          </div>
        </div>
        <div className="h-1.5 bg-card rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1E3A8A] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((currentQuestion + 1) / preguntas.length) * 100}%` }}
          />
        </div>

        {/* Question dots */}
        <div className="flex items-center gap-1.5 justify-center">
          {preguntas.map((q, i) => (
            <button
              key={q._id}
              type="button"
              onClick={() => setCurrentQuestion(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === currentQuestion
                  ? 'w-6 bg-[#1E3A8A]'
                  : answers[q._id] !== undefined
                    ? 'bg-[#1E3A8A]/30'
                    : 'bg-card-border'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Question Card */}
      {current && (
        <AnimatePresence mode="wait">
          <motion.div
            key={current._id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          >
            <GlassCard className="p-8 border-card-border space-y-6">
              {/* Question Type Badge */}
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest italic border ${
                  current.tipo === 'multiple_choice' ? 'bg-[#1E3A8A]/10 text-[#1E3A8A] border-[#1E3A8A]/20' :
                  current.tipo === 'true_false' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                  current.tipo === 'complete_code' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                  'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {current.tipo === 'multiple_choice' && <><CircleDot className="w-3 h-3" /> Selección Múltiple</>}
                  {current.tipo === 'true_false' && <><ToggleLeft className="w-3 h-3" /> Verdadero / Falso</>}
                  {current.tipo === 'complete_code' && <><Code className="w-3 h-3" /> Completar Código</>}
                  {current.tipo === 'short_answer' && <><MessageSquare className="w-3 h-3" /> Respuesta Corta</>}
                </div>
                <span className="text-[9px] text-foreground/20 font-bold italic ml-auto">{current.puntos || 10} pts</span>
              </div>

              {/* Enunciado */}
              <h3 className="text-xl font-bold text-foreground italic leading-relaxed">
                {current.enunciado}
              </h3>

              {/* Answer Area */}
              <div className="space-y-3">
                {current.tipo === 'multiple_choice' && (
                  <div className="space-y-3">
                    {(current.opciones || []).map((opt, optIdx) => (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleAnswer(current._id, optIdx)}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                          answers[current._id] === optIdx
                            ? 'border-[#1E3A8A] bg-[#1E3A8A]/5 text-foreground shadow-[0_0_20px_rgba(5,150,105,0.05)]'
                            : 'border-card-border text-foreground/60 hover:border-foreground/20 hover:text-foreground hover:bg-white/[0.02]'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          answers[current._id] === optIdx
                            ? 'border-[#1E3A8A] bg-[#1E3A8A]/20 text-[#1E3A8A]'
                            : 'border-card-border text-foreground/20'
                        }`}>
                          <span className="text-xs font-black italic">{String.fromCharCode(65 + optIdx)}</span>
                        </div>
                        <span className="text-sm font-bold italic">{opt}</span>
                      </button>
                    ))}
                  </div>
                )}

                {current.tipo === 'true_false' && (
                  <div className="flex gap-4">
                    {[true, false].map((value) => (
                      <button
                        key={String(value)}
                        type="button"
                        onClick={() => handleAnswer(current._id, value)}
                        className={`flex-1 py-6 rounded-3xl border-2 font-bold italic text-lg transition-all ${
                          answers[current._id] === value
                            ? value
                              ? 'border-[#1E3A8A] bg-[#1E3A8A]/10 text-[#1E3A8A] shadow-[0_0_30px_rgba(5,150,105,0.08)]'
                              : 'border-red-500 bg-red-500/10 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.08)]'
                            : 'border-card-border text-foreground/30 hover:text-foreground/60 hover:border-foreground/20'
                        }`}
                      >
                        {value ? 'Verdadero' : 'Falso'}
                      </button>
                    ))}
                  </div>
                )}

                {current.tipo === 'complete_code' && (
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-[#0d1117] border border-[#30363d] overflow-hidden">
                      <div className="flex items-center gap-2 px-4 py-2 bg-[#161b22] border-b border-[#30363d]">
                        <div className="flex gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-[#f85149]/60" />
                          <span className="w-3 h-3 rounded-full bg-[#d29922]/60" />
                          <span className="w-3 h-3 rounded-full bg-[#3fb950]/60" />
                        </div>
                        <span className="text-[10px] text-[#8b949e] font-mono ml-2">{current.lenguaje || 'code'}</span>
                      </div>
                      <pre className="px-4 py-4 text-sm text-[#c9d1d9] font-mono leading-relaxed whitespace-pre-wrap">
                        {renderCodeWithBlanks(current.codigo_plantilla || '', current._id, answers, handleAnswer)}
                      </pre>
                    </div>
                  </div>
                )}

                {current.tipo === 'short_answer' && (
                  <textarea
                    value={answers[current._id] || ''}
                    onChange={(e) => handleAnswer(current._id, e.target.value)}
                    placeholder="Escribe tu respuesta aquí..."
                    className="w-full bg-card border border-card-border rounded-2xl py-4 px-5 text-sm text-foreground focus:border-amber-500/50 outline-none transition-all italic resize-none min-h-[120px]"
                  />
                )}
              </div>
            </GlassCard>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
          className="gap-2 italic disabled:opacity-20"
        >
          <ChevronLeft className="w-4 h-4" /> Anterior
        </Button>

        {currentQuestion === preguntas.length - 1 ? (
          <Button
            onClick={handleSubmit}
            className="gap-2 italic uppercase tracking-widest font-black py-3 px-8"
          >
            <Send className="w-4 h-4" /> Enviar Evaluación
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentQuestion(Math.min(preguntas.length - 1, currentQuestion + 1))}
            className="gap-2 italic"
          >
            Siguiente <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Code with blanks renderer ───
function renderCodeWithBlanks(template, questionId, answers, onAnswer) {
  if (!template) return null;
  const parts = template.split('___');
  if (parts.length <= 1) return <code>{template}</code>;

  const currentAnswers = answers[questionId] || [];

  return parts.map((part, i) => (
    <React.Fragment key={i}>
      <span>{part}</span>
      {i < parts.length - 1 && (
        <input
          type="text"
          value={currentAnswers[i] || ''}
          onChange={(e) => {
            const newAnswers = [...(answers[questionId] || [])];
            newAnswers[i] = e.target.value;
            onAnswer(questionId, newAnswers);
          }}
          className="inline-block w-24 bg-[#1a2332] border-b-2 border-[#3fb950] text-[#3fb950] font-mono text-sm px-2 py-0.5 mx-1 outline-none focus:border-[#58d68d] text-center"
          placeholder="___"
          spellCheck={false}
        />
      )}
    </React.Fragment>
  ));
}
