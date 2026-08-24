import React from 'react';
import { useOvaManager } from '../hooks/useOvaManager';
import OvaEditor from '../pages/OvaEditor';
import { 
  Plus, 
  Eye, 
  EyeOff, 
  Edit, 
  Trash2, 
  BookOpen, 
  Layers,
  FileCode,
  Calendar,
  Sparkles
} from 'lucide-react';

export default function OvaManagerView({ modulo }) {
  const {
    ovas,
    loadingOvas,
    ovaForm,
    setOvaForm,
    editingOva,
    isOvaFormOpen,
    setIsOvaFormOpen,
    hasDraft,
    draftData,
    uploadingFiles,
    handleRecoverDraft,
    handleDiscardDraft,
    handleCreateOva,
    handleEditOva,
    handleSaveOva,
    handleDeleteOva,
    handleToggleOvaStatus,
    handleOvaFileUpload
  } = useOvaManager(modulo?.id);

  if (!modulo) {
    return (
      <div className="p-12 sm:p-16 flex flex-col items-center justify-center text-center space-y-4 bg-card border border-card-border rounded-3xl shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center text-[#15326C] dark:text-blue-400">
          <BookOpen className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-foreground">Gestión de Aula Virtual</h3>
          <p className="text-foreground/60 text-xs max-w-sm leading-relaxed">
            Selecciona una línea de aprendizaje para administrar sus Objetos Virtuales de Aprendizaje (OVAs).
          </p>
        </div>
      </div>
    );
  }

  if (isOvaFormOpen && ovaForm) {
    return (
      <OvaEditor
        ovaForm={ovaForm}
        setOvaForm={setOvaForm}
        editingOva={editingOva}
        onSave={handleSaveOva}
        onCancel={() => setIsOvaFormOpen(false)}
        onFileUpload={handleOvaFileUpload}
        uploadingFiles={uploadingFiles}
        hasDraft={hasDraft}
        draftData={draftData}
        onRecoverDraft={handleRecoverDraft}
        onDiscardDraft={handleDiscardDraft}
      />
    );
  }

  const publishedCount = ovas.filter(o => o.estado === 'publicado').length;
  const draftCount = ovas.length - publishedCount;

  return (
    <div className="space-y-6">
      {/* Cabecera del Módulo / Línea */}
      <div className="p-6 rounded-2xl bg-card border border-card-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h3 className="text-xl font-bold text-foreground tracking-tight">
              {modulo.nombre}
            </h3>
            <span className="px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 border border-blue-200/50 dark:border-blue-900/50 text-[11px] font-semibold text-[#15326C] dark:text-blue-400">
              {ovas.length} {ovas.length === 1 ? 'OVA' : 'OVAs'}
            </span>
          </div>
          <p className="text-xs text-foreground/60 flex items-center gap-3">
            <span>Objetos Virtuales de Aprendizaje interactivos</span>
            <span className="inline-block w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">{publishedCount} publicados</span>
            {draftCount > 0 && (
              <>
                <span className="inline-block w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                <span className="text-slate-500 font-medium">{draftCount} borradores</span>
              </>
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreateOva}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#15326C] hover:bg-[#1E40AF] text-white font-semibold text-xs transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Nuevo OVA</span>
        </button>
      </div>

      {/* Cuadrícula de OVAs */}
      {loadingOvas ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-52 rounded-2xl bg-slate-100 dark:bg-slate-800/50 animate-pulse border border-card-border" />
          ))}
        </div>
      ) : ovas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ovas.map((ova) => {
            const isHtml = ova.tipo === 'html';
            const isPublished = ova.estado === 'publicado';

            return (
              <div
                key={ova.id}
                className="bg-card border border-card-border hover:border-[#15326C]/50 dark:hover:border-blue-500/40 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  {/* Fila superior: Badges y Acciones */}
                  <div className="flex items-center justify-between gap-2 mb-3.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          isPublished
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/50'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {isPublished ? 'Publicado' : 'Borrador'}
                      </span>

                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-50 dark:bg-slate-900 text-slate-500 border border-card-border">
                        {isHtml ? <FileCode className="w-3 h-3 text-blue-500" /> : <Layers className="w-3 h-3 text-indigo-500" />}
                        <span>{isHtml ? 'HTML5' : 'Manual'}</span>
                      </span>
                    </div>

                    {/* Botones de acción discretos */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleToggleOvaStatus(ova)}
                        title={isPublished ? 'Cambiar a Borrador' : 'Publicar OVA'}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-[#15326C] dark:hover:text-blue-400 transition-colors cursor-pointer"
                      >
                        {isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditOva(ova)}
                        title="Editar Contenido del OVA"
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-[#15326C] dark:hover:text-blue-400 transition-colors cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteOva(ova.id)}
                        title="Eliminar OVA"
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Título */}
                  <h4 className="text-sm font-bold text-foreground mb-1.5 line-clamp-2 leading-snug group-hover:text-[#15326C] dark:group-hover:text-blue-400 transition-colors">
                    {ova.titulo}
                  </h4>

                  {/* Descripción */}
                  {ova.descripcion && (
                    <p className="text-xs text-foreground/60 line-clamp-2 leading-relaxed mb-4">
                      {ova.descripcion}
                    </p>
                  )}
                </div>

                {/* Footer de Metadata */}
                <div className="pt-3.5 mt-2 border-t border-card-border flex items-center justify-between text-[11px] text-foreground/50">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(ova.updated_at || Date.now()).toLocaleDateString()}</span>
                  </span>
                  <span className="font-medium">
                    {isHtml ? 'Paquete Web' : `${ova.contenido?.length || 0} secciones`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 sm:p-16 flex flex-col items-center justify-center text-center space-y-4 bg-card border border-card-border rounded-3xl shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">Sin OVAs registrados</h3>
            <p className="text-foreground/50 text-xs max-w-sm leading-relaxed">
              Esta línea de investigación aún no cuenta con Objetos Virtuales de Aprendizaje creados.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreateOva}
            className="px-4 py-2 rounded-xl bg-[#15326C] hover:bg-[#1E40AF] text-white font-semibold text-xs transition-all shadow-sm cursor-pointer mt-1"
          >
            Crear el primer OVA
          </button>
        </div>
      )}
    </div>
  );
}
