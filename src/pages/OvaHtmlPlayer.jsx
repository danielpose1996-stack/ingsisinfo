import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { obtenerOvaPorId, registrarResultadoOva } from '../lib/supabase';
import { ArrowLeft, ExternalLink, Loader2, Award, X, AlertTriangle, BookOpen, Settings, Globe, Maximize2 } from 'lucide-react';
import Button from '../components/Button';
import GlassCard from '../components/GlassCard';
import QuizPlayer from '../components/QuizPlayer';
import { useAuth } from '../context/AuthContext';

export default function OvaHtmlPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isFullscreen = searchParams.get('fullscreen') === 'true';
  
  const [ova, setOva] = useState(null);
  const [htmlContent, setHtmlContent] = useState('');
  const [evaluacion, setEvaluacion] = useState(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, perfil } = useAuth();

  useEffect(() => {
    async function loadOva() {
      try {
        const data = await obtenerOvaPorId(id);
        if (!data) {
          throw new Error('El objeto virtual de aprendizaje (OVA) no fue encontrado.');
        }
        if (data.tipo !== 'html') {
          throw new Error('Este recurso no es un OVA de tipo HTML interactivo.');
        }
        
        let parsedEvaluacion = null;
        if (data.actividad_final) {
          try {
            const parsed = JSON.parse(data.actividad_final);
            if (parsed && parsed.preguntas && parsed.preguntas.length > 0) {
              parsedEvaluacion = parsed;
            }
          } catch {
            // Sin evaluación tipo quiz
          }
        }
        
        setOva(data);
        setEvaluacion(parsedEvaluacion);
        
        if (!data.archivo_html_url || data.archivo_html_url.includes('documentos-proyectos')) {
          throw new Error('El archivo .html de este OVA no está adjunto o se encuentra en un almacenamiento anterior.');
        }

        // Descargamos el contenido HTML mediante una solicitud directa.
        const res = await fetch(data.archivo_html_url);
        if (!res.ok) {
           throw new Error('No se pudo descargar el archivo HTML desde el repositorio en la nube.');
        }
        const htmlText = await res.text();
        
        // Extraer el directorio base del archivo HTML subido para resolver recursos relativos
        const fileUrl = data.archivo_html_url;
        const lastSlash = fileUrl.lastIndexOf('/');
        const baseUrl = lastSlash !== -1 ? fileUrl.substring(0, lastSlash + 1) : '';
        
        let processedHtml = htmlText;
        if (baseUrl) {
          const baseTag = `<base href="${baseUrl}">`;
          const storageMockScript = `
            <script>
              (function() {
                const makeStorage = () => {
                  const store = {};
                  return {
                    getItem: (key) => store[key] || null,
                    setItem: (key, value) => { store[key] = String(value); },
                    removeItem: (key) => { delete store[key]; },
                    clear: () => { for (const key in store) delete store[key]; },
                    key: (index) => Object.keys(store)[index] || null,
                    get length() { return Object.keys(store).length; }
                  };
                };
                try {
                  window.localStorage;
                } catch (e) {
                  Object.defineProperty(window, 'localStorage', { value: makeStorage() });
                }
                try {
                  window.sessionStorage;
                } catch (e) {
                  Object.defineProperty(window, 'sessionStorage', { value: makeStorage() });
                }
              })();
            </script>
          `;
          const injection = baseTag + storageMockScript;
          if (processedHtml.includes('<head>')) {
            processedHtml = processedHtml.replace('<head>', `<head>${injection}`);
          } else if (processedHtml.includes('<HEAD>')) {
            processedHtml = processedHtml.replace('<HEAD>', `<HEAD>${injection}`);
          } else {
            processedHtml = injection + processedHtml;
          }
        }
        setHtmlContent(processedHtml);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadOva();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] dark:bg-slate-950">
        <Loader2 className="w-10 h-10 text-[#10346E] dark:text-blue-400 animate-spin mb-4" />
        <p className="text-slate-500 dark:text-slate-400 font-semibold text-xs">Cargando visualizador e interpretando paquete HTML...</p>
      </div>
    );
  }

  if (error || !ova) {
    const isStaff = perfil?.rol === 'admin' || perfil?.rol === 'docente';
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] dark:bg-slate-950 p-6">
        <GlassCard className="max-w-md w-full p-8 text-center border-card-border space-y-6 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/50 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white mb-2">
              Contenido HTML No Disponible
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {error || 'El archivo .html asociado a este objeto de aprendizaje no se encuentra cargado en el servidor.'}
            </p>
            {ova?.titulo && (
              <p className="mt-3 text-xs font-bold text-[#10346E] dark:text-blue-400">
                OVA: {ova.titulo}
              </p>
            )}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button onClick={() => navigate('/modulos')} variant="outline" className="w-full sm:w-auto gap-2 text-xs font-bold rounded-xl cursor-pointer">
              <BookOpen className="w-4 h-4" /> Ver Líneas
            </Button>
            {isStaff && (
              <Button 
                onClick={() => navigate(perfil?.rol === 'admin' ? '/dashboard/admin' : '/dashboard/teacher')} 
                variant="primary" 
                className="w-full sm:w-auto gap-2 text-xs font-bold bg-[#10346E] hover:bg-[#18458F] text-white border-none rounded-xl cursor-pointer"
              >
                <Settings className="w-4 h-4" /> Gestionar OVA
              </Button>
            )}
          </div>
        </GlassCard>
      </div>
    );
  }

  const handleQuizComplete = async (score, percentage, passed) => {
    if (!user || !perfil) return;
    try {
      await registrarResultadoOva(perfil.id, ova.id, percentage, passed);
      console.log("Resultado OVA registrado con éxito");
    } catch (error) {
      console.error("Error al registrar resultado OVA:", error);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#F8FAFC] dark:bg-slate-950 overflow-hidden relative">
      {/* ─── Encabezado Institucional ─── */}
      {!isFullscreen && (
        <header className="h-16 shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-4 sm:px-6 z-10 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <button 
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              title="Volver a la línea"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Volver</span>
            </button>
            
            <div className="min-w-0 flex items-center gap-2.5">
              <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider shrink-0">
                <Globe className="w-3 h-3" />
                Paquete HTML5
              </span>
              <div className="min-w-0">
                <h1 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate max-w-md sm:max-w-xl">
                  {ova.titulo}
                </h1>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider">
                  Visualizador Interactivo
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {evaluacion && (
              <Button 
                variant="primary" 
                size="sm" 
                className="gap-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white border-none rounded-xl cursor-pointer shadow-xs"
                onClick={() => setShowQuizModal(true)}
              >
                <Award className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Evaluación Final</span>
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1.5 text-xs font-bold rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
              onClick={() => window.open(`/ova-html/${ova.id}?fullscreen=true`, '_blank')}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pantalla Completa</span>
            </Button>
          </div>
        </header>
      )}

      {/* ─── Modal de Cuestionario ─── */}
      {showQuizModal && evaluacion && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col pt-8 px-4 sm:px-12 overflow-y-auto animate-in fade-in">
          <div className="max-w-4xl w-full mx-auto pb-20">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 space-y-6 shadow-2xl">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/50">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                      Evaluación Final del OVA
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Demuestra tus competencias y conocimientos adquiridos</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowQuizModal(false)} 
                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <QuizPlayer 
                evaluacion={evaluacion}
                onComplete={handleQuizComplete}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── Reproductor Iframe Seguro con Permisos Completos ─── */}
      <main className="flex-1 w-full h-full relative bg-white">
        {htmlContent ? (
          <iframe 
            srcDoc={htmlContent} 
            className="w-full h-full border-0 absolute inset-0 bg-white"
            title={ova.titulo}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads allow-popups-to-escape-sandbox"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs">
            <p className="font-bold">El archivo HTML está vacío o es inválido.</p>
          </div>
        )}
      </main>
    </div>
  );
}
