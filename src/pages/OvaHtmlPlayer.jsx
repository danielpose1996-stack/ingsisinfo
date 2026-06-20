import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { obtenerOvaPorId, registrarResultadoOva } from '../lib/supabase';
import { ArrowLeft, ExternalLink, Loader2, Award, X } from 'lucide-react';
import Button from '../components/Button';
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
        if (!data || data.tipo !== 'html') {
          throw new Error('OVA no encontrado o no es de tipo HTML válido.');
        }
        
        let parsedEvaluacion = null;
        if (data.actividad_final) {
          try {
            const parsed = JSON.parse(data.actividad_final);
            if (parsed && parsed.preguntas && parsed.preguntas.length > 0) {
              parsedEvaluacion = parsed;
            }
          } catch {
            // No quiz
          }
        }
        
        setOva(data);
        setEvaluacion(parsedEvaluacion);
        
        // Descargamos el contenido HTML directamente con fetch.
        // Esto evita que Supabase convierta forzosamente el tipo de archivo web a text/plain
        // por mecanismos de seguridad (lo cual era la causa del código en texto crudo).
        const res = await fetch(data.archivo_html_url);
        if (!res.ok) {
           throw new Error('No se pudo descargar el contenido HTML desde el repositorio.');
        }
        const htmlText = await res.text();
        
        // Extract base directory of the uploaded HTML file to resolve relative resources
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-12 h-12 text-[#1E3A8A] animate-spin mb-4" />
        <p className="text-foreground/40 italic font-bold">Cargando visualizador e interpretando HTML...</p>
      </div>
    );
  }

  if (error || !ova) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
        <p className="text-red-500 italic mb-6 text-center">Error: {error || 'No se pudo cargar el OVA.'}</p>
        {!isFullscreen && (
          <Button onClick={() => navigate(-1)} variant="outline" className="gap-2 italic">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Button>
        )}
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
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden relative">
      {/* HEADER NAV - Se oculta si es fullscreen */}
      {!isFullscreen && (
        <header className="h-16 shrink-0 border-b border-card-border bg-card flex items-center justify-between px-6 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl bg-background hover:bg-white/5 text-foreground/60 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-foreground italic uppercase tracking-tighter line-clamp-1">{ova.titulo}</h1>
              <p className="text-[10px] text-foreground/40 font-mono tracking-widest uppercase">Modo Visualización HTML</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {evaluacion && (
               <Button 
                 variant="primary" 
                 size="sm" 
                 className="gap-2 italic text-[10px] bg-[#1E3A8A] hover:bg-[#1E40AF] text-white border-none"
                 onClick={() => setShowQuizModal(true)}
               >
                 EVALUACIÓN FINAL <Award className="w-3.5 h-3.5" />
               </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 italic text-[10px]"
              onClick={() => window.open(`/ova-html/${ova.id}?fullscreen=true`, '_blank')}
            >
              EXPANDIR <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </div>
        </header>
      )}

      {/* QUIZ MODAL OVERLAY */}
      {showQuizModal && evaluacion && (
        <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col pt-8 px-4 sm:px-12 overflow-y-auto">
           <div className="max-w-4xl w-full mx-auto pb-20">
             <div className="flex justify-between items-center mb-10">
               <h2 className="text-2xl font-black italic text-foreground uppercase tracking-widest">
                 Evaluación <span className="text-[#1E3A8A]">Final</span>
               </h2>
               <button onClick={() => setShowQuizModal(false)} className="p-3 bg-card rounded-full hover:bg-white/10 text-foreground/60 hover:text-white transition-colors">
                 <X className="w-6 h-6" />
               </button>
             </div>
             <QuizPlayer 
               evaluacion={evaluacion}
               onComplete={handleQuizComplete}
             />
           </div>
        </div>
      )}

      {/* IFRAME PLAYER con srcDoc */}
      <main className="flex-1 w-full h-full relative bg-white">
        {htmlContent ? (
          <iframe 
            srcDoc={htmlContent} 
            className="w-full h-full border-none absolute inset-0"
            title={ova.titulo}
            sandbox="allow-scripts allow-forms"
            allowFullScreen
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-red-500 italic font-bold">El archivo HTML está vacío o es inválido.</p>
          </div>
        )}
      </main>
    </div>
  );
}
