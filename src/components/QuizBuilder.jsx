import React, { useState } from 'react';
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
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import RichTextEditor from './RichTextEditor';
import GlassCard from './GlassCard';
import {
  PlusCircle,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  CircleDot,
  ToggleLeft,
  Code,
  MessageSquare,
  Clock,
  Target,
  HelpCircle,
  X,
  Plus,
  Award,
  Lightbulb,
  Settings
} from 'lucide-react';

const QUESTION_TYPES = [
  { id: 'multiple_choice', label: 'Selección Múltiple', icon: CircleDot, color: 'emerald', description: 'Una respuesta correcta' },
  { id: 'true_false', label: 'Verdadero / Falso', icon: ToggleLeft, color: 'blue', description: 'Afirmación verdadera o falsa' },
  { id: 'complete_code', label: 'Completar Código', icon: Code, color: 'purple', description: 'Ejercicio de programación' },
  { id: 'short_answer', label: 'Respuesta Corta', icon: MessageSquare, color: 'amber', description: 'Texto libre evaluado' },
];

const colorClasses = {
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

// ─── Sortable Question Card ───
function SortableQuestion({ question, index, onUpdate, onRemove, totalQuestions }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const typeConfig = QUESTION_TYPES.find(t => t.id === question.tipo) || QUESTION_TYPES[0];
  const TypeIcon = typeConfig.icon;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const handleAddOption = () => {
    const newOpciones = [...(question.opciones || []), ''];
    onUpdate({ ...question, opciones: newOpciones });
  };

  const handleUpdateOption = (optIdx, value) => {
    const newOpciones = [...question.opciones];
    newOpciones[optIdx] = value;
    onUpdate({ ...question, opciones: newOpciones });
  };

  const handleRemoveOption = (optIdx) => {
    if ((question.opciones || []).length <= 2) return;
    const newOpciones = [...question.opciones];
    newOpciones.splice(optIdx, 1);
    // Adjust correct answer index if needed
    let newCorrect = question.respuesta_correcta;
    if (optIdx === newCorrect) newCorrect = 0;
    else if (optIdx < newCorrect) newCorrect--;
    onUpdate({ ...question, opciones: newOpciones, respuesta_correcta: newCorrect });
  };

  const renderQuestionEditor = () => {
    switch (question.tipo) {
      case 'multiple_choice':
        return (
          <div className="space-y-3">
            <label className="text-[10px] text-foreground/30 font-bold uppercase tracking-widest italic">
              Opciones <span className="text-emerald-400">(clic en el círculo = respuesta correcta)</span>
            </label>
            {(question.opciones || []).map((opt, optIdx) => (
              <div key={optIdx} className="flex items-center gap-3 group">
                <button
                  type="button"
                  onClick={() => onUpdate({ ...question, respuesta_correcta: optIdx })}
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    question.respuesta_correcta === optIdx
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                      : 'border-card-border text-transparent hover:border-foreground/30'
                  }`}
                  title="Marcar como correcta"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleUpdateOption(optIdx, e.target.value)}
                  placeholder={`Opción ${String.fromCharCode(65 + optIdx)}...`}
                  className="flex-1 bg-card border border-card-border rounded-xl py-2.5 px-4 text-sm text-foreground focus:border-emerald-500/50 outline-none transition-all italic"
                />
                {(question.opciones || []).length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(optIdx)}
                    className="p-1.5 rounded-lg text-foreground/15 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            {(question.opciones || []).length < 6 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="flex items-center gap-2 text-[10px] font-bold text-foreground/30 hover:text-emerald-400 transition-colors uppercase tracking-widest italic ml-10"
              >
                <Plus className="w-3.5 h-3.5" /> Añadir Opción
              </button>
            )}
          </div>
        );

      case 'true_false':
        return (
          <div className="space-y-3">
            <label className="text-[10px] text-foreground/30 font-bold uppercase tracking-widest italic">
              Respuesta Correcta
            </label>
            <div className="flex gap-4">
              {['Verdadero', 'Falso'].map((label, idx) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => onUpdate({ ...question, respuesta_correcta: idx === 0 })}
                  className={`flex-1 py-4 rounded-2xl border-2 font-bold italic text-sm transition-all ${
                    question.respuesta_correcta === (idx === 0)
                      ? idx === 0
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.08)]'
                        : 'border-red-500 bg-red-500/10 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.08)]'
                      : 'border-card-border text-foreground/30 hover:text-foreground/50 hover:border-card-border/80'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        );

      case 'complete_code':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Lenguaje (ej: JavaScript, Python...)"
                value={question.lenguaje || ''}
                onChange={(e) => onUpdate({ ...question, lenguaje: e.target.value })}
                className="bg-card border border-card-border rounded-xl py-2 px-4 text-xs text-foreground/70 focus:border-purple-500/50 outline-none transition-all italic w-56"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-foreground/30 font-bold uppercase tracking-widest italic">
                Código con blanks <span className="text-purple-400">(usa ___ para los espacios a completar)</span>
              </label>
              <div className="rounded-2xl bg-[#0d1117] border border-[#30363d] overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 bg-[#161b22] border-b border-[#30363d]">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#f85149]/60" />
                    <span className="w-3 h-3 rounded-full bg-[#d29922]/60" />
                    <span className="w-3 h-3 rounded-full bg-[#3fb950]/60" />
                  </div>
                  <span className="text-[10px] text-[#8b949e] font-mono ml-2">{question.lenguaje || 'code'}</span>
                </div>
                <textarea
                  value={question.codigo_plantilla || ''}
                  onChange={(e) => onUpdate({ ...question, codigo_plantilla: e.target.value })}
                  placeholder={'// Ejemplo:\nfunction sumar(a, b) {\n  return a ___ b;\n}'}
                  className="w-full bg-transparent text-[#c9d1d9] font-mono text-sm px-4 py-4 min-h-[150px] resize-y outline-none"
                  spellCheck={false}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-foreground/30 font-bold uppercase tracking-widest italic">
                Respuestas correctas <span className="text-purple-400">(separadas por coma, en orden)</span>
              </label>
              <input
                type="text"
                value={(question.respuestas_codigo || []).join(', ')}
                onChange={(e) => onUpdate({
                  ...question,
                  respuestas_codigo: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                })}
                placeholder="Ej: +, return, const"
                className="w-full bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:border-purple-500/50 outline-none transition-all italic font-mono"
              />
            </div>
          </div>
        );

      case 'short_answer':
        return (
          <div className="space-y-3">
            <label className="text-[10px] text-foreground/30 font-bold uppercase tracking-widest italic">
              Respuesta esperada <span className="text-amber-400">(palabras clave aceptadas, separadas por coma)</span>
            </label>
            <input
              type="text"
              value={(question.palabras_clave || []).join(', ')}
              onChange={(e) => onUpdate({
                ...question,
                palabras_clave: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              })}
              placeholder="Ej: recursividad, función recursiva, llamada recursiva"
              className="w-full bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:border-amber-500/50 outline-none transition-all italic"
            />
            <p className="text-[9px] text-foreground/20 italic ml-1">
              El sistema verificará si la respuesta del estudiante contiene al menos una de estas palabras clave.
            </p>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl border transition-all duration-300 ${
        isDragging
          ? 'border-emerald-500/40 shadow-[0_0_40px_rgba(16,185,129,0.1)] bg-card/80 scale-[1.01]'
          : 'border-card-border bg-card/20 hover:border-card-border/80'
      }`}
    >
      {/* Question Header */}
      <div className="flex items-center gap-3 px-5 py-3.5">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="p-1 rounded-lg text-foreground/15 hover:text-foreground/40 cursor-grab active:cursor-grabbing transition-colors"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black italic ${colorClasses[typeConfig.color]}`}>
          {String(index + 1).padStart(2, '0')}
        </div>

        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest italic border ${colorClasses[typeConfig.color]}`}>
          <TypeIcon className="w-3 h-3" />
          {typeConfig.label}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card border border-card-border">
            <Target className="w-3 h-3 text-foreground/30" />
            <input
              type="number"
              min="1"
              max="100"
              value={question.puntos || 10}
              onChange={(e) => onUpdate({ ...question, puntos: parseInt(e.target.value) || 10 })}
              className="w-10 bg-transparent text-xs text-foreground text-center outline-none font-bold italic"
            />
            <span className="text-[9px] text-foreground/25 font-bold italic">pts</span>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-foreground/20 hover:text-foreground/50 hover:bg-white/5 transition-all"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 rounded-lg text-foreground/15 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Question Body (expandable) */}
      {isExpanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-card-border/30 pt-4">
          {/* Enunciado */}
          <div className="space-y-2">
            <label className="text-[10px] text-foreground/30 font-bold uppercase tracking-widest italic">Enunciado</label>
            <textarea
              value={question.enunciado || ''}
              onChange={(e) => onUpdate({ ...question, enunciado: e.target.value })}
              placeholder="Escribe la pregunta aquí..."
              className="w-full bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:border-emerald-500/50 outline-none transition-all italic min-h-[70px] resize-none"
            />
          </div>

          {/* Type-specific editor */}
          {renderQuestionEditor()}

          {/* Explicación (feedback) */}
          <div className="space-y-2 pt-2 border-t border-card-border/20">
            <label className="flex items-center gap-1.5 text-[10px] text-foreground/25 font-bold uppercase tracking-widest italic">
              <Lightbulb className="w-3 h-3" /> Explicación (se muestra al resolver)
            </label>
            <input
              type="text"
              value={question.explicacion || ''}
              onChange={(e) => onUpdate({ ...question, explicacion: e.target.value })}
              placeholder="¿Por qué esta es la respuesta correcta?"
              className="w-full bg-card/50 border border-card-border/50 rounded-xl py-2.5 px-4 text-xs text-foreground/60 focus:border-emerald-500/30 outline-none transition-all italic"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main QuizBuilder Component ───
export default function QuizBuilder({ evaluacion, onChange }) {
  const [showAddMenu, setShowAddMenu] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const preguntas = evaluacion.preguntas || [];
      const oldIndex = preguntas.findIndex(q => q._id === active.id);
      const newIndex = preguntas.findIndex(q => q._id === over.id);
      onChange({
        ...evaluacion,
        preguntas: arrayMove(preguntas, oldIndex, newIndex),
      });
    }
  };

  const handleAddQuestion = (tipo) => {
    const baseQuestion = {
      _id: `q-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      tipo,
      enunciado: '',
      puntos: 10,
      explicacion: '',
    };

    switch (tipo) {
      case 'multiple_choice':
        baseQuestion.opciones = ['', '', '', ''];
        baseQuestion.respuesta_correcta = 0;
        break;
      case 'true_false':
        baseQuestion.respuesta_correcta = true;
        break;
      case 'complete_code':
        baseQuestion.lenguaje = '';
        baseQuestion.codigo_plantilla = '';
        baseQuestion.respuestas_codigo = [];
        break;
      case 'short_answer':
        baseQuestion.palabras_clave = [];
        break;
    }

    onChange({
      ...evaluacion,
      preguntas: [...(evaluacion.preguntas || []), baseQuestion],
    });
    setShowAddMenu(false);
  };

  const handleUpdateQuestion = (index, updated) => {
    const newPreguntas = [...(evaluacion.preguntas || [])];
    newPreguntas[index] = updated;
    onChange({ ...evaluacion, preguntas: newPreguntas });
  };

  const handleRemoveQuestion = (index) => {
    const newPreguntas = [...(evaluacion.preguntas || [])];
    newPreguntas.splice(index, 1);
    onChange({ ...evaluacion, preguntas: newPreguntas });
  };

  const totalPuntos = (evaluacion.preguntas || []).reduce((sum, q) => sum + (q.puntos || 10), 0);

  return (
    <div className="space-y-6">
      {/* ─── Configuration Row ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-card/20 border border-card-border space-y-2">
          <label className="flex items-center gap-1.5 text-[10px] text-foreground/30 font-bold uppercase tracking-widest italic">
            <Clock className="w-3 h-3" /> Tiempo Límite
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="120"
              value={evaluacion.tiempo_limite || 0}
              onChange={(e) => onChange({ ...evaluacion, tiempo_limite: parseInt(e.target.value) || 0 })}
              className="w-20 bg-card border border-card-border rounded-lg py-2 px-3 text-sm text-foreground text-center outline-none focus:border-emerald-500/50 transition-all font-bold italic"
            />
            <span className="text-xs text-foreground/30 italic">minutos</span>
            <span className="text-[9px] text-foreground/15 italic ml-1">(0 = sin límite)</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card/20 border border-card-border space-y-2">
          <label className="flex items-center gap-1.5 text-[10px] text-foreground/30 font-bold uppercase tracking-widest italic">
            <Target className="w-3 h-3" /> Nota Mínima
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="100"
              value={evaluacion.nota_minima || 60}
              onChange={(e) => onChange({ ...evaluacion, nota_minima: parseInt(e.target.value) || 60 })}
              className="w-20 bg-card border border-card-border rounded-lg py-2 px-3 text-sm text-foreground text-center outline-none focus:border-emerald-500/50 transition-all font-bold italic"
            />
            <span className="text-xs text-foreground/30 italic">% para aprobar</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card/20 border border-card-border space-y-2">
          <label className="flex items-center gap-1.5 text-[10px] text-foreground/30 font-bold uppercase tracking-widest italic">
            <Award className="w-3 h-3" /> Resumen
          </label>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-foreground font-bold italic">{(evaluacion.preguntas || []).length}</span>
            <span className="text-foreground/20 text-xs italic">preguntas</span>
            <span className="text-foreground/10">•</span>
            <span className="text-emerald-400 font-bold italic">{totalPuntos}</span>
            <span className="text-foreground/20 text-xs italic">pts total</span>
          </div>
        </div>
      </div>

      {/* ─── Instructions ─── */}
      <div className="space-y-2">
        <label className="text-[10px] text-foreground/30 font-bold uppercase tracking-widest italic ml-1">
          Instrucciones para el Estudiante
        </label>
        <RichTextEditor
          content={evaluacion.instrucciones || ''}
          onChange={(html) => onChange({ ...evaluacion, instrucciones: html })}
          placeholder="Describe las reglas de la evaluación, criterios de aprobación, etc..."
          minHeight="80px"
        />
      </div>

      {/* ─── Questions List ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <label className="text-[10px] text-foreground/30 font-bold uppercase tracking-widest italic">
            Banco de Preguntas
          </label>
          <span className="text-[9px] text-foreground/15 italic">
            Arrastra para reordenar
          </span>
        </div>

        {(evaluacion.preguntas || []).length > 0 ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={(evaluacion.preguntas || []).map(q => q._id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {(evaluacion.preguntas || []).map((question, idx) => (
                  <SortableQuestion
                    key={question._id}
                    question={question}
                    index={idx}
                    onUpdate={(updated) => handleUpdateQuestion(idx, updated)}
                    onRemove={() => handleRemoveQuestion(idx)}
                    totalQuestions={(evaluacion.preguntas || []).length}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="py-16 rounded-3xl border-2 border-dashed border-card-border text-center space-y-4">
            <div className="p-4 rounded-2xl bg-card/30 inline-block">
              <HelpCircle className="w-10 h-10 text-foreground/10" />
            </div>
            <div>
              <p className="text-sm text-foreground/30 font-bold italic">No hay preguntas aún</p>
              <p className="text-[10px] text-foreground/15 italic mt-1">Añade tu primera pregunta para construir la evaluación</p>
            </div>
          </div>
        )}
      </div>

      {/* ─── Add Question Button ─── */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="w-full py-4 rounded-2xl border-2 border-dashed border-emerald-500/15 hover:border-emerald-500/30 text-emerald-400/60 hover:text-emerald-400 transition-all flex items-center justify-center gap-3 group"
        >
          <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest italic">Añadir Pregunta</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showAddMenu ? 'rotate-180' : ''}`} />
        </button>

        {showAddMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowAddMenu(false)} />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-80 bg-card border border-card-border rounded-2xl shadow-2xl overflow-hidden z-50">
              <div className="p-3 border-b border-card-border">
                <p className="text-[10px] text-foreground/30 font-bold uppercase tracking-widest italic text-center">Selecciona Tipo</p>
              </div>
              {QUESTION_TYPES.map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => handleAddQuestion(type.id)}
                  className="w-full flex items-center gap-4 px-5 py-3.5 text-left transition-colors text-foreground/60 hover:bg-white/5 hover:text-foreground"
                >
                  <div className={`p-2 rounded-xl border ${colorClasses[type.color]}`}>
                    <type.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold italic block">{type.label}</span>
                    <span className="text-[9px] text-foreground/25 italic">{type.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
