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
import Button from '../components/Button';
import GlassCard from '../components/GlassCard';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  Save,
  PlusCircle,
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
  Target,
  MessageSquare,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OvaEditor({
  ovaForm,
  setOvaForm,
  editingOva,
  onSave,
  onCancel,
  onFileUpload,
  hasDraft,
  draftData,
  onRecoverDraft,
  onDiscardDraft,
}) {
  const [activeSection, setActiveSection] = useState(null);
  const sectionRefs = useRef({});
  const [isSaving, setIsSaving] = useState(false);

  // Generate unique IDs for sections if they don't have them
  useEffect(() => {
    const needsIds = ovaForm.contenido.some((s, i) => !s._id);
    if (needsIds) {
      setOvaForm({
        ...ovaForm,
        contenido: ovaForm.contenido.map((s, i) => ({
          ...s,
          _id: s._id || `section-${Date.now()}-${i}`,
        })),
      });
    }
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
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
      contenido: [...ovaForm.contenido, newSection],
    });
    // Scroll to new section after render
    setTimeout(() => {
      const el = document.getElementById(`section-${ovaForm.contenido.length}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleUpdateSection = (index, updatedSection) => {
    const newContenido = [...ovaForm.contenido];
    newContenido[index] = updatedSection;
    setOvaForm({ ...ovaForm, contenido: newContenido });
  };

  const handleRemoveSection = (index) => {
    if (ovaForm.contenido.length <= 1) {
      toast.error('El OVA debe tener al menos una sección de contenido.');
      return;
    }
    const newContenido = [...ovaForm.contenido];
    newContenido.splice(index, 1);
    setOvaForm({ ...ovaForm, contenido: newContenido });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave();
    } finally {
      setIsSaving(false);
    }
  };

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const el = document.getElementById(sectionId);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const sidebarSections = [
    { id: 'datos-generales', label: 'Datos Generales', icon: FileText },
    { id: 'introduccion', label: 'Introducción', icon: MessageSquare },
    ...ovaForm.contenido.map((s, i) => ({
      id: `section-${i}`,
      label: s.titulo || `Sección ${i + 1}`,
      icon: Layers,
      isContent: true,
    })),
    { id: 'recursos', label: 'Material Complementario', icon: FileDown },
    { id: 'evaluacion', label: 'Evaluación Final', icon: Award },
  ];

  return (
    <div className="flex gap-8 min-h-[80vh]">
      {/* ═══════════════════════════════════════ */}
      {/* SIDEBAR - Navigation Index */}
      {/* ═══════════════════════════════════════ */}
      <div className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-6 space-y-6">
          {/* Back + Title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="p-2 rounded-xl bg-card hover:bg-white/10 text-foreground/60 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h3 className="text-sm font-bold text-foreground italic">
                {editingOva ? 'Editar OVA' : 'Nuevo OVA'}
              </h3>
              <p className="text-[10px] text-foreground/30 uppercase tracking-widest font-bold italic">Constructor</p>
            </div>
          </div>

          {/* Status Toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOvaForm({ ...ovaForm, estado: 'borrador' })}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest italic border transition-all ${
                ovaForm.estado === 'borrador'
                  ? 'border-amber-500/30 text-amber-400 bg-amber-500/5'
                  : 'border-card-border text-foreground/30 hover:text-foreground/50'
              }`}
            >
              <EyeOff className="w-3 h-3" /> Borrador
            </button>
            <button
              type="button"
              onClick={() => setOvaForm({ ...ovaForm, estado: 'publicado' })}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest italic border transition-all ${
                ovaForm.estado === 'publicado'
                  ? 'border-[#059669]/30 text-[#059669] bg-[#059669]/5'
                  : 'border-card-border text-foreground/30 hover:text-foreground/50'
              }`}
            >
              <Eye className="w-3 h-3" /> Público
            </button>
          </div>

          {/* Section Index */}
          <GlassCard className="p-4 border-card-border bg-card/30">
            <h4 className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] italic mb-4">
              Índice de Secciones
            </h4>
            <nav className="space-y-1 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
              {sidebarSections.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToSection(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all group ${
                    activeSection === item.id
                      ? 'bg-[#059669]/10 text-[#059669]'
                      : 'text-foreground/40 hover:text-foreground/70 hover:bg-white/3'
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[11px] font-bold italic truncate">
                    {item.label}
                  </span>
                </button>
              ))}
            </nav>

            <button
              type="button"
              onClick={handleAddSection}
              className="w-full mt-4 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-[#059669]/20 text-[#059669] hover:bg-[#059669]/5 transition-all text-[10px] font-bold uppercase tracking-widest italic"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Añadir Sección
            </button>
          </GlassCard>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full gap-2 italic uppercase tracking-widest py-3 text-xs font-black"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'GUARDANDO...' : 'GUARDAR OVA'}
          </Button>
        </div>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* MAIN EDITOR AREA */}
      {/* ═══════════════════════════════════════ */}
      <div className="flex-1 space-y-8 min-w-0">
        <AnimatePresence>
          {hasDraft && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-[#059669]/10 border border-[#059669]/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg shadow-[#059669]/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#059669]/20 flex items-center justify-center text-[#059669]">
                    <AlertCircle className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground italic">¡Borrador Detectado!</h4>
                    <p className="text-xs text-foreground/50 italic">
                      Se encontró una versión guardada de esta OVA ({new Date(draftData?.lastSaved).toLocaleTimeString()}).
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDiscardDraft}
                    className="text-[10px] font-bold italic border-red-500/20 text-red-400 hover:bg-red-500/10"
                  >
                    DESCARTAR
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onRecoverDraft}
                    className="text-[10px] font-bold italic px-6"
                  >
                    RECUPERAR AHORA
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between gap-4 pb-4 border-b border-card-border">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="p-2 rounded-xl bg-card hover:bg-white/10 text-foreground/60 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-foreground italic">
              {editingOva ? 'Editar OVA' : 'Nuevo OVA'}
            </h3>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOvaForm({ ...ovaForm, estado: ovaForm.estado === 'publicado' ? 'borrador' : 'publicado' })}
              className={`p-2 rounded-xl transition-all ${
                ovaForm.estado === 'publicado'
                  ? 'bg-[#059669]/10 text-[#059669]'
                  : 'bg-amber-500/10 text-amber-400'
              }`}
            >
              {ovaForm.estado === 'publicado' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <Button onClick={handleSave} disabled={isSaving} size="sm" className="gap-1 italic text-xs">
              <Save className="w-3.5 h-3.5" />
              {isSaving ? '...' : 'GUARDAR'}
            </Button>
          </div>
        </div>

        {/* ─── DATOS GENERALES ─── */}
        <section id="datos-generales" className="scroll-mt-6">
          <GlassCard className="p-8 border-card-border space-y-6">
            <h4 className="flex items-center gap-2 text-[#059669] text-xs font-black uppercase tracking-[0.2em] italic">
              <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" /> Datos Generales
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs text-foreground/40 font-bold uppercase italic ml-1">Título del OVA *</label>
                <input
                  type="text"
                  placeholder="Ingrese un título impactante..."
                  value={ovaForm.titulo}
                  onChange={(e) => setOvaForm({ ...ovaForm, titulo: e.target.value })}
                  className="w-full bg-card border border-card-border rounded-xl py-4 px-5 text-xl text-foreground focus:border-[#059669] outline-none transition-all italic font-bold tracking-tight"
                />
              </div>

              {/* Objective */}
              <div className="space-y-2">
                <label className="text-xs text-foreground/40 font-bold uppercase italic ml-1">Objetivo Pedagógico *</label>
                <textarea
                  placeholder="¿Qué aprenderá el estudiante?"
                  value={ovaForm.objetivo}
                  onChange={(e) => setOvaForm({ ...ovaForm, objetivo: e.target.value })}
                  className="w-full bg-card border border-card-border rounded-xl py-4 px-5 text-sm text-foreground focus:border-[#059669] outline-none transition-all italic h-32 resize-none"
                />
              </div>

              {/* Cover Image */}
              <div className="space-y-2">
                <label className="text-xs text-foreground/40 font-bold uppercase italic ml-1">Imagen de Portada</label>
                {ovaForm.imagen_portada ? (
                  <div className="relative group rounded-2xl overflow-hidden border border-card-border aspect-video">
                    <img src={ovaForm.imagen_portada} className="w-full h-full object-cover" alt="Portada" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setOvaForm({ ...ovaForm, imagen_portada: '' })}
                        className="p-3 bg-red-500 text-white rounded-xl"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-3 w-full h-32 rounded-2xl border-2 border-dashed border-card-border hover:border-[#059669]/30 bg-card/20 cursor-pointer transition-all group">
                    <ImageIcon className="w-6 h-6 text-foreground/30 group-hover:text-[#059669] transition-colors" />
                    <span className="text-[10px] text-foreground/40 font-bold uppercase tracking-widest italic">
                      Subir Imagen .JPG / .PNG
                    </span>
                    <input type="file" accept="image/*" onChange={(e) => onFileUpload(e, 'portada')} className="hidden" />
                  </label>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs text-foreground/40 font-bold uppercase italic ml-1">Descripción Breve</label>
                <input
                  type="text"
                  placeholder="Resumen del contenido del OVA..."
                  value={ovaForm.descripcion}
                  onChange={(e) => setOvaForm({ ...ovaForm, descripcion: e.target.value })}
                  className="w-full bg-card border border-card-border rounded-xl py-4 px-5 text-sm text-foreground focus:border-[#059669] outline-none transition-all italic"
                />
              </div>
            </div>
          </GlassCard>
        </section>

        {/* ─── INTRODUCCIÓN ─── */}
        <section id="introduccion" className="scroll-mt-6">
          <GlassCard className="p-8 border-card-border space-y-4">
            <h4 className="flex items-center gap-2 text-[#059669] text-xs font-black uppercase tracking-[0.2em] italic">
              <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" /> Introducción
            </h4>
            <RichTextEditor
              content={ovaForm.introduccion || ''}
              onChange={(html) => setOvaForm({ ...ovaForm, introduccion: html })}
              placeholder="Escribe el marco introductorio del OVA..."
              minHeight="120px"
            />
          </GlassCard>
        </section>

        {/* ─── CONTENIDO DINÁMICO ─── */}
        <section className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h4 className="flex items-center gap-2 text-[#059669] text-xs font-black uppercase tracking-[0.2em] italic">
              <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" /> Estructura de Contenido
            </h4>
            <button
              type="button"
              onClick={handleAddSection}
              className="flex items-center gap-2 text-[10px] font-bold text-[#059669] hover:text-[#047857] transition-colors uppercase tracking-widest italic"
            >
              <PlusCircle className="w-4 h-4" /> Añadir Sección
            </button>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={ovaForm.contenido.map(s => s._id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-6">
                <AnimatePresence>
                  {ovaForm.contenido.map((section, idx) => (
                    <motion.div
                      key={section._id}
                      id={`section-${idx}`}
                      className="scroll-mt-6"
                      initial={{ opacity: 0, y: 20, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.98 }}
                      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
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

          {/* Add Section Button (bottom) */}
          <button
            type="button"
            onClick={handleAddSection}
            className="w-full py-6 rounded-3xl border-2 border-dashed border-card-border hover:border-[#059669]/30 text-foreground/20 hover:text-[#059669] transition-all flex items-center justify-center gap-3 group"
          >
            <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-widest italic">Añadir nueva sección</span>
          </button>
        </section>

        {/* ─── RECURSOS Y EVALUACIÓN ─── */}
        <div id="recursos" className="scroll-mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Material Complementario */}
          <GlassCard className="p-8 border-card-border space-y-6">
            <h4 className="flex items-center gap-2 text-[#059669] text-xs font-black uppercase tracking-[0.2em] italic">
              <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" /> Material Complementario
            </h4>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-card/20 border border-card-border space-y-3">
                <label className="flex items-center gap-2 text-[10px] text-foreground/40 font-bold italic uppercase tracking-widest">
                  <FileDown className="w-3 h-3" /> Guía PDF
                </label>
                {ovaForm.recursos.pdf_url ? (
                  <div className="flex items-center justify-between text-xs text-foreground bg-[#059669]/10 p-3 rounded-xl italic">
                    <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-[#059669]" /> Archivo cargado</span>
                    <button type="button" onClick={() => setOvaForm({ ...ovaForm, recursos: { ...ovaForm.recursos, pdf_url: '' } })} className="text-red-400 hover:text-red-300 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-card-border text-foreground/40 hover:text-foreground/60 hover:border-[#059669]/20 cursor-pointer transition-all text-[10px] font-bold uppercase tracking-widest italic">
                    <PlusCircle className="w-3.5 h-3.5" /> Subir documento PDF
                    <input type="file" accept=".pdf" onChange={(e) => onFileUpload(e, 'pdf')} className="hidden" />
                  </label>
                )}
              </div>

              <div className="p-4 rounded-xl bg-card/20 border border-card-border space-y-3">
                <label className="flex items-center gap-2 text-[10px] text-foreground/40 font-bold italic uppercase tracking-widest">
                  <Youtube className="w-3 h-3" /> Link YouTube
                </label>
                <input
                  type="text"
                  placeholder="https://youtube.com/..."
                  value={ovaForm.recursos.youtube_url}
                  onChange={(e) => setOvaForm({ ...ovaForm, recursos: { ...ovaForm.recursos, youtube_url: e.target.value } })}
                  className="w-full bg-transparent border-b border-card-border py-2 text-xs text-foreground focus:border-red-500 outline-none italic transition-all"
                />
              </div>

              <div className="p-4 rounded-xl bg-card/20 border border-card-border space-y-3">
                <label className="flex items-center gap-2 text-[10px] text-foreground/40 font-bold italic uppercase tracking-widest">
                  <Globe className="w-3 h-3" /> Enlace Externo
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={ovaForm.recursos.link_externo}
                  onChange={(e) => setOvaForm({ ...ovaForm, recursos: { ...ovaForm.recursos, link_externo: e.target.value } })}
                  className="w-full bg-transparent border-b border-card-border py-2 text-xs text-foreground focus:border-blue-500 outline-none italic transition-all"
                />
              </div>
            </div>
          </GlassCard>

        </div>

        {/* ─── EVALUACIÓN FINAL (full width) ─── */}
        <section id="evaluacion" className="scroll-mt-6">
          <GlassCard className="p-8 border-card-border space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="flex items-center gap-2 text-[#059669] text-xs font-black uppercase tracking-[0.2em] italic">
                <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" /> Evaluación Final — Quiz Interactivo
              </h4>
              <div className="flex items-center gap-2 text-[9px] text-foreground/20 italic">
                <Award className="w-3 h-3" /> Sistema de evaluación tipo quiz
              </div>
            </div>
            <QuizBuilder
              evaluacion={ovaForm.evaluacion || { instrucciones: '', preguntas: [], nota_minima: 60, tiempo_limite: 0 }}
              onChange={(evaluacion) => setOvaForm({ ...ovaForm, evaluacion })}
            />
          </GlassCard>
        </section>

        {/* ─── BOTTOM SAVE BAR (Mobile) ─── */}
        <div className="lg:hidden pt-6 border-t border-card-border flex gap-4 pb-10">
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1 italic uppercase tracking-widest py-3"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 gap-2 italic uppercase tracking-widest py-3"
          >
            <Save className="w-4 h-4" /> {isSaving ? 'Guardando...' : 'Guardar OVA'}
          </Button>
        </div>
      </div>
    </div>
  );
}
