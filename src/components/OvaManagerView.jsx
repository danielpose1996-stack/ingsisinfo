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
  GraduationCap 
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
      <div className="p-16 sm:p-20 flex flex-col items-center justify-center text-center space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center text-[#10346E] dark:text-blue-400">
          <BookOpen className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-foreground">Gestión de Aula Virtual</h3>
        <p className="text-foreground/50 text-sm max-w-sm leading-relaxed">
          Selecciona una línea de aprendizaje para administrar sus Objetos Virtuales de Aprendizaje (OVAs).
        </p>
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

  return (
    <div className="space-y-6">
      {/* Encabezado del Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-2xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight">
            {modulo.nombre}
          </h3>
          <p className="text-xs text-[#64748B] dark:text-slate-400 font-medium">
            Gestión de Objetos Virtuales de Aprendizaje
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreateOva}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#10346E] hover:bg-[#18458F] text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-sm hover:shadow active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Crear OVA</span>
        </button>
      </div>

      {/* Cuadrícula de OVAs o Estados */}
      {loadingOvas ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800/60 animate-pulse border border-slate-200/60 dark:border-slate-800" />
          ))}
        </div>
      ) : ovas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ovas.map((ova) => (
            <div
              key={ova.id}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                {/* Barra de Estado y Botones de Acción */}
                <div className="flex justify-between items-center mb-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      ova.estado === 'publicado'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/50'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/50'
                    }`}
                  >
                    {ova.estado || 'BORRADOR'}
                  </span>

                  <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleToggleOvaStatus(ova)}
                      title={ova.estado === 'publicado' ? 'Despublicar OVA' : 'Publicar OVA'}
                      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-[#10346E] dark:hover:text-blue-400 transition-colors cursor-pointer"
                    >
                      {ova.estado === 'publicado' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditOva(ova)}
                      title="Editar OVA"
                      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-[#10346E] dark:hover:text-blue-400 transition-colors cursor-pointer"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteOva(ova.id)}
                      title="Eliminar OVA"
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Título del OVA */}
                <h4 className="text-base font-bold text-[#0F172A] dark:text-white mb-2 line-clamp-2 leading-tight group-hover:text-[#10346E] dark:group-hover:text-blue-400 transition-colors">
                  {ova.titulo}
                </h4>

                {/* Descripción breve */}
                {ova.descripcion && (
                  <p className="text-xs text-[#64748B] dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                    {ova.descripcion}
                  </p>
                )}
              </div>

              {/* Metadatos Inferiores */}
              <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-[#64748B] dark:text-slate-400">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tipo:</span>
                  <span className="font-semibold capitalize">{ova.tipo === 'html' ? 'Paquete HTML' : 'Manual'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Última Modificación:</span>
                  <span>{new Date(ova.updated_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contenido:</span>
                  <span className="font-semibold">{ova.contenido?.length || 0} secciones</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-16 sm:p-20 flex flex-col items-center justify-center text-center space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Sin OVAs registrados</h3>
          <p className="text-foreground/50 text-xs max-w-sm leading-relaxed">
            No se han creado Objetos Virtuales de Aprendizaje para esta línea todavía.
          </p>
          <button
            type="button"
            onClick={handleCreateOva}
            className="px-5 py-2.5 rounded-xl bg-[#10346E] hover:bg-[#18458F] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer mt-2"
          >
            Crear el primer OVA
          </button>
        </div>
      )}
    </div>
  );
}
