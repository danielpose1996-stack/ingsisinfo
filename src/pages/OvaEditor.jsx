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
  Award,
  Loader2
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

  // Generar IDs únicos para las secciones si no cuentan con uno
  useEffect(() => {
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
      contenido: [...(ovaForm.contenido || []), newSection],
    });
    // Desplazarse a la nueva sección tras el renderizado
    setTimeout(() => {
      const el = document.getElementById(`section-${ovaForm.contenido?.length || 0}`);
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

  const scrollToSection = (id) => {
    setActiveSection(id);
    const element = sectionRefs.current[id];
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

  const sidebarSections = [
    { id: 'datos-generales', label: 'Datos Generales', icon: FileText },
    { id: 'pedagogia', label: 'Información Pedagógica', icon: Target },
    { id: 'secciones', label: `Secciones (${ovaForm.contenido?.length || 0})`, icon: Layers },
  ];

  return (
    <div className="flex gap-8 min-h-[80vh]">
      {/* ═══════════════════════════════════════ */}
      {/* BARRA LATERAL - Índice de Navegación     */}
      {/* ═══════════════════════════════════════ */}
      <div className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-6 space-y-6">
          {/* Volver y Título */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="p-2 rounded-xl bg-card hover:bg-white/10 text-foreground/60 transition-colors cursor-pointer"
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

          {/* Alternador de Estado */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOvaForm({ ...ovaForm, estado: 'borrador' })}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest italic border transition-all cursor-pointer ${
                ovaForm.estado === 'borrador'
                  ? 'border-amber-500/30 text-amber-500 bg-amber-500/10'
                  : 'border-card-border text-foreground/30 hover:text-foreground/50'
              }`}
            >
              <EyeOff className="w-3 h-3" /> Borrador
            </button>
            <button
              type="button"
              onClick={() => setOvaForm({ ...ovaForm, estado: 'publicado' })}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest italic border transition-all cursor-pointer ${
                ovaForm.estado === 'publicado'
                  ? 'border-[#10346E]/30 text-[#10346E] dark:text-blue-400 bg-[#10346E]/10'
                  : 'border-card-border text-foreground/30 hover:text-foreground/50'
              }`}
            >
              <Eye className="w-3 h-3" /> Público
            </button>
          </div>

          {/* Índice de Secciones */}
          <GlassCard className="p-4 border-card-border bg-card/30">
            <h4 className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] italic mb-4">
              Índice de Secciones
            </h4>
            <div className="space-y-1">
              {sidebarSections.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollToSection(item.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-foreground/60 hover:text-foreground hover:bg-white/5 transition-all text-left italic cursor-pointer"
                  >
                    <Icon className="w-3.5 h-3.5 text-foreground/30" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </GlassCard>

          {/* Botón de Guardar */}
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
      {/* ÁREA PRINCIPAL DEL EDITOR                */}
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
              <div className="bg-[#10346E]/10 border border-[#10346E]/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#10346E]/20 flex items-center justify-center text-[#10346E] dark:text-blue-400">
                    <AlertCircle className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground italic">¡Borrador Detectado!</h4>
                    <p className="text-xs text-foreground/50 italic">
                      Se encontró una versión guardada de este OVA ({new Date(draftData?.lastSaved).toLocaleTimeString()}).
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDiscardDraft}
                    className="text-[10px] font-bold italic border-red-500/20 text-red-500 hover:bg-red-500/10"
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

        {/* Encabezado móvil */}
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
                  ? 'bg-[#10346E]/10 text-[#10346E] dark:text-blue-400'
                  : 'bg-amber-500/10 text-amber-500'
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
            <h4 className="flex items-center gap-2 text-[#10346E] dark:text-blue-400 text-xs font-black uppercase tracking-[0.2em] italic">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10346E] dark:bg-blue-400" /> Datos Generales
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tipo de OVA */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs text-foreground/40 font-bold uppercase italic ml-1">Tipo de OVA *</label>
                <select
                  value={ovaForm.tipo || 'manual'}
                  onChange={(e) => setOvaForm({ ...ovaForm, tipo: e.target.value })}
                  className="w-full bg-card border border-card-border rounded-xl py-4 px-5 text-sm text-foreground focus:border-[#10346E] outline-none transition-all italic font-bold tracking-tight appearance-none cursor-pointer"
                >
                  <option value="manual">OVA Manual (Constructor Interactivo)</option>
                  <option value="html">OVA HTML (Subir paquete .html)</option>
                </select>
              </div>

              {/* Título */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs text-foreground/40 font-bold uppercase italic ml-1">Título del OVA *</label>
                <input
                  type="text"
                  placeholder="Ingrese un título descriptivo..."
                  value={ovaForm.titulo}
                  onChange={(e) => setOvaForm({ ...ovaForm, titulo: e.target.value })}
                  className="w-full bg-card border border-card-border rounded-xl py-4 px-5 text-xl text-foreground focus:border-[#10346E] outline-none transition-all italic font-bold tracking-tight"
                />
              </div>

              {/* Objetivo */}
              {ovaForm.tipo !== 'html' && (
                <div className="space-y-2">
                  <label className="text-xs text-foreground/40 font-bold uppercase italic ml-1">Objetivo Pedagógico *</label>
                  <textarea
                    placeholder="¿Qué aprenderá el estudiante?"
                    value={ovaForm.objetivo}
                    onChange={(e) => setOvaForm({ ...ovaForm, objetivo: e.target.value })}
                    className="w-full bg-card border border-card-border rounded-xl py-4 px-5 text-sm text-foreground focus:border-[#10346E] outline-none transition-all italic h-32 resize-none"
                  />
                </div>
              )}

              {/* Imagen de portada */}
              <div className="space-y-2">
                <label className="text-xs text-foreground/40 font-bold uppercase italic ml-1">Imagen de Portada</label>
                {uploadingFiles?.['portada'] ? (
                  <div className="flex flex-col items-center justify-center gap-2 w-full h-32 rounded-2xl border-2 border-[#10346E]/30 dark:border-blue-500/30 bg-[#10346E]/5 dark:bg-blue-950/20">
                    <Loader2 className="w-7 h-7 text-[#10346E] dark:text-blue-400 animate-spin" />
                    <span className="text-[11px] text-[#10346E] dark:text-blue-300 font-bold uppercase tracking-wider">
                      Subiendo imagen de portada...
                    </span>
                  </div>
                ) : ovaForm.imagen_portada ? (
                  <div className="relative group rounded-2xl overflow-hidden border border-card-border aspect-video">
                    <img src={ovaForm.imagen_portada} className="w-full h-full object-cover" alt="Portada" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setOvaForm({ ...ovaForm, imagen_portada: '' })}
                        className="p-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors cursor-pointer"
                        title="Eliminar imagen"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-3 w-full h-32 rounded-2xl border-2 border-dashed border-card-border hover:border-[#10346E]/40 bg-card/20 cursor-pointer transition-all group">
                    <ImageIcon className="w-6 h-6 text-foreground/30 group-hover:text-[#10346E] transition-colors" />
                    <span className="text-[10px] text-foreground/40 font-bold uppercase tracking-widest italic group-hover:text-[#10346E]">
                      Subir Imagen .JPG / .PNG
                    </span>
                    <input type="file" accept="image/*" onChange={(e) => onFileUpload(e, 'portada')} className="hidden" />
                  </label>
                )}
              </div>

              {/* Descripción */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs text-foreground/40 font-bold uppercase italic ml-1">Descripción Breve</label>
                <input
                  type="text"
                  placeholder="Resumen del contenido del OVA..."
                  value={ovaForm.descripcion}
                  onChange={(e) => setOvaForm({ ...ovaForm, descripcion: e.target.value })}
                  className="w-full bg-card border border-card-border rounded-xl py-4 px-5 text-sm text-foreground focus:border-[#10346E] outline-none transition-all italic"
                />
              </div>

              {/* Archivo HTML */}
              {ovaForm.tipo === 'html' && (
                <div className="space-y-2 md:col-span-2 mt-4">
                  <label className="text-xs text-foreground/40 font-bold uppercase italic ml-1">Archivo HTML *</label>
                  {uploadingFiles?.['html'] ? (
                    <div className="flex flex-col items-center justify-center gap-3 w-full h-36 rounded-3xl border-2 border-[#10346E]/30 bg-[#10346E]/5 dark:bg-blue-950/20">
                      <Loader2 className="w-8 h-8 text-[#10346E] dark:text-blue-400 animate-spin" />
                      <div className="text-center">
                        <span className="block text-sm text-[#10346E] dark:text-blue-300 font-bold uppercase tracking-wider">
                          Subiendo paquete HTML...
                        </span>
                        <span className="block text-[10px] text-slate-400 font-medium">Almacenando en servidor seguro</span>
                      </div>
                    </div>
                  ) : ovaForm.archivo_html_url ? (
                    <div className="flex items-center justify-between text-xs text-foreground bg-[#10346E]/10 dark:bg-blue-950/40 p-5 rounded-2xl border border-[#10346E]/20 shadow-inner">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-[#10346E]/20 rounded-xl">
                          <FileText className="w-6 h-6 text-[#10346E] dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground mb-1 uppercase tracking-wider text-sm">Archivo .html Cargado</p>
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest">Listo para visualización</p>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setOvaForm({ ...ovaForm, archivo_html_url: '' })} 
                        className="text-red-400 hover:text-red-300 transition-colors p-3 bg-red-500/10 hover:bg-red-500/20 rounded-xl cursor-pointer"
                        title="Eliminar archivo"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-3 w-full h-36 rounded-3xl border-2 border-dashed border-[#10346E]/40 hover:border-[#10346E] bg-[#10346E]/5 hover:bg-[#10346E]/10 cursor-pointer transition-all duration-300 group">
                      <FileDown className="w-10 h-10 text-[#10346E]/60 group-hover:text-[#10346E] group-hover:-translate-y-1 transition-all" />
                      <div className="text-center">
                        <span className="block text-sm text-[#10346E] font-black uppercase tracking-widest italic mb-1">
                          Sube tu archivo HTML
                        </span>
                        <span className="block text-[10px] text-foreground/40 font-bold uppercase tracking-widest italic">Solo extensión .html aceptada</span>
                      </div>
                      <input type="file" accept=".html" onChange={(e) => onFileUpload(e, 'html')} className="hidden" />
                    </label>
                  )}
                </div>
              )}
            </div>
          </GlassCard>
        </section>

        {/* ─── INTRODUCCIÓN ─── */}
        {ovaForm.tipo !== 'html' && (
          <section id="introduccion" className="scroll-mt-6">
            <GlassCard className="p-8 border-card-border space-y-4">
              <h4 className="flex items-center gap-2 text-[#10346E] dark:text-blue-400 text-xs font-black uppercase tracking-[0.2em] italic">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10346E] dark:bg-blue-400" /> Introducción
              </h4>
              <RichTextEditor
                content={ovaForm.introduccion || ''}
                onChange={(html) => setOvaForm({ ...ovaForm, introduccion: html })}
                placeholder="Escribe el marco introductorio del OVA..."
                minHeight="120px"
              />
            </GlassCard>
          </section>
        )}

        {/* ─── CONTENIDO DINÁMICO ─── */}
        {ovaForm.tipo !== 'html' && (
          <section className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h4 className="flex items-center gap-2 text-[#10346E] dark:text-blue-400 text-xs font-black uppercase tracking-[0.2em] italic">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10346E] dark:bg-blue-400" /> Estructura de Contenido
              </h4>
              <button
                type="button"
                onClick={handleAddSection}
                className="flex items-center gap-2 text-[10px] font-bold text-[#10346E] dark:text-blue-400 hover:text-blue-600 transition-colors uppercase tracking-widest italic cursor-pointer"
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
                items={(ovaForm.contenido || []).map(s => s._id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-6">
                  <AnimatePresence>
                    {(ovaForm.contenido || []).map((section, idx) => (
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

            {/* Botón inferior para añadir una sección */}
            <button
              type="button"
              onClick={handleAddSection}
              className="w-full py-6 rounded-3xl border-2 border-dashed border-card-border hover:border-[#10346E]/30 text-foreground/20 hover:text-[#10346E] transition-all flex items-center justify-center gap-3 group cursor-pointer"
            >
              <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold uppercase tracking-widest italic">Añadir nueva sección</span>
            </button>
          </section>
        )}

        {/* ─── RECURSOS Y EVALUACIÓN ─── */}
        {ovaForm.tipo !== 'html' && (
          <>
            <div id="recursos" className="scroll-mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Material Complementario */}
              <GlassCard className="p-8 border-card-border space-y-6">
                <h4 className="flex items-center gap-2 text-[#10346E] dark:text-blue-400 text-xs font-black uppercase tracking-[0.2em] italic">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10346E] dark:bg-blue-400" /> Material Complementario
                </h4>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-card/20 border border-card-border space-y-3">
                    <label className="flex items-center gap-2 text-[10px] text-foreground/40 font-bold italic uppercase tracking-widest">
                      <FileDown className="w-3 h-3" /> Guía PDF
                    </label>
                    {uploadingFiles?.['pdf'] ? (
                      <div className="flex items-center justify-center gap-2 text-xs text-[#10346E] dark:text-blue-400 bg-[#10346E]/5 p-3 rounded-xl">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="font-bold text-[10px] uppercase tracking-wider">Subiendo PDF...</span>
                      </div>
                    ) : ovaForm.recursos?.pdf_url ? (
                      <div className="flex items-center justify-between text-xs text-foreground bg-[#10346E]/10 p-3 rounded-xl italic">
                        <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-[#10346E]" /> Archivo cargado</span>
                        <button type="button" onClick={() => setOvaForm({ ...ovaForm, recursos: { ...ovaForm.recursos, pdf_url: '' } })} className="text-red-400 hover:text-red-300 transition-colors cursor-pointer">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-card-border text-foreground/40 hover:text-foreground/60 hover:border-[#10346E]/20 cursor-pointer transition-all text-[10px] font-bold uppercase tracking-widest italic">
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
                      value={ovaForm.recursos?.youtube_url || ''}
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
                      value={ovaForm.recursos?.link_externo || ''}
                      onChange={(e) => setOvaForm({ ...ovaForm, recursos: { ...ovaForm.recursos, link_externo: e.target.value } })}
                      className="w-full bg-transparent border-b border-card-border py-2 text-xs text-foreground focus:border-blue-500 outline-none italic transition-all"
                    />
                  </div>
                </div>
              </GlassCard>
            </div>
          </>
        )}

        {/* ─── EVALUACIÓN FINAL (ancho completo) ─── */}
        <section id="evaluacion" className="scroll-mt-6">
          <GlassCard className="p-8 border-card-border space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="flex items-center gap-2 text-[#10346E] dark:text-blue-400 text-xs font-black uppercase tracking-[0.2em] italic">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10346E] dark:bg-blue-400" /> Evaluación Final — Quiz Interactivo
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

        {/* ─── BARRA INFERIOR DE GUARDADO (MÓVIL) ─── */}
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
