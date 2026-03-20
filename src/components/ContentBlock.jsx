import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import RichTextEditor from './RichTextEditor';
import {
  GripVertical,
  Trash2,
  Type,
  Video,
  Image as ImageIcon,
  AlertTriangle,
  Code,
  Link as LinkIcon,
  ChevronDown,
  ExternalLink,
  X,
  Plus,
  FileText
} from 'lucide-react';

const BLOCK_TYPES = [
  { id: 'texto', label: 'Texto Enriquecido', icon: Type, color: 'emerald' },
  { id: 'video', label: 'Video (YouTube)', icon: Video, color: 'red' },
  { id: 'imagen', label: 'Imagen', icon: ImageIcon, color: 'blue' },
  { id: 'nota', label: 'Nota Destacada', icon: AlertTriangle, color: 'amber' },
  { id: 'codigo', label: 'Bloque de Código', icon: Code, color: 'purple' },
  { id: 'recurso', label: 'Recurso Externo', icon: LinkIcon, color: 'cyan' },
];

export default function ContentBlock({
  id,
  index,
  section,
  onUpdate,
  onRemove,
  onFileUpload,
}) {
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const blockType = section.tipo || 'texto';

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const typeConfig = BLOCK_TYPES.find(t => t.id === blockType) || BLOCK_TYPES[0];
  const TypeIcon = typeConfig.icon;

  const colorClasses = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  };

  const handleTypeChange = (newType) => {
    onUpdate({ ...section, tipo: newType });
    setShowTypeMenu(false);
  };

  const renderBlockContent = () => {
    switch (blockType) {
      case 'texto':
        return (
          <RichTextEditor
            content={section.contenido || ''}
            onChange={(html) => onUpdate({ ...section, contenido: html })}
            placeholder="Escribe el contenido de esta sección..."
            minHeight="200px"
          />
        );

      case 'video':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="https://youtube.com/watch?v=... o https://youtu.be/..."
                value={section.video_url || ''}
                onChange={(e) => onUpdate({ ...section, video_url: e.target.value })}
                className="flex-1 bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:border-red-500/50 outline-none transition-all italic"
              />
            </div>
            {section.video_url && (
              <div className="aspect-video rounded-2xl overflow-hidden border border-card-border bg-black/40">
                <iframe
                  src={formatYoutubeEmbed(section.video_url)}
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                  title="Video preview"
                />
              </div>
            )}
            <RichTextEditor
              content={section.contenido || ''}
              onChange={(html) => onUpdate({ ...section, contenido: html })}
              placeholder="Descripción o notas sobre el video (opcional)..."
              minHeight="80px"
            />
          </div>
        );

      case 'imagen':
        return (
          <div className="space-y-4">
            {section.imagen_url ? (
              <div className="relative group rounded-2xl overflow-hidden border border-card-border">
                <img
                  src={section.imagen_url}
                  alt="Contenido"
                  className="w-full max-h-96 object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => onUpdate({ ...section, imagen_url: '' })}
                    className="p-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-4 w-full h-48 rounded-2xl border-2 border-dashed border-card-border hover:border-blue-500/40 bg-card/20 cursor-pointer transition-all group">
                <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <span className="text-xs text-foreground/60 font-bold italic">Arrastra o haz clic para subir</span>
                  <p className="text-[10px] text-foreground/30 mt-1 uppercase tracking-widest">JPG, PNG, WEBP</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onFileUpload(e, 'seccion_imagen', index)}
                  className="hidden"
                />
              </label>
            )}
            <RichTextEditor
              content={section.contenido || ''}
              onChange={(html) => onUpdate({ ...section, contenido: html })}
              placeholder="Pie de imagen o descripción (opcional)..."
              minHeight="60px"
            />
          </div>
        );

      case 'nota':
        return (
          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/15">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-amber-500/20">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <span className="text-xs font-black text-amber-400 uppercase tracking-widest italic">Nota Importante</span>
              </div>
              <RichTextEditor
                content={section.contenido || ''}
                onChange={(html) => onUpdate({ ...section, contenido: html })}
                placeholder="Escribe un dato importante, advertencia o tip para el estudiante..."
                minHeight="100px"
              />
            </div>
          </div>
        );

      case 'codigo':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Lenguaje (ej: JavaScript, Python, SQL...)"
                value={section.lenguaje || ''}
                onChange={(e) => onUpdate({ ...section, lenguaje: e.target.value })}
                className="bg-card border border-card-border rounded-xl py-2 px-4 text-xs text-foreground/70 focus:border-purple-500/50 outline-none transition-all italic w-64"
              />
            </div>
            <div className="rounded-2xl bg-[#0d1117] border border-[#30363d] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 bg-[#161b22] border-b border-[#30363d]">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#f85149]/60" />
                  <span className="w-3 h-3 rounded-full bg-[#d29922]/60" />
                  <span className="w-3 h-3 rounded-full bg-[#3fb950]/60" />
                </div>
                <span className="text-[10px] text-[#8b949e] font-mono ml-2">{section.lenguaje || 'code'}</span>
              </div>
              <textarea
                value={section.codigo || ''}
                onChange={(e) => onUpdate({ ...section, codigo: e.target.value })}
                placeholder="// Pega tu código aquí..."
                className="w-full bg-transparent text-[#c9d1d9] font-mono text-sm px-4 py-4 min-h-[200px] resize-y outline-none"
                spellCheck={false}
              />
            </div>
            <RichTextEditor
              content={section.contenido || ''}
              onChange={(html) => onUpdate({ ...section, contenido: html })}
              placeholder="Explicación del código (opcional)..."
              minHeight="60px"
            />
          </div>
        );

      case 'recurso':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nombre del recurso..."
                value={section.recurso_titulo || ''}
                onChange={(e) => onUpdate({ ...section, recurso_titulo: e.target.value })}
                className="bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:border-cyan-500/50 outline-none transition-all italic"
              />
              <input
                type="text"
                placeholder="https://..."
                value={section.recurso_url || ''}
                onChange={(e) => onUpdate({ ...section, recurso_url: e.target.value })}
                className="bg-card border border-card-border rounded-xl py-3 px-4 text-sm text-foreground focus:border-cyan-500/50 outline-none transition-all italic"
              />
            </div>
            {section.recurso_url && (
              <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/15 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-cyan-500/20">
                    <ExternalLink className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm text-foreground font-bold italic">{section.recurso_titulo || 'Recurso externo'}</p>
                    <p className="text-[10px] text-foreground/40 truncate max-w-xs">{section.recurso_url}</p>
                  </div>
                </div>
                <a
                  href={section.recurso_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest italic hover:text-cyan-300"
                >
                  ABRIR →
                </a>
              </div>
            )}
            <RichTextEditor
              content={section.contenido || ''}
              onChange={(html) => onUpdate({ ...section, contenido: html })}
              placeholder="Notas sobre este recurso (opcional)..."
              minHeight="60px"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative rounded-3xl border transition-all duration-300 ${
        isDragging
          ? 'border-emerald-500/40 shadow-[0_0_40px_rgba(16,185,129,0.1)] bg-card/80 scale-[1.01]'
          : 'border-card-border bg-card/20 hover:border-card-border/80'
      }`}
    >
      {/* Block Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-card-border/50">
        {/* Drag Handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="p-1.5 rounded-lg text-foreground/20 hover:text-foreground/50 hover:bg-white/5 cursor-grab active:cursor-grabbing transition-colors"
          title="Arrastrar para reordenar"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Section Number */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black italic ${colorClasses[typeConfig.color]}`}>
          {String(index + 1).padStart(2, '0')}
        </div>

        {/* Title Input */}
        <input
          type="text"
          placeholder="Título de la sección..."
          value={section.titulo || ''}
          onChange={(e) => onUpdate({ ...section, titulo: e.target.value })}
          className="flex-1 bg-transparent text-lg font-bold text-foreground focus:outline-none italic placeholder:text-foreground/20 tracking-tight"
        />

        {/* Type Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTypeMenu(!showTypeMenu)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest italic border transition-all ${colorClasses[typeConfig.color]}`}
          >
            <TypeIcon className="w-3 h-3" />
            {typeConfig.label}
            <ChevronDown className={`w-3 h-3 transition-transform ${showTypeMenu ? 'rotate-180' : ''}`} />
          </button>

          {showTypeMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowTypeMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 bg-[#1a1f2e] border border-card-border rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {BLOCK_TYPES.map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleTypeChange(type.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      blockType === type.id
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'text-foreground/60 hover:bg-white/5 hover:text-foreground'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${colorClasses[type.color]}`}>
                      <type.icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold italic">{type.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Delete */}
        <button
          type="button"
          onClick={onRemove}
          className="p-2 rounded-xl text-foreground/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
          title="Eliminar sección"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Block Content */}
      <div className="p-6">
        {renderBlockContent()}
      </div>

      {/* Attached File Indicator */}
      {section.recurso_url && blockType === 'texto' && (
        <div className="mx-6 mb-6 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-emerald-400">
          <FileText className="w-4 h-4" />
          <span className="text-xs font-bold italic">Archivo adjunto</span>
          <button
            type="button"
            onClick={() => onUpdate({ ...section, recurso_url: '' })}
            className="ml-auto hover:text-red-400 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function formatYoutubeEmbed(url) {
  if (!url) return '';
  let embedUrl = url;
  if (embedUrl.includes('youtube.com/watch?v=')) {
    embedUrl = embedUrl.replace('watch?v=', 'embed/');
  } else if (embedUrl.includes('youtu.be/')) {
    embedUrl = embedUrl.replace('youtu.be/', 'youtube.com/embed/');
  }
  return embedUrl;
}
