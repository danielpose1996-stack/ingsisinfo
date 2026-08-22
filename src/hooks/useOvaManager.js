import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import { 
  obtenerOvasModulo, 
  crearOva, 
  actualizarOva, 
  eliminarOva, 
  subirArchivoOva 
} from '../lib/supabase';
import { sanitizeText } from '../lib/security';

const DEFAULT_OVA_FORM = {
  titulo: '',
  descripcion: '',
  imagen_portada: '',
  objetivo: '',
  introduccion: '',
  contenido: [{ _id: `section-${Date.now()}-0`, titulo: '', contenido: '', recurso_url: '', tipo: 'texto' }],
  recursos: { pdf_url: '', youtube_url: '', link_externo: '' },
  actividad_final: '',
  evaluacion: { instrucciones: '', preguntas: [], nota_minima: 60, tiempo_limite: 0 },
  estado: 'borrador',
  tipo: 'manual',
  archivo_html_url: ''
};

export function useOvaManager(moduloId) {
  const [ovas, setOvas] = useState([]);
  const [loadingOvas, setLoadingOvas] = useState(false);
  const [ovaForm, setOvaForm] = useState(null);
  const [editingOva, setEditingOva] = useState(null);
  const [isOvaFormOpen, setIsOvaFormOpen] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [draftData, setDraftData] = useState(null);
  const [uploadingFiles, setUploadingFiles] = useState({});

  // Cargar OVAs del módulo
  const loadOvas = useCallback(async (targetModuloId) => {
    const id = targetModuloId || moduloId;
    if (!id) return;
    
    setLoadingOvas(true);
    try {
      const data = await obtenerOvasModulo(id);
      setOvas(data || []);
    } catch (error) {
      console.error('Error al cargar OVAs:', error);
      toast.error('Error al cargar los OVAs del módulo.');
    } finally {
      setLoadingOvas(false);
    }
  }, [moduloId]);

  // Cargar automáticamente al cambiar el moduloId
  useEffect(() => {
    if (moduloId) {
      loadOvas(moduloId);
    } else {
      setOvas([]);
    }
  }, [moduloId, loadOvas]);

  // Detección de borradores en localStorage al abrir el modal/formulario
  useEffect(() => {
    if (isOvaFormOpen) {
      const draftKey = editingOva ? `ova_draft_${editingOva.id}` : 'ova_draft_new';
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (
            !ovaForm ||
            parsed.titulo !== ovaForm.titulo ||
            parsed.descripcion !== ovaForm.descripcion ||
            parsed.contenido?.length !== ovaForm.contenido?.length
          ) {
            setDraftData(parsed);
            setHasDraft(true);
          }
        } catch {
          localStorage.removeItem(draftKey);
        }
      }
    } else {
      setHasDraft(false);
      setDraftData(null);
    }
  }, [isOvaFormOpen, editingOva]);

  // Autoguardado reactivo en localStorage
  useEffect(() => {
    if (isOvaFormOpen && ovaForm && (ovaForm.titulo || ovaForm.descripcion || ovaForm.contenido?.length > 1)) {
      const draftKey = editingOva ? `ova_draft_${editingOva.id}` : 'ova_draft_new';
      localStorage.setItem(draftKey, JSON.stringify({
        ...ovaForm,
        lastSaved: new Date().toISOString()
      }));
    }
  }, [ovaForm, isOvaFormOpen, editingOva]);

  const handleRecoverDraft = useCallback(() => {
    if (draftData) {
      setOvaForm(draftData);
      setHasDraft(false);
      setDraftData(null);
      toast.success('Borrador recuperado con éxito.');
    }
  }, [draftData]);

  const handleDiscardDraft = useCallback(async () => {
    const res = await Swal.fire({
      title: '¿Descartar borrador?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, descartar',
      cancelButtonText: 'Cancelar',
      background: '#ffffff',
      color: '#1e293b'
    });
    if (res.isConfirmed) {
      const draftKey = editingOva ? `ova_draft_${editingOva.id}` : 'ova_draft_new';
      localStorage.removeItem(draftKey);
      setHasDraft(false);
      setDraftData(null);
      toast.success('Borrador descartado.');
    }
  }, [editingOva]);

  const handleCreateOva = useCallback(() => {
    setEditingOva(null);
    setOvaForm({
      ...DEFAULT_OVA_FORM,
      contenido: [{ _id: `section-${Date.now()}-0`, titulo: '', contenido: '', recurso_url: '', tipo: 'texto' }]
    });
    setIsOvaFormOpen(true);
  }, []);

  const handleEditOva = useCallback((ova) => {
    setEditingOva(ova);
    let evaluacion = { instrucciones: '', preguntas: [], nota_minima: 60, tiempo_limite: 0 };
    if (ova.actividad_final) {
      try {
        const parsed = JSON.parse(ova.actividad_final);
        if (parsed && parsed.preguntas) evaluacion = parsed;
      } catch {
        evaluacion.instrucciones = ova.actividad_final;
      }
    }
    setOvaForm({
      ...ova,
      tipo: ova.tipo || 'manual',
      archivo_html_url: ova.archivo_html_url || '',
      contenido: (ova.contenido || []).map((s, i) => ({
        ...s,
        _id: s._id || `section-${Date.now()}-${i}`,
        tipo: s.tipo || 'texto'
      })),
      recursos: ova.recursos || { pdf_url: '', youtube_url: '', link_externo: '' },
      evaluacion
    });
    setIsOvaFormOpen(true);
  }, []);

  const handleSaveOva = useCallback(async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!ovaForm.titulo || !ovaForm.titulo.trim()) {
      toast.error('El título es obligatorio.');
      return;
    }
    if (ovaForm.tipo === 'html') {
      if (!ovaForm.archivo_html_url || ovaForm.archivo_html_url.includes('documentos-proyectos')) {
        toast.error('Debe subir un archivo HTML (.html) válido para este OVA.');
        return;
      }
    }
    if (ovaForm.tipo !== 'html' && (!ovaForm.objetivo || ovaForm.contenido?.length === 0)) {
      toast.error('Por favor completa los campos obligatorios (Título, Objetivo y al menos una sección).');
      return;
    }

    try {
      const cleanedContenido = (ovaForm.contenido || []).map(({ _id, ...c }) => ({
        ...c,
        titulo: sanitizeText(c.titulo || '')
      }));

      const evaluacionData = ovaForm.evaluacion || { instrucciones: '', preguntas: [], nota_minima: 60, tiempo_limite: 0 };
      const cleanedEvaluacion = {
        ...evaluacionData,
        preguntas: (evaluacionData.preguntas || []).map(({ _id, ...q }) => ({
          ...q,
          _id: _id || `q-${Date.now()}`
        }))
      };

      const dataToSave = {
        titulo: sanitizeText(ovaForm.titulo),
        descripcion: sanitizeText(ovaForm.descripcion || ''),
        imagen_portada: ovaForm.imagen_portada || '',
        objetivo: sanitizeText(ovaForm.objetivo || ''),
        introduccion: ovaForm.introduccion || '',
        actividad_final: JSON.stringify(cleanedEvaluacion),
        contenido: cleanedContenido,
        recursos: ovaForm.recursos || {},
        estado: ovaForm.estado || 'borrador',
        modulo_id: moduloId,
        tipo: ovaForm.tipo || 'manual',
        archivo_html_url: ovaForm.archivo_html_url || ''
      };

      if (editingOva) {
        await actualizarOva(editingOva.id, dataToSave);
        localStorage.removeItem(`ova_draft_${editingOva.id}`);
      } else {
        await crearOva(dataToSave);
        localStorage.removeItem('ova_draft_new');
      }

      setIsOvaFormOpen(false);
      setHasDraft(false);
      setDraftData(null);
      await loadOvas(moduloId);
      toast.success(editingOva ? 'OVA actualizado con éxito.' : 'OVA creado con éxito.');
    } catch (error) {
      console.error('Error al guardar OVA:', error);
      toast.error('Error al guardar OVA: ' + error.message);
    }
  }, [ovaForm, editingOva, moduloId, loadOvas]);

  const handleDeleteOva = useCallback(async (id) => {
    const res = await Swal.fire({
      title: '¿Eliminar OVA?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#ffffff',
      color: '#1e293b'
    });
    if (!res.isConfirmed) return;

    try {
      await eliminarOva(id);
      await loadOvas(moduloId);
      toast.success('OVA eliminado con éxito.');
    } catch (error) {
      console.error('Error al eliminar OVA:', error);
      toast.error('Error al eliminar OVA: ' + error.message);
    }
  }, [moduloId, loadOvas]);

  const handleToggleOvaStatus = useCallback(async (ova) => {
    const nuevoEstado = ova.estado === 'publicado' ? 'borrador' : 'publicado';
    try {
      await actualizarOva(ova.id, { estado: nuevoEstado });
      await loadOvas(moduloId);
      toast.success(`OVA ${nuevoEstado === 'publicado' ? 'publicado' : 'cambiado a borrador'}.`);
    } catch (error) {
      console.error('Error al alternar estado del OVA:', error);
      toast.error('Error al cambiar el estado del OVA.');
    }
  }, [moduloId, loadOvas]);

  const handleOvaFileUpload = useCallback(async (e, type, sectionIndex = -1) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadKey = sectionIndex >= 0 ? `${type}_${sectionIndex}` : type;
    const fileTypeLabel = type === 'portada' ? 'imagen de portada' : (type === 'html' ? 'paquete HTML' : 'documento');
    const toastId = toast.loading(`Subiendo ${fileTypeLabel}...`);

    setUploadingFiles(prev => ({ ...prev, [uploadKey]: true }));

    try {
      const url = await subirArchivoOva(file, `ovas/${Date.now()}`);
      
      setOvaForm((prev) => {
        if (!prev) return prev;
        if (type === 'portada') {
          return { ...prev, imagen_portada: url };
        } else if (type === 'pdf') {
          return { ...prev, recursos: { ...prev.recursos, pdf_url: url } };
        } else if (type === 'html') {
          return { ...prev, archivo_html_url: url };
        } else if (type === 'seccion' && sectionIndex >= 0) {
          const newContenido = [...prev.contenido];
          newContenido[sectionIndex] = { ...newContenido[sectionIndex], recurso_url: url };
          return { ...prev, contenido: newContenido };
        } else if (type === 'seccion_imagen' && sectionIndex >= 0) {
          const newContenido = [...prev.contenido];
          newContenido[sectionIndex] = { ...newContenido[sectionIndex], imagen_url: url };
          return { ...prev, contenido: newContenido };
        }
        return prev;
      });
      toast.success(`¡${fileTypeLabel.charAt(0).toUpperCase() + fileTypeLabel.slice(1)} subido con éxito!`, { id: toastId });
    } catch (error) {
      console.error('Error al subir archivo:', error);
      toast.error('Error al subir archivo: ' + error.message, { id: toastId });
    } finally {
      setUploadingFiles(prev => ({ ...prev, [uploadKey]: false }));
      // Limpiar el input para permitir volver a seleccionar el mismo archivo si es necesario
      if (e.target) e.target.value = '';
    }
  }, []);

  return {
    ovas,
    loadingOvas,
    loadOvas,
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
  };
}
